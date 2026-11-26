# nz-energy-explorer

[English](#english) | [中文](#中文)

Read-only Next.js app over Gold tables from [nz-energy-lakehouse](https://github.com/dimnoll/nz-energy-lakehouse): weekday evening price spikes, plus national generation mix. The lakehouse stays sealed; this repo does not run Lakeflow or download EMI.

**Status:** Pages read the gzip Gold snapshot in `data/gold/` (`gold-snapshot`). Window stats (`mean` / `median`, trim 0/1/3) stay pure functions; `pnpm test` still uses the fixture JSON. No deploy yet.

---

## English

### Question

On weekdays, which grid nodes spike in **final energy price** after 17:00 NZ time?

A second question, same evening window, separate table: does **national generation mix** (EMI `Fuel_Code`, kWh) shift after 17:00 versus daytime?

### Why a second repo

The lakehouse already lands EMI CSVs, runs one Lakeflow pipeline, and has an AI/BI dashboard inside Databricks. This app is the public surface: mean vs median of daily evening/daytime ratios, and dropping each node's highest 0 / 1 / 3 days — the window mean in the lakehouse README is lifted by a few extreme days.

The ranked Gold table `evening_spike_ranked` is a **mean, no trim** of those daily ratios. The explorer recomputes rank from `weekday_evening_node_prices`. Default `mean` + trim 0 should match that table on the same snapshot.

Generation mix is not joined onto node ranks. `Hydro` and `HYD` stay separate EMI labels. Price and generation windows can differ (daily price files vs monthly `Generation_MD`).

### v1 pages

| Route | What it is |
| --- | --- |
| `/` | Question, metric definitions, snapshot window, licence, limits |
| `/spikes` | Node rank + daily series (table and chart). Island/region (`unlabelled` = no EMI region), mean\|median, trim 0\|1\|3. Default series: `WTK0111` if present |
| `/mix` | Evening fuel share by `Fuel_Code`, plus selected-fuel daily series. Mean\|median only |

Not in v1: upload, auth, maps, SHAP, live Databricks from the browser.

### Data

Snapshots in `data/gold/` (compact `.json.gz` plus `manifest.json`) come from:

- `nz_energy.gold.weekday_evening_node_prices`
- `nz_energy.gold.weekday_evening_fuel_mix`

This snapshot (exported 2026-11-25T20:54:56Z):

- Prices: 2026-08-18 to 2026-11-12 (63 weekdays)
- Generation mix: 2026-08-03 to 2026-10-30 (65 weekdays)

The two windows are not joined on date. Default `mean` + trim 0 is checked against `evening_spike_ranked` on this snapshot (same nodes; daily-mean ratios within 1e-12). That ranked table is not the filter source. Export runs on a laptop with a SQL warehouse. The deployed app ships the snapshot only. Raw EMI CSVs are not in this repo.

Data licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: *www.emi.ea.govt.nz provided by the Electricity Authority (New Zealand)*.

### Development

```text
pnpm test
pnpm typecheck
pnpm dev
```

`pnpm test` covers mean/median/trim on the fixture (one extreme day at `EXT0011`; `WTK0111` is the steady node) and, when the Gold snapshot is present, mean + trim 0 against `evening_spike_ranked`. Do not treat fixture ranks as EMI insights.

### Licence

- Repository code: [MIT](LICENSE)
- EMI-derived snapshots: CC BY 4.0, Electricity Authority (New Zealand)

---

## 中文

只读 Next.js 应用，数据来自 [nz-energy-lakehouse](https://github.com/dimnoll/nz-energy-lakehouse) 的 Gold 日表：工作日晚间电价尖峰，以及全国发电结构。湖仓继续封口；本仓不跑 Lakeflow，不下载 EMI。

**当前状态：** 页面读 `data/gold/` 里的 gzip Gold 快照（`gold-snapshot`）。窗口统计（mean / median，trim 0/1/3）仍是纯函数；`pnpm test` 继续用 fixture JSON。尚未部署。

### 问题

工作日、新西兰时间 **17:00 之后**，哪些节点的 **final energy price** 出现尖峰？

同一晚间窗口的第二句：全国 **发电结构**（EMI `Fuel_Code`，kWh）相对日间有没有变？另表，不并进节点排名。

### 为什么另开仓

湖仓已经完成落地、一条 Lakeflow、以及 workspace 里的 AI/BI 两页。本仓是给面试官能点的面：日 ratio 的均值对中位数，以及每个节点丢掉最高的 0 / 1 / 3 天——湖仓 README 已写过，窗口均值会被少数极端日抬高。

`evening_spike_ranked` 是这些日 ratio 的 **均值、不 trim**。explorer 从 `weekday_evening_node_prices` 重算。默认 `mean` + trim 0 在同一快照上应对得上那张排名表。

发电结构不并进节点排名。`Hydro` 与 `HYD` 保持 EMI 原样。价格窗口（约 90 个日文件）和发电窗口（月文件）可以不一致。

### v1 页面

| 路由 | 作用 |
| --- | --- |
| `/` | 问题、指标、快照窗口、许可、限制 |
| `/spikes` | 节点排名 + 日序列（表和图）。岛/区域（`unlabelled` = 无 EMI 区域）、mean\|median、trim 0\|1\|3。默认序列 `WTK0111`（若有） |
| `/mix` | 分燃料晚间份额 + 选中燃料的日序列。只有 mean\|median |

v1 不做：上传、登录、地图、SHAP、浏览器直连 Databricks。

### 数据

`data/gold/` 快照（紧凑 `.json.gz` 加 `manifest.json`）来自上面两张 Gold 日表。本份导出时间 2026-11-25T20:54:56Z。价格窗口 2026-08-18 至 2026-11-12（63 个工作日）；发电窗口 2026-08-03 至 2026-10-30（65 个工作日）。两窗口不按日期 join。默认 mean + trim 0 已在本快照上对过 `evening_spike_ranked`（同一批节点；日均 ratio 差在 1e-12 内）。排名表不是筛选源。导出只在本机用 SQL warehouse 跑；线上只带快照。原始 EMI CSV 不在本仓。

数据许可：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。署名：*www.emi.ea.govt.nz provided by the Electricity Authority (New Zealand)*。

### 开发

```text
pnpm test
pnpm typecheck
pnpm dev
```

`pnpm test` 用 fixture 覆盖 mean/median/trim（`EXT0011` 有一天极端值；`WTK0111` 是平稳节点）；有 Gold 快照时还会对 mean + trim 0 与 `evening_spike_ranked`。不要把 fixture 排名当成 EMI 结论。

### 许可

- 本仓库代码：[MIT](LICENSE)
- 由 EMI 导出的快照：CC BY 4.0，Electricity Authority（新西兰）
