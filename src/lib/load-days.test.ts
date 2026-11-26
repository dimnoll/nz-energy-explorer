import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { rankNodes } from "./aggregate";
import {
  hasRankedCheck,
  loadRankedCheck,
  meanTrim0MatchesRanked,
} from "./check-ranked";
import {
  DATA_SOURCE,
  loadFuelDays,
  loadGoldManifest,
  loadNodeDays,
  weekdayWindow,
} from "./load-days";
import nodeFixture from "./fixtures/node_days.json";
import type { NodeDayRow } from "./types";

const GOLD_DIR = join(process.cwd(), "data", "gold");
const hasSnapshot =
  existsSync(join(GOLD_DIR, "weekday_evening_node_prices.json.gz")) &&
  existsSync(join(GOLD_DIR, "weekday_evening_fuel_mix.json.gz"));

describe("weekdayWindow", () => {
  it("counts unique dates on the fixture", () => {
    const window = weekdayWindow(nodeFixture as NodeDayRow[]);
    expect(window).toEqual({
      start: "2026-10-12",
      end: "2026-10-16",
      weekdayDays: 5,
    });
  });
});

describe("load-days source", () => {
  it("uses the gold gzip snapshot when both files are present", () => {
    expect(DATA_SOURCE).toBe(hasSnapshot ? "gold-snapshot" : "fixture");
  });
});

describe("gold snapshot grain", () => {
  it.skipIf(!hasSnapshot)("matches the manifest row counts and keeps WTK0111", () => {
    const manifest = loadGoldManifest();
    expect(manifest).not.toBeNull();
    const nodes = loadNodeDays();
    const fuels = loadFuelDays();
    expect(nodes).toHaveLength(manifest!.tables.weekday_evening_node_prices.rows);
    expect(fuels).toHaveLength(manifest!.tables.weekday_evening_fuel_mix.rows);

    const priceWindow = weekdayWindow(nodes);
    const mixWindow = weekdayWindow(fuels);
    expect(priceWindow?.weekdayDays).toBeGreaterThan(1);
    expect(mixWindow?.weekdayDays).toBeGreaterThan(1);

    const ranked = rankNodes(nodes, { stat: "mean", trimHighestDays: 0 });
    expect(ranked.some((row) => row.point_of_connection === "WTK0111")).toBe(
      true,
    );
    expect(ranked.length).toBeGreaterThan(200);
  });
});

describe("evening_spike_ranked check", () => {
  it.skipIf(!hasSnapshot || !hasRankedCheck())(
    "mean + trim 0 matches the lakehouse rank on this snapshot",
    () => {
      const expected = loadRankedCheck();
      const manifest = loadGoldManifest();
      expect(expected).toHaveLength(
        manifest?.checks?.evening_spike_ranked.rows ?? expected.length,
      );
      meanTrim0MatchesRanked(loadNodeDays(), expected);
    },
  );
});
