# Agent notes for nz-energy-explorer

本仓库是公开的 **Next.js 数据应用**：把 `nz-energy-lakehouse` 已经算好的 Gold 日表做成可筛选的只读页面。不跑 Lakeflow，不下载 EMI，不改 lakehouse。

湖仓仓已封口。本仓只消费 **导出的 Gold 快照**（日粒度），在浏览器里重算窗口统计。聊天记录放 `portfolio-chatlogs`，不要提交进本仓。

## Where to change what

| 区域 | 路径 | 该写什么 | 不该写什么 |
|------|------|----------|------------|
| 门面 | `README.md` | 中英双语：问题、快照来源、许可、页面、限制 | 尚未用快照算出来的「业务洞察」；把本仓写成湖仓 ETL |
| 合同 | `AGENTS.md` | 目录、硬约束、commit 规则 | 本机 Python 路径、workspace URL、warehouse HTTP path、个人 catalog |
| 本机覆盖 | `AGENTS.local.md` | 导出脚本用的 CLI profile / warehouse（gitignore） | 提交进 git |
| 快照 | `data/gold/` | `weekday_evening_node_prices` 与 `weekday_evening_fuel_mix` 的导出 + `manifest.json` | 半小时 Silver、原始 EMI CSV、`evening_spike_ranked` 当源表 |
| 导出 | `src/export/` | 本机用 SQL warehouse 拉 Gold、写成快照 | 从浏览器或 Vercel 打 Databricks；在 Databricks 计算里拉 EMI |
| 应用 | `src/app/`、`src/lib/` | App Router 页面；均值/中位数/trim 的纯函数 | 登录、上传 CSV、SHAP、FastAPI、地图、把 Fuel_Code 并进节点排名 |
| 说明图 | `docs/` | 以后的页面截图 | 第三方课程截图；把湖仓 DAG 冒充本仓流水线 |

先读本文件 + `README.md`，再改代码。本机差异只放 `AGENTS.local.md`（可从 `AGENTS.local.md.example` 复制）。

## 目录架构

```text
src/app/           # Next.js App Router：/  /spikes  /mix
src/lib/           # 窗口统计（mean/median/trim）纯函数 + 类型
src/export/        # 本机从 Gold 导出快照（export_gold.py）
data/gold/         # 提交的日表快照（`.json.gz` + `manifest.json`）
docs/
README.md
AGENTS.md
AGENTS.local.md    # gitignore
LICENSE            # 代码 MIT
```

## 硬约束（不得写反）

| 项 | 值 |
|----|-----|
| 问题 | 与湖仓相同：工作日 NZ 时间 17:00 之后，哪些节点 final energy price 尖峰。第二句：全国发电结构（EMI `Fuel_Code`）晚间相对日间有没有变。两句不要并成一张表 |
| 源表 | 只读 `nz_energy.gold.weekday_evening_node_prices` 与 `nz_energy.gold.weekday_evening_fuel_mix`。应用内重算排名，**不要**把 `evening_spike_ranked` 当筛选源 |
| 日表粒度 | 价格：工作日日期 × 节点。发电：工作日日期 × `Fuel_Code`。窗口统计只聚合这些日行 |
| 窗口统计 | 对每个节点，在 trim 之后的日 `evening_to_daytime_ratio` 上取 `mean` 或 `median`。默认 `mean` + trim 0，须能对上湖仓 `evening_spike_ranked`（同一快照） |
| trim | 每个节点按日 ratio **降序丢掉最高的 0 / 1 / 3 天**，再算窗口统计。不是全国统一删日历，也不是半小时层重算 |
| 发电页 | 对每个 `Fuel_Code`，在日 `evening_share` 上取 mean 或 median。v1 **不做** trim。`Hydro` 与 `HYD`（以及 `Wind` / `WIN`）保持 EMI 原样，不合并 |
| 两个窗口 | 价格约 90 个日文件的工作日；发电是月文件工作日，起止可以更早。页面上分开写，不要按日期硬 join 假装同一窗口 |
| 快照 | 日表导出可以进 git（体积小、演示需要）。原始 EMI CSV、半小时价格、`.env`、token **不进 git** |
| 运行时 | 浏览器和 Vercel **不**持有 Databricks token，**不**查 SQL warehouse。导出只在本机跑 |
| 数据许可 | EMI CC BY 4.0；署名 `www.emi.ea.govt.nz provided by the Electricity Authority (New Zealand)` |
| 代码许可 | MIT（见 `LICENSE`） |
| 产品名 | Lakeflow pipelines、Spark Declarative Pipelines、AI/BI dashboard、Declarative Automation Bundles。不要把 DLT / Repos / Asset Bundles 写成现行名 |
| 日期 | 用真实 author/committer 时间。不要设置 `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` |

本仓只包含这个前端与快照导出。不要把湖仓 SQL、Academy 材料、聊天记录、其他目录里的密钥加进来。

## 页面（v1）

| 路由 | 作用 |
|------|------|
| `/` | 问题、指标定义、快照窗口、许可、限制。不是营销首页 |
| `/spikes` | 节点表 + 选中节点的日序列。控件：island / region、mean\|median、trim 0\|1\|3。默认序列节点 `WTK0111`（若快照里有） |
| `/mix` | 分燃料晚间份额。控件：mean\|median。不是电价图 |

v1 不做：用户上传、登录、What-If、SHAP、地图、Databricks Apps、Celery、第二套商业域。

## Do not

- 改 `nz-energy-lakehouse` 的文件或重新打开那条 pipeline 范围
- 把 EMI CSV、半小时 Silver、密钥、workspace token 推进 git
- 从 Next.js、Vercel 或 Databricks 计算直连 EMI blob
- 在应用里重算半小时均价来「纠正」Gold（日表已经是 TP15–34 vs TP≥35 的日均）
- 把 `Fuel_Code` 并进节点排名
- 把尚未用快照算出来的结论写进 README
- `git push`、打 tag、对忽略文件 `git add -f`
- 给 commit 加 Cursor / Copilot 的 `Co-authored-by`
- 改写历史提交日期

## After each change (commit workflow)

完成一轮改动、未发现问题、且用户未说先不提交时再 commit。

1. Conventional Commits 的 **summary（subject）**
2. **description 写 1–3 句**：为什么改、边界是什么。不要空 body，也不要写成变更清单长文
3. **不要** `git push`；由用户实机检查后自行推送或撤回
4. 改动跨边界时分批 commit（例如 `.gitignore` + `LICENSE` / `README.md` / `AGENTS.md` / 快照 / 应用）

若改动有明显问题或未完成，则先修或说明，不要空提交，也不要打 tag。

### 资源与 gitignore

- **禁止**对忽略规则命中的文件使用 `git add -f` / `git add --force`
- 勿提交密钥、`.env`、账号 cookie、Databricks token
- 原始 EMI CSV 只存在湖仓的 `data/landing/` 或 Volume，不进本仓
- `data/gold/` 的日表快照 **要**提交；不要把它写进 gitignore
