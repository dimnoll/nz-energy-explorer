"use client";

import { useMemo, useState } from "react";
import { rankFuels } from "@/lib/aggregate";
import type { FuelDayRow, WindowStat } from "@/lib/types";

export function MixView({ days }: { days: FuelDayRow[] }) {
  const [stat, setStat] = useState<WindowStat>("mean");
  const ranked = useMemo(() => rankFuels(days, stat), [days, stat]);

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
      </div>
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
              <td>{row.fuel_code}</td>
              <td>{(row.evening_share * 100).toFixed(1)}%</td>
              <td>{row.weekday_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
