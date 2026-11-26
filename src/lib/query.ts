import type { TrimHighestDays, WindowStat } from "./types";
import { TRIM_OPTIONS, WINDOW_STATS } from "./types";

export function parseWindowStat(value: string | undefined): WindowStat {
  if (value && (WINDOW_STATS as readonly string[]).includes(value)) {
    return value as WindowStat;
  }
  return "mean";
}

export function parseTrimHighestDays(
  value: string | undefined,
): TrimHighestDays {
  const n = Number(value);
  if ((TRIM_OPTIONS as readonly number[]).includes(n)) {
    return n as TrimHighestDays;
  }
  return 0;
}

export function parseOptionalFilter(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  return value;
}
