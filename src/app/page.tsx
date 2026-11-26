import {
  DATA_SOURCE,
  loadFuelDays,
  loadGoldManifest,
  loadNodeDays,
  weekdayWindow,
} from "@/lib/load-days";

function formatWindow(
  label: string,
  window: { start: string; end: string; weekdayDays: number } | null,
): string {
  if (!window) {
    return `${label}: no weekday rows`;
  }
  return `${label}: ${window.start} to ${window.end} (${window.weekdayDays} weekdays)`;
}

export default function HomePage() {
  const priceWindow = weekdayWindow(loadNodeDays());
  const mixWindow = weekdayWindow(loadFuelDays());
  const manifest = loadGoldManifest();

  return (
    <main>
      <h1>Weekday evening spikes</h1>
      <p>
        On weekdays, which grid nodes spike in final energy price after 17:00 NZ
        time? A second question, same window, separate table: does national
        generation mix shift after 17:00 versus daytime?
      </p>
      <h2>Metrics</h2>
      <ul>
        <li>
          Daily ratio: evening mean (TradingPeriod ≥ 35) divided by daytime mean
          (TP 15–34). That grain is Gold{" "}
          <code>weekday_evening_node_prices</code>.
        </li>
        <li>
          Window rank: mean or median of those daily ratios, after dropping each
          node&apos;s highest 0, 1, or 3 days. Default mean + trim 0 matches
          lakehouse <code>evening_spike_ranked</code> on the same snapshot.
        </li>
        <li>
          Mix page: mean or median of daily evening kWh share by EMI{" "}
          <code>Fuel_Code</code>. Hydro and HYD stay separate EMI labels. Trim
          stays on the spikes page.
        </li>
      </ul>
      <h2>Snapshot windows</h2>
      <p>
        Price and generation windows are listed separately. The generation Gold
        table can start earlier because it comes from monthly files.
      </p>
      <ul>
        <li>{formatWindow("Prices", priceWindow)}</li>
        <li>{formatWindow("Generation mix", mixWindow)}</li>
      </ul>
      <p className="note">
        Data source on these pages: <strong>{DATA_SOURCE}</strong>
        {manifest ? ` (exported ${manifest.exported_at_utc})` : ""}. Pages ship
        the snapshot in this repo. The sibling lakehouse stays sealed.
      </p>
    </main>
  );
}
