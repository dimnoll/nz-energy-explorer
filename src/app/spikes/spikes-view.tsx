"use client";

import { useMemo, useState } from "react";
import { nodeDailySeries, rankNodes } from "@/lib/aggregate";
import type { NodeDayRow, TrimHighestDays, WindowStat } from "@/lib/types";
import { TRIM_OPTIONS } from "@/lib/types";

const DEFAULT_NODE = "WTK0111";

export function SpikesView({ days }: { days: NodeDayRow[] }) {
  const [stat, setStat] = useState<WindowStat>("mean");
  const [trim, setTrim] = useState<TrimHighestDays>(0);
  const [island, setIsland] = useState<string>("");
  const [selected, setSelected] = useState(DEFAULT_NODE);

  const islands = useMemo(() => {
    return [...new Set(days.map((row) => row.island).filter(Boolean))] as string[];
  }, [days]);

  const ranked = useMemo(() => {
    return rankNodes(days, {
      stat,
      trimHighestDays: trim,
      island: island || null,
    });
  }, [days, island, stat, trim]);

  const seriesNode = ranked.some((row) => row.point_of_connection === selected)
    ? selected
    : (ranked[0]?.point_of_connection ?? DEFAULT_NODE);
  const series = nodeDailySeries(days, seriesNode);

  return (
    <>
      <div className="controls">
        <label>
          Window stat
          <select
            value={stat}
            onChange={(event) => setStat(event.target.value as WindowStat)}
          >
            <option value="mean">mean</option>
            <option value="median">median</option>
          </select>
        </label>
        <label>
          Trim highest days
          <select
            value={trim}
            onChange={(event) =>
              setTrim(Number(event.target.value) as TrimHighestDays)
            }
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
            onChange={(event) => setIsland(event.target.value)}
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
                  onClick={() => setSelected(row.point_of_connection)}
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
