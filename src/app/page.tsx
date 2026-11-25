import { DATA_SOURCE } from "@/lib/load-days";

export default function HomePage() {
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
          <code>Fuel_Code</code>. Hydro and HYD stay separate. No trim in v1.
        </li>
      </ul>
      <p className="note">
        Data source on these pages: <strong>{DATA_SOURCE}</strong>. The sibling
        lakehouse stays sealed; this app does not download EMI or query
        Databricks from the browser.
      </p>
    </main>
  );
}
