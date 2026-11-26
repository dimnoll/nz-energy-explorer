import { nodeDailySeries, rankNodes } from "@/lib/aggregate";
import { DATA_SOURCE, loadNodeDays } from "@/lib/load-days";
import {
  parseOptionalFilter,
  parseTrimHighestDays,
  parseWindowStat,
} from "@/lib/query";
import { SpikesView } from "./spikes-view";

const DEFAULT_NODE = "WTK0111";

type SpikesPageProps = {
  searchParams: Promise<{
    stat?: string;
    trim?: string;
    island?: string;
    node?: string;
  }>;
};

export default async function SpikesPage({ searchParams }: SpikesPageProps) {
  const params = await searchParams;
  const days = loadNodeDays();
  const stat = parseWindowStat(params.stat);
  const trim = parseTrimHighestDays(params.trim);
  const island = parseOptionalFilter(params.island);
  const ranked = rankNodes(days, {
    stat,
    trimHighestDays: trim,
    island,
  });
  const requested = params.node || DEFAULT_NODE;
  const seriesNode = ranked.some((row) => row.point_of_connection === requested)
    ? requested
    : (ranked[0]?.point_of_connection ?? DEFAULT_NODE);
  const series = nodeDailySeries(days, seriesNode);
  const islands = [
    ...new Set(days.map((row) => row.island).filter(Boolean)),
  ].sort() as string[];

  return (
    <main>
      <h1>Spikes</h1>
      <p className="note">
        Source: {DATA_SOURCE}. Mean + trim 0 is the lakehouse rank definition.
        Median or trim 1/3 is this app&apos;s extra window.
      </p>
      <SpikesView
        ranked={ranked}
        series={series}
        seriesNode={seriesNode}
        stat={stat}
        trim={trim}
        island={island ?? ""}
        islands={islands}
      />
    </main>
  );
}
