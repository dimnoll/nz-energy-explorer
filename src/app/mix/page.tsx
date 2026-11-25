import { DATA_SOURCE, loadFuelDays } from "@/lib/load-days";
import { MixView } from "./mix-view";

export default function MixPage() {
  const days = loadFuelDays();
  return (
    <main>
      <h1>Mix</h1>
      <p className="note">
        Source: {DATA_SOURCE}. National evening kWh share by EMI Fuel_Code. Not
        a price chart; Hydro and HYD are not merged.
      </p>
      <MixView days={days} />
    </main>
  );
}
