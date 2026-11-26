import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import fuelFixture from "./fixtures/fuel_days.json";
import nodeFixture from "./fixtures/node_days.json";
import type { FuelDayRow, NodeDayRow } from "./types";

const GOLD_DIR = join(process.cwd(), "data", "gold");
const NODE_GZ = join(GOLD_DIR, "weekday_evening_node_prices.json.gz");
const FUEL_GZ = join(GOLD_DIR, "weekday_evening_fuel_mix.json.gz");
const MANIFEST_PATH = join(GOLD_DIR, "manifest.json");

export type DataSource = "gold-snapshot" | "fixture";

export type GoldManifest = {
  exported_at_utc: string;
  catalog_schema: string;
  tables: {
    weekday_evening_node_prices: { rows: number; file: string };
    weekday_evening_fuel_mix: { rows: number; file: string };
  };
  note: string;
};

export type WeekdayWindow = {
  start: string;
  end: string;
  weekdayDays: number;
};

function hasGoldSnapshot(): boolean {
  return existsSync(NODE_GZ) && existsSync(FUEL_GZ);
}

export const DATA_SOURCE: DataSource = hasGoldSnapshot()
  ? "gold-snapshot"
  : "fixture";

function readGzipJson<T>(path: string): T {
  return JSON.parse(gunzipSync(readFileSync(path)).toString("utf8")) as T;
}

export function loadNodeDays(): NodeDayRow[] {
  if (hasGoldSnapshot()) {
    return readGzipJson<NodeDayRow[]>(NODE_GZ);
  }
  return nodeFixture as NodeDayRow[];
}

export function loadFuelDays(): FuelDayRow[] {
  if (hasGoldSnapshot()) {
    return readGzipJson<FuelDayRow[]>(FUEL_GZ);
  }
  return fuelFixture as FuelDayRow[];
}

export function loadGoldManifest(): GoldManifest | null {
  if (!existsSync(MANIFEST_PATH)) {
    return null;
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as GoldManifest;
}

export function weekdayWindow(
  days: readonly { trading_date: string }[],
): WeekdayWindow | null {
  const unique = [...new Set(days.map((row) => row.trading_date))].sort();
  if (unique.length === 0) {
    return null;
  }
  return {
    start: unique[0]!,
    end: unique[unique.length - 1]!,
    weekdayDays: unique.length,
  };
}
