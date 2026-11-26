"""Export Gold daily tables to data/gold/ as compact gzip JSON.

Run on a laptop that can reach a SQL warehouse. Do not import this from Next.js.
Credentials come from `.env` (copy `.env.example`) or the process environment; never commit them.

  DATABRICKS_HOST          workspace host, no https://
  DATABRICKS_TOKEN         PAT
  DATABRICKS_HTTP_PATH     /sql/1.0/warehouses/<id>
"""

from __future__ import annotations

import gzip
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from databricks import sql
except ImportError:
    sys.stderr.write(
        "Install export extras first: python -m pip install -r requirements-export.txt\n"
    )
    raise SystemExit(1)

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "data" / "gold"
ENV_FILE = ROOT / ".env"
NODE_FILE = "weekday_evening_node_prices.json.gz"
FUEL_FILE = "weekday_evening_fuel_mix.json.gz"
LEGACY_JSON = (
    "weekday_evening_node_prices.json",
    "weekday_evening_fuel_mix.json",
)


def _load_dotenv(path: Path) -> None:
    """Load KEY=VALUE lines into os.environ if the key is not already set."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value

NODE_SQL = """
SELECT
  CAST(trading_date AS STRING) AS trading_date,
  point_of_connection,
  island,
  network_reporting_region,
  daytime_avg_dollars_per_mwh,
  evening_avg_dollars_per_mwh,
  evening_to_daytime_ratio,
  daytime_period_count,
  evening_period_count
FROM nz_energy.gold.weekday_evening_node_prices
ORDER BY trading_date, point_of_connection
"""

FUEL_SQL = """
SELECT
  CAST(trading_date AS STRING) AS trading_date,
  fuel_code,
  daytime_kwh,
  evening_kwh,
  daytime_total_kwh,
  evening_total_kwh,
  daytime_share,
  evening_share
FROM nz_energy.gold.weekday_evening_fuel_mix
ORDER BY trading_date, fuel_code
"""


def _env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing environment variable {name}")
    return value


def _http_path() -> str:
    """Accept the SQL connector path, or the browser /sql/warehouses/<id>?o= form."""
    path = _env("DATABRICKS_HTTP_PATH")
    if "?" in path:
        path = path.split("?", 1)[0]
    browser = re.fullmatch(r"/sql/warehouses/([0-9a-fA-F]+)/?", path)
    if browser:
        path = f"/sql/1.0/warehouses/{browser.group(1)}"
    if not re.fullmatch(r"/sql/1\.0/warehouses/[0-9a-fA-F]+", path):
        raise SystemExit(
            "DATABRICKS_HTTP_PATH should be /sql/1.0/warehouses/<id> from the "
            "warehouse Connection details, not the browser URL."
        )
    return path


def _hostname() -> str:
    host = _env("DATABRICKS_HOST")
    for prefix in ("https://", "http://"):
        if host.lower().startswith(prefix):
            host = host[len(prefix) :]
    return host.split("/")[0]


def _cell(value: object) -> object:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()[:10]
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


def write_gzip_json(path: Path, payload: object) -> None:
    body = json.dumps(
        payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False
    ).encode("utf-8")
    with gzip.open(path, "wb", compresslevel=9) as handle:
        handle.write(body)


def _remove_legacy_pretty_json() -> None:
    for name in LEGACY_JSON:
        leftover = OUT_DIR / name
        if leftover.is_file():
            leftover.unlink()


def fetch_rows(query: str) -> list[dict[str, object]]:
    connection = sql.connect(
        server_hostname=_hostname(),
        http_path=_http_path(),
        access_token=_env("DATABRICKS_TOKEN"),
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            return [
                {columns[i]: _cell(row[i]) for i in range(len(columns))}
                for row in cursor.fetchall()
            ]
    finally:
        connection.close()


def main() -> None:
    _load_dotenv(ENV_FILE)
    node_rows = fetch_rows(NODE_SQL)
    fuel_rows = fetch_rows(FUEL_SQL)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_gzip_json(OUT_DIR / NODE_FILE, node_rows)
    write_gzip_json(OUT_DIR / FUEL_FILE, fuel_rows)
    _remove_legacy_pretty_json()
    manifest = {
        "exported_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "catalog_schema": "nz_energy.gold",
        "tables": {
            "weekday_evening_node_prices": {
                "rows": len(node_rows),
                "file": NODE_FILE,
            },
            "weekday_evening_fuel_mix": {
                "rows": len(fuel_rows),
                "file": FUEL_FILE,
            },
        },
        "note": (
            "Daily Gold only. Rank is recomputed in the app; "
            "evening_spike_ranked is not exported."
        ),
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {len(node_rows)} node-day rows and {len(fuel_rows)} fuel-day rows to {OUT_DIR}"
    )


if __name__ == "__main__":
    main()
