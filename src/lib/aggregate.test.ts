import { describe, expect, it } from "vitest";
import {
  dropHighest,
  fuelDailySeries,
  highestRatioDates,
  mean,
  median,
  nodeDailySeries,
  rankFuels,
  rankNodes,
  regionFilterApplies,
  spikeRegionOptions,
} from "./aggregate";
import { UNLABELLED_REGION } from "./types";
import fuelDays from "./fixtures/fuel_days.json";
import nodeDays from "./fixtures/node_days.json";
import type { FuelDayRow, NodeDayRow } from "./types";

const nodes = nodeDays as NodeDayRow[];
const fuels = fuelDays as FuelDayRow[];

describe("mean / median / dropHighest", () => {
  it("averages and splits even medians", () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("drops the highest n values", () => {
    expect(dropHighest([1.0, 1.2, 1.4, 1.6, 4.0], 1).sort((a, b) => a - b)).toEqual(
      [1.0, 1.2, 1.4, 1.6],
    );
    expect(dropHighest([1, 2], 3)).toEqual([]);
  });
});

describe("rankNodes", () => {
  it("mean with no trim ranks the extreme node first (lakehouse default)", () => {
    const ranked = rankNodes(nodes, { stat: "mean", trimHighestDays: 0 });
    expect(ranked.map((row) => row.point_of_connection)).toEqual([
      "EXT0011",
      "WTK0111",
      "LOW0011",
    ]);
    expect(ranked[0]!.ratio).toBeCloseTo(1.84, 10);
    expect(ranked[1]!.ratio).toBeCloseTo(1.5, 10);
    expect(ranked[2]!.ratio).toBeCloseTo(0.8, 10);
  });

  it("median with no trim puts the steady node above the extreme node", () => {
    const ranked = rankNodes(nodes, { stat: "median", trimHighestDays: 0 });
    expect(ranked.map((row) => row.point_of_connection)).toEqual([
      "WTK0111",
      "EXT0011",
      "LOW0011",
    ]);
    expect(ranked[0]!.ratio).toBeCloseTo(1.5, 10);
    expect(ranked[1]!.ratio).toBeCloseTo(1.4, 10);
  });

  it("trimming the top day of EXT0011 drops it below WTK0111 on the mean", () => {
    const ranked = rankNodes(nodes, { stat: "mean", trimHighestDays: 1 });
    expect(ranked[0]!.point_of_connection).toBe("WTK0111");
    expect(ranked[1]!.point_of_connection).toBe("EXT0011");
    expect(ranked[1]!.ratio).toBeCloseTo(1.3, 10);
    expect(ranked[1]!.dropped_days).toBe(1);
    expect(ranked[1]!.weekday_days).toBe(4);
  });

  it("filters by island without merging the remaining nodes", () => {
    const ranked = rankNodes(nodes, {
      stat: "mean",
      trimHighestDays: 0,
      island: "NI",
    });
    expect(ranked.map((row) => row.point_of_connection)).toEqual([
      "EXT0011",
      "WTK0111",
    ]);
  });

  it("filters by EMI region without merging the remaining nodes", () => {
    const ranked = rankNodes(nodes, {
      stat: "mean",
      trimHighestDays: 0,
      networkReportingRegion: "Waitaki",
    });
    expect(ranked.map((row) => row.point_of_connection)).toEqual(["WTK0111"]);
  });

  it("unlabelled keeps only nodes with a missing Gold region", () => {
    const extra: NodeDayRow = {
      trading_date: "2026-10-12",
      point_of_connection: "UNL0011",
      island: null,
      network_reporting_region: null,
      daytime_avg_dollars_per_mwh: 100,
      evening_avg_dollars_per_mwh: 110,
      evening_to_daytime_ratio: 1.1,
      daytime_period_count: 20,
      evening_period_count: 14,
    };
    const ranked = rankNodes([...nodes, extra], {
      stat: "mean",
      trimHighestDays: 0,
      networkReportingRegion: UNLABELLED_REGION,
    });
    expect(ranked.map((row) => row.point_of_connection)).toEqual(["UNL0011"]);
  });
});

describe("regionFilterApplies", () => {
  it("ignores a region that does not occur on the selected island", () => {
    expect(regionFilterApplies(nodes, "SI", "Waitaki")).toBe(false);
    expect(regionFilterApplies(nodes, "NI", "Waitaki")).toBe(true);
    expect(regionFilterApplies(nodes, null, UNLABELLED_REGION)).toBe(false);
  });
});

describe("spikeRegionOptions", () => {
  it("groups fixture regions by island and has no unlabelled option", () => {
    const options = spikeRegionOptions(nodes, null);
    expect(options.hasUnlabelled).toBe(false);
    expect(options.groups.map((group) => group.island)).toEqual(["NI", "SI"]);
    expect(options.groups[0]!.regions).toEqual(["Auckland", "Waitaki"]);
  });
});

describe("nodeDailySeries", () => {
  it("returns WTK0111 dates in order", () => {
    const series = nodeDailySeries(nodes, "WTK0111");
    expect(series).toHaveLength(5);
    expect(series.map((row) => row.trading_date)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
  });
});

describe("highestRatioDates", () => {
  it("marks EXT0011's 4.0 day when trim is 1, and none when trim is 0", () => {
    const series = nodeDailySeries(nodes, "EXT0011");
    expect(highestRatioDates(series, 0)).toEqual([]);
    expect(highestRatioDates(series, 1)).toEqual(["2026-10-16"]);
    expect(highestRatioDates(series, 3)).toEqual([
      "2026-10-16",
      "2026-10-15",
      "2026-10-14",
    ]);
  });
});

describe("fuelDailySeries", () => {
  it("keeps Hydro separate from HYD and orders Hydro weekdays", () => {
    const hydro = fuelDailySeries(fuels, "Hydro");
    const hyd = fuelDailySeries(fuels, "HYD");
    expect(hydro.map((row) => row.trading_date)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
    expect(hyd).toHaveLength(5);
    expect(hydro.every((row) => row.fuel_code === "Hydro")).toBe(true);
    expect(hyd.every((row) => row.fuel_code === "HYD")).toBe(true);
  });
});

describe("rankFuels", () => {
  it("keeps Hydro and HYD as separate EMI labels", () => {
    const ranked = rankFuels(fuels, "mean");
    const codes = ranked.map((row) => row.fuel_code);
    expect(codes).toContain("Hydro");
    expect(codes).toContain("HYD");
    expect(codes).toHaveLength(2);
  });

  it("median of Hydro evening share ignores the 0.55 day relative to the mean", () => {
    const byMean = rankFuels(fuels, "mean").find((row) => row.fuel_code === "Hydro");
    const byMedian = rankFuels(fuels, "median").find(
      (row) => row.fuel_code === "Hydro",
    );
    expect(byMean?.evening_share).toBeCloseTo(0.442, 10);
    expect(byMedian?.evening_share).toBeCloseTo(0.42, 10);
  });
});
