import Link from "next/link";
import { FilterForm } from "@/app/filter-form";
import { WeekdaySeriesChart } from "@/app/weekday-series-chart";
import { highestRatioDates } from "@/lib/aggregate";
import type { RegionOptionGroup } from "@/lib/aggregate";
import { spikesHref } from "@/lib/query";
import type { NodeDayRow, NodeWindowRow, TrimHighestDays, WindowStat } from "@/lib/types";
import { TRIM_OPTIONS, UNLABELLED_REGION } from "@/lib/types";

export function SpikesView({
  ranked,
  series,
  seriesNode,
  stat,
  trim,
  island,
  islands,
  region,
  regionOptions,
}: {
  ranked: NodeWindowRow[];
  series: NodeDayRow[];
  seriesNode: string;
  stat: WindowStat;
  trim: TrimHighestDays;
  island: string;
  islands: string[];
  region: string;
  regionOptions: { hasUnlabelled: boolean; groups: RegionOptionGroup[] };
}) {
  const trimmedDates = new Set(highestRatioDates(series, trim));
  const chartPoints = series.map((row) => ({
    trading_date: row.trading_date,
    ratio: row.evening_to_daytime_ratio,
    trimmedRatio: trimmedDates.has(row.trading_date)
      ? row.evening_to_daytime_ratio
      : null,
  }));

  const regionSelect = (group: RegionOptionGroup) =>
    group.regions.map((value) => (
      <option key={value} value={value}>
        {value}
      </option>
    ));

  return (
    <>
      <FilterForm action="/spikes">
        <input type="hidden" name="node" value={seriesNode} />
        <label>
          Window stat
          <select name="stat" defaultValue={stat}>
            <option value="mean">mean</option>
            <option value="median">median</option>
          </select>
        </label>
        <label>
          Trim highest days
          <select name="trim" defaultValue={String(trim)}>
            {TRIM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Island
          <select name="island" defaultValue={island}>
            <option value="">all</option>
            {islands.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Region
          <select name="region" defaultValue={region}>
            <option value="">all</option>
            {regionOptions.hasUnlabelled ? (
              <option value={UNLABELLED_REGION}>unlabelled</option>
            ) : null}
            {regionOptions.groups.length === 1
              ? regionSelect(regionOptions.groups[0]!)
              : regionOptions.groups.map((group) => (
                  <optgroup key={group.island} label={group.island}>
                    {regionSelect(group)}
                  </optgroup>
                ))}
          </select>
        </label>
      </FilterForm>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>POC</th>
            <th>Island</th>
            <th>Region</th>
            <th>Ratio</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr key={row.point_of_connection}>
              <td>{row.spike_rank}</td>
              <td>
                <Link
                  className="row"
                  href={spikesHref({
                    stat,
                    trim,
                    island,
                    region,
                    node: row.point_of_connection,
                  })}
                  aria-current={
                    row.point_of_connection === seriesNode ? "page" : undefined
                  }
                >
                  {row.point_of_connection}
                </Link>
              </td>
              <td>{row.island ?? ""}</td>
              <td>{row.network_reporting_region ?? ""}</td>
              <td>{row.ratio.toFixed(3)}</td>
              <td>{row.weekday_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Daily series: {seriesNode || "none"}</h2>
      <p className="note">
        Each point is a weekday in the snapshot. Weekends are not plotted, so
        Friday sits next to Monday. Trim changes the window rank above; every
        day stays on this chart{trim > 0
          ? `, with the highest ${trim} ratio day(s) marked.`
          : "."}
      </p>
      <WeekdaySeriesChart
        points={chartPoints}
        lines={[
          {
            dataKey: "ratio",
            name: "Evening / daytime",
            color: "#0b57d0",
            dots: false,
          },
          ...(trim > 0
            ? [
                {
                  dataKey: "trimmedRatio",
                  name: "Dropped by trim",
                  color: "#a32d2d",
                  stroke: "none",
                },
              ]
            : []),
        ]}
        yFormat="ratio"
      />
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Daytime $/MWh</th>
            <th>Evening $/MWh</th>
            <th>Ratio</th>
          </tr>
        </thead>
        <tbody>
          {series.map((row) => (
            <tr key={row.trading_date}>
              <td>{row.trading_date}</td>
              <td>{row.daytime_avg_dollars_per_mwh.toFixed(1)}</td>
              <td>{row.evening_avg_dollars_per_mwh.toFixed(1)}</td>
              <td>{row.evening_to_daytime_ratio.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
