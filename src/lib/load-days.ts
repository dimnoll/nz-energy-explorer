import fuelFixture from "./fixtures/fuel_days.json";
import nodeFixture from "./fixtures/node_days.json";
import type { FuelDayRow, NodeDayRow } from "./types";

export const DATA_SOURCE = "fixture" as const;

export function loadNodeDays(): NodeDayRow[] {
  return nodeFixture as NodeDayRow[];
}

export function loadFuelDays(): FuelDayRow[] {
  return fuelFixture as FuelDayRow[];
}
