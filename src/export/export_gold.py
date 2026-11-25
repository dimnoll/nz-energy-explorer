"""Export Gold daily tables to data/gold/ JSON.

Run on a laptop that can reach a SQL warehouse. Do not import this from Next.js.
Credentials come from `.env` (copy `.env.example`) or the process environment; never commit them.

  DATABRICKS_HOST          workspace host, no https://
  DATABRICKS_TOKEN         PAT
  DATABRICKS_HTTP_PATH     /sql/1.0/warehouses/<id>
"""

from __future__ import annotations

import json
import os
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


def _cell(value: object) -> object:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()[:10]
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


def fetch_rows(query: str) -> list[dict[str, object]]:
    connection = sql.connect(
        server_hostname=_env("DATABRICKS_HOST"),
        http_path=_env("DATABRICKS_HTTP_PATH"),
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
    (OUT_DIR / "weekday_evening_node_prices.json").write_text(
        json.dumps(node_rows, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    (OUT_DIR / "weekday_evening_fuel_mix.json").write_text(
        json.dumps(fuel_rows, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    manifest = {
        "exported_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "catalog_schema": "nz_energy.gold",
        "tables": {
            "weekday_evening_node_prices": {
                "rows": len(node_rows),
                "file": "weekday_evening_node_prices.json",
            },
            "weekday_evening_fuel_mix": {
                "rows": len(fuel_rows),
                "file": "weekday_evening_fuel_mix.json",
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
