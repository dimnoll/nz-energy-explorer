"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FuelWindowRow, WindowStat } from "@/lib/types";

export function MixView({
  ranked,
  stat,
}: {
  ranked: FuelWindowRow[];
  stat: WindowStat;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      <div className="controls">
        <label>
          Window stat
          <select
            value={stat}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams.toString());
              if (event.target.value === "mean") {
                next.delete("stat");
              } else {
                next.set("stat", event.target.value);
              }
              const query = next.toString();
              router.replace(query ? `${pathname}?${query}` : pathname);
            }}
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
