# data/

`gold/` holds **exported daily Gold tables** from Unity Catalog, not EMI CSVs.

| File | Source table | Grain |
| --- | --- | --- |
| `weekday_evening_node_prices.json.gz` | `nz_energy.gold.weekday_evening_node_prices` | weekday date × node |
| `weekday_evening_fuel_mix.json.gz` | `nz_energy.gold.weekday_evening_fuel_mix` | weekday date × EMI `Fuel_Code` |
| `checks/evening_spike_ranked.json.gz` | `nz_energy.gold.evening_spike_ranked` | node (mean, no trim). Check only |
| `manifest.json` | export metadata | window, row counts, export time |

`evening_spike_ranked` is exported in the same warehouse session so `mean` + trim 0 can be compared. The app still ranks from the daily price table.

Snapshots are compact gzip JSON (no pretty-print). Do not commit uncompressed `.json` for these tables.

Export (laptop only, never from the Next.js app):

```text
copy .env.example .env
python -m pip install -r requirements-export.txt
python src/export/export_gold.py
```

Fill `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, and `DATABRICKS_HTTP_PATH` in `.env`. Do not put `.env` in git. The script loads that file; it does not read `AGENTS.local.md`.

The app ranks nodes from the daily price table (mean or median of `evening_to_daytime_ratio`, optional trim). Do not treat `evening_spike_ranked` as the filter source.

Raw EMI CSVs stay in the sibling lakehouse repo (`data/landing/`, gitignored there) or the UC Volume. Do not copy them here.

Data licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: *www.emi.ea.govt.nz provided by the Electricity Authority (New Zealand)*.
