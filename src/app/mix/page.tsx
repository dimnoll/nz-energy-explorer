import { rankFuels } from "@/lib/aggregate";
import { DATA_SOURCE, loadFuelDays } from "@/lib/load-days";
import { parseWindowStat } from "@/lib/query";
import { MixView } from "./mix-view";

type MixPageProps = {
  searchParams: Promise<{ stat?: string }>;
};

export default async function MixPage({ searchParams }: MixPageProps) {
  const params = await searchParams;
  const days = loadFuelDays();
  const stat = parseWindowStat(params.stat);
  const ranked = rankFuels(days, stat);

  return (
    <main>
      <h1>Mix</h1>
      <p className="note">
        Source: {DATA_SOURCE}. National evening kWh share by EMI Fuel_Code. Not
        a price chart; Hydro and HYD are not merged.
      </p>
      <MixView ranked={ranked} stat={stat} />
    </main>
  );
}
