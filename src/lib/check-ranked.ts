import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { rankNodes } from "./aggregate";
import type { NodeDayRow, RankedCheckRow } from "./types";

const RANKED_CHECK = join(
  process.cwd(),
  "data",
  "gold",
  "checks",
  "evening_spike_ranked.json.gz",
);

/** JSON round-trip can collapse a 1 ULP Spark gap into a JS tie. */
const RATIO_TOLERANCE = 1e-12;

export function hasRankedCheck(): boolean {
  return existsSync(RANKED_CHECK);
}

export function loadRankedCheck(): RankedCheckRow[] {
  const json = gunzipSync(readFileSync(RANKED_CHECK)).toString("utf8");
  return JSON.parse(json) as RankedCheckRow[];
}

export function meanTrim0MatchesRanked(
  days: readonly NodeDayRow[],
  expected: readonly RankedCheckRow[],
): void {
  const got = rankNodes(days, { stat: "mean", trimHighestDays: 0 });
  const expectedByPoc = new Map(
    expected.map((row) => [row.point_of_connection, row]),
  );
  if (got.length !== expected.length) {
    throw new Error(
      `node count ${got.length} !== ranked check ${expected.length}`,
    );
  }
  for (const row of got) {
    const check = expectedByPoc.get(row.point_of_connection);
    if (!check) {
      throw new Error(`extra node ${row.point_of_connection}`);
    }
    if (Number(check.weekday_days) !== row.weekday_days) {
      throw new Error(
        `${row.point_of_connection} days ${row.weekday_days} !== ${check.weekday_days}`,
      );
    }
    const delta = Math.abs(
      row.ratio - Number(check.mean_evening_to_daytime_ratio),
    );
    if (delta > RATIO_TOLERANCE) {
      throw new Error(`${row.point_of_connection} ratio delta ${delta}`);
    }
  }

  const jsOrder = [...got]
    .sort((a, b) => {
      if (b.ratio !== a.ratio) {
        return b.ratio - a.ratio;
      }
      return a.point_of_connection.localeCompare(b.point_of_connection);
    })
    .map((row) => row.point_of_connection);
  const lakeOrder = [...expected]
    .sort((a, b) => {
      const ar = Number(a.mean_evening_to_daytime_ratio);
      const br = Number(b.mean_evening_to_daytime_ratio);
      if (br !== ar) {
        return br - ar;
      }
      return a.point_of_connection.localeCompare(b.point_of_connection);
    })
    .map((row) => row.point_of_connection);

  const swaps: string[] = [];
  for (let i = 0; i < jsOrder.length; i += 1) {
    if (jsOrder[i] === lakeOrder[i]) {
      continue;
    }
    const jsRatio = got.find((row) => row.point_of_connection === jsOrder[i])!.ratio;
    const lakeRatio = Number(
      expectedByPoc.get(lakeOrder[i]!)!.mean_evening_to_daytime_ratio,
    );
    if (Math.abs(jsRatio - lakeRatio) > RATIO_TOLERANCE) {
      swaps.push(`${i}:${jsOrder[i]} vs ${lakeOrder[i]}`);
    }
  }
  if (swaps.length > 0) {
    throw new Error(`ratio order differs: ${swaps.join("; ")}`);
  }
}
