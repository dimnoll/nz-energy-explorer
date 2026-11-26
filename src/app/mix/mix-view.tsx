import { FilterForm } from "@/app/filter-form";
import type { FuelWindowRow, WindowStat } from "@/lib/types";

export function MixView({
  ranked,
  stat,
}: {
  ranked: FuelWindowRow[];
  stat: WindowStat;
}) {
  return (
    <>
      <FilterForm action="/mix">
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
