# data/

`gold/` holds **exported daily Gold tables** from Unity Catalog, not EMI CSVs.

| File (planned) | Source table | Grain |
| --- | --- | --- |
| `weekday_evening_node_prices.json` | `nz_energy.gold.weekday_evening_node_prices` | weekday date × node |
| `weekday_evening_fuel_mix.json` | `nz_energy.gold.weekday_evening_fuel_mix` | weekday date × EMI `Fuel_Code` |
| `manifest.json` | export metadata | window, row counts, export time |

Export (laptop only, never from the Next.js app):

```text
python -m pip install -r requirements-export.txt
python src/export/export_gold.py
```

Needs `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, and `DATABRICKS_HTTP_PATH`. Do not put those in git.

The app ranks nodes from the daily price table (mean or median of `evening_to_daytime_ratio`, optional trim). Do not treat `evening_spike_ranked` as the filter source.

Raw EMI CSVs stay in the sibling lakehouse repo (`data/landing/`, gitignored there) or the UC Volume. Do not copy them here.

Data licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: *www.emi.ea.govt.nz provided by the Electricity Authority (New Zealand)*.
