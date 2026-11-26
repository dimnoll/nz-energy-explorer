# nz-energy-explorer

[English](#english) | [中文](#中文)

Read-only Next.js app over Gold tables from [nz-energy-lakehouse](https://github.com/dimnoll/nz-energy-lakehouse): weekday evening price spikes, plus national generation mix. It consumes an exported Gold snapshot from the sealed lakehouse.

**Status:** Pages read the gzip Gold snapshot in `data/gold/` (`gold-snapshot`). Window stats (`mean` / `median`, trim 0/1/3) are pure functions; `pnpm test` uses a three-node fixture for those functions.

---

## English

### Question

On weekdays, which grid nodes spike in **final energy price** after 17:00 NZ time?

A second question, same evening window, separate table: does **national generation mix** (EMI `Fuel_Code`, kWh) shift after 17:00 versus daytime?

### Why a second repo

The lakehouse already lands EMI CSVs, runs one Lakeflow pipeline, and has an AI/BI dashboard inside Databricks. This app is the public page for the same questions: mean vs median of daily evening/daytime ratios, and dropping each node's highest 0 / 1 / 3 days. The lakehouse README notes that a few extreme days lift the window mean.

The ranked Gold table `evening_spike_ranked` is a **mean, no trim** of those daily ratios. The explorer recomputes rank from `weekday_evening_node_prices`. Default `mean` + trim 0 matches that table on the same snapshot (same nodes; daily-mean ratios within 1e-12).

Generation mix is its own page. `Hydro` and `HYD` stay separate EMI labels. Price and generation windows can differ (daily price files vs monthly `Generation_MD`); they are listed separately.

### v1 pages

| Route | What it is |
| --- | --- |
| `/` | Question, metric definitions, snapshot window, licence |
| `/spikes` | Node rank + daily series (table and chart). Island/region (`unlabelled` = no EMI region), mean\|median, trim 0\|1\|3. Default series: `WTK0111` if present |
| `/mix` | Evening fuel share by `Fuel_Code`, plus selected-fuel daily series. Mean\|median only |

### Data

Snapshots in `data/gold/` (compact `.json.gz` plus `manifest.json`) come from:

- `nz_energy.gold.weekday_evening_node_prices`
- `nz_energy.gold.weekday_evening_fuel_mix`

This snapshot (exported 2026-11-25T20:54:56Z):

- Prices: 2026-08-18 to 2026-11-12 (63 weekdays)
- Generation mix: 2026-08-03 to 2026-10-30 (65 weekdays)

The explorer ranks from the daily price table; `evening_spike_ranked` is the check file for default mean + trim 0. Export runs on a laptop with a SQL warehouse. The app ships the snapshot in this repo.

Data licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: *www.emi.ea.govt.nz provided by the Electricity Authority (New Zealand)*.

### Development

```text
pnpm test
pnpm typecheck
pnpm dev
```

`pnpm test` covers mean/median/trim on a three-node fixture (`EXT0011` has one extreme day; `WTK0111` is the steady node). Pages and the default rank check use the Gold snapshot.

### Licence

- Repository code: [MIT](LICENSE)
- EMI-derived snapshots: CC BY 4.0, Electricity Authority (New Zealand)

---

## 中文

只读 Next.js 应用，数据来自 [nz-energy-lakehouse](https://github.com/dimnoll/nz-energy-lakehouse) 已导出的 Gold 日表：工作日晚间电价尖峰，以及全国发电结构。湖仓继续封口；本仓消费 `data/gold/` 里的快照。

**当前状态：** 页面读 `data/gold/` 里的 gzip Gold 快照（`gold-snapshot`）。窗口统计（mean / median，trim 0/1/3）是纯函数；`pnpm test` 用三条节点的 fixture 测这些函数。

### 问题

工作日、新西兰时间 **17:00 之后**，哪些节点的 **final energy price** 出现尖峰？

同一晚间窗口的第二句：全国 **发电结构**（EMI `Fuel_Code`，kWh）相对日间有没有变？另表。

### 为什么另开仓

湖仓已经完成落地、一条 Lakeflow、以及 workspace 里的 AI/BI。本仓是同一问题的公开页面：日 ratio 的均值对中位数，以及每个节点丢掉最高的 0 / 1 / 3 天。湖仓 README 写过，窗口均值会被少数极端日抬高。

`evening_spike_ranked` 是这些日 ratio 的 **均值、不 trim**。explorer 从 `weekday_evening_node_prices` 重算。默认 `mean` + trim 0 在同一快照上对得上那张排名表（同一批节点；日均 ratio 差在 1e-12 内）。

发电结构单独成页。`Hydro` 与 `HYD` 保持 EMI 原样。价格窗口（约 90 个日文件）和发电窗口（月文件）可以不一致，页面上分开写。

### v1 页面

| 路由 | 作用 |
| --- | --- |
| `/` | 问题、指标、快照窗口、许可 |
| `/spikes` | 节点排名 + 日序列（表和图）。岛/区域（`unlabelled` = 无 EMI 区域）、mean\|median、trim 0\|1\|3。默认序列 `WTK0111`（若有） |
| `/mix` | 分燃料晚间份额 + 选中燃料的日序列。mean\|median |

### 数据

`data/gold/` 快照（紧凑 `.json.gz` 加 `manifest.json`）来自上面两张 Gold 日表。本份导出时间 2026-11-25T20:54:56Z。价格窗口 2026-08-18 至 2026-11-12（63 个工作日）；发电窗口 2026-08-03 至 2026-10-30（65 个工作日）。排名从日表重算；`evening_spike_ranked` 用来核对默认 mean + trim 0。导出在本机用 SQL warehouse 跑。应用带的是本仓里的快照。

数据许可：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。署名：*www.emi.ea.govt.nz provided by the Electricity Authority (New Zealand)*。

### 开发

```text
pnpm test
pnpm typecheck
pnpm dev
```

`pnpm test` 用三条节点的 fixture 覆盖 mean/median/trim（`EXT0011` 有一天极端值；`WTK0111` 平稳）。页面和默认对账用的是 Gold 快照。

### 许可

- 本仓库代码：[MIT](LICENSE)
- 由 EMI 导出的快照：CC BY 4.0，Electricity Authority（新西兰）
