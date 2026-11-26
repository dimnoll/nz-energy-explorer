import { fuelDailySeries, rankFuels } from "@/lib/aggregate";
import { DATA_SOURCE, loadFuelDays } from "@/lib/load-days";
import { parseOptionalFilter, parseWindowStat } from "@/lib/query";
import { MixView } from "./mix-view";

type MixPageProps = {
  searchParams: Promise<{ stat?: string; fuel?: string }>;
};

export default async function MixPage({ searchParams }: MixPageProps) {
  const params = await searchParams;
  const days = loadFuelDays();
  const stat = parseWindowStat(params.stat);
  const ranked = rankFuels(days, stat);
  const requested = parseOptionalFilter(params.fuel);
  const seriesFuel =
    requested && ranked.some((row) => row.fuel_code === requested)
      ? requested
      : (ranked[0]?.fuel_code ?? "");
  const series = seriesFuel ? fuelDailySeries(days, seriesFuel) : [];

  return (
    <main>
      <h1>Mix</h1>
      <p className="note">
        Source: {DATA_SOURCE}. National evening kWh share by EMI Fuel_Code. Not
        a price chart; Hydro and HYD are not merged.
      </p>
      <MixView
        ranked={ranked}
        series={series}
        seriesFuel={seriesFuel}
        stat={stat}
      />
    </main>
  );
}
