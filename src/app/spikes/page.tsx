import { DATA_SOURCE, loadNodeDays } from "@/lib/load-days";
import { SpikesView } from "./spikes-view";

export default function SpikesPage() {
  const days = loadNodeDays();
  return (
    <main>
      <h1>Spikes</h1>
      <p className="note">
        Source: {DATA_SOURCE}. Mean + trim 0 is the lakehouse rank definition.
        Median or trim 1/3 is this app&apos;s extra window.
      </p>
      <SpikesView days={days} />
    </main>
  );
}
