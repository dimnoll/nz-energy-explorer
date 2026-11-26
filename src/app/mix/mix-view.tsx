import Link from "next/link";
import { FilterForm } from "@/app/filter-form";
import { WeekdaySeriesChart } from "@/app/weekday-series-chart";
import { mixHref } from "@/lib/query";
import type { FuelDayRow, FuelWindowRow, WindowStat } from "@/lib/types";

function formatShare(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function MixView({
  ranked,
  series,
  seriesFuel,
  stat,
}: {
  ranked: FuelWindowRow[];
  series: FuelDayRow[];
  seriesFuel: string;
  stat: WindowStat;
}) {
  const chartPoints = series.map((row) => ({
    trading_date: row.trading_date,
    evening_share: row.evening_share,
    daytime_share: row.daytime_share,
  }));

  return (
    <>
      <FilterForm action="/mix">
        <input type="hidden" name="fuel" value={seriesFuel} />
        <label>
          Window stat
          <select name="stat" defaultValue={stat}>
            <option value="mean">mean</option>
            <option value="median">median</option>
          </select>
        </label>
      </FilterForm>
      <table>
        <thead>
          <tr>
            <th>Fuel_Code</th>
            <th>Evening share</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr key={row.fuel_code}>
              <td>
                <Link
                  className="row"
                  href={mixHref({ stat, fuel: row.fuel_code })}
                  aria-current={row.fuel_code === seriesFuel ? "page" : undefined}
                >
                  {row.fuel_code}
                </Link>
              </td>
              <td>{formatShare(row.evening_share)}</td>
              <td>{row.weekday_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Daily series: {seriesFuel || "none"}</h2>
      <p className="note">
        Each point is a weekday in the generation snapshot, which is not joined
        to the price window. Hydro and HYD (and Wind / WIN) stay separate EMI
        labels.
      </p>
      <WeekdaySeriesChart
        points={chartPoints}
        lines={[
          {
            dataKey: "evening_share",
            name: "Evening share",
            color: "#0b57d0",
            dots: false,
          },
          {
            dataKey: "daytime_share",
            name: "Daytime share",
            color: "#6b5a3c",
            dots: false,
          },
        ]}
        yFormat="share"
      />
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Daytime share</th>
            <th>Evening share</th>
          </tr>
        </thead>
        <tbody>
          {series.map((row) => (
            <tr key={row.trading_date}>
              <td>{row.trading_date}</td>
              <td>{formatShare(row.daytime_share)}</td>
              <td>{formatShare(row.evening_share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
