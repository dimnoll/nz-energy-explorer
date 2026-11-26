"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { NodeDayRow, NodeWindowRow, TrimHighestDays, WindowStat } from "@/lib/types";
import { TRIM_OPTIONS } from "@/lib/types";

function replaceQuery(
  pathname: string,
  searchParams: URLSearchParams,
  router: ReturnType<typeof useRouter>,
  updates: Record<string, string>,
): void {
  const next = new URLSearchParams(searchParams.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  const query = next.toString();
  router.replace(query ? `${pathname}?${query}` : pathname);
}

export function SpikesView({
  ranked,
  series,
  seriesNode,
  stat,
  trim,
  island,
  islands,
}: {
  ranked: NodeWindowRow[];
  series: NodeDayRow[];
  seriesNode: string;
  stat: WindowStat;
  trim: TrimHighestDays;
  island: string;
  islands: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setQuery(updates: Record<string, string>): void {
    replaceQuery(pathname, new URLSearchParams(searchParams.toString()), router, updates);
  }

  return (
    <>
      <div className="controls">
        <label>
          Window stat
          <select
            value={stat}
            onChange={(event) => setQuery({ stat: event.target.value })}
          >
            <option value="mean">mean</option>
            <option value="median">median</option>
          </select>
        </label>
        <label>
          Trim highest days
          <select
            value={trim}
            onChange={(event) => setQuery({ trim: event.target.value })}
          >
            {TRIM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Island
          <select
            value={island}
            onChange={(event) => setQuery({ island: event.target.value })}
          >
            <option value="">all</option>
            {islands.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
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
                <button
                  className="row"
                  type="button"
                  aria-pressed={row.point_of_connection === seriesNode}
                  onClick={() => setQuery({ node: row.point_of_connection })}
                >
                  {row.point_of_connection}
                </button>
              </td>
              <td>{row.island ?? ""}</td>
              <td>{row.network_reporting_region ?? ""}</td>
              <td>{row.ratio.toFixed(3)}</td>
              <td>{row.weekday_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Daily series: {seriesNode}</h2>
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
