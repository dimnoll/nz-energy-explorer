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

export function spikesHref(options: {
  stat?: string;
  trim?: string | number;
  island?: string | null;
  region?: string | null;
  node?: string;
}): string {
  const params = new URLSearchParams();
  if (options.stat && options.stat !== "mean") {
    params.set("stat", options.stat);
  }
  if (options.trim != null && Number(options.trim) !== 0) {
    params.set("trim", String(options.trim));
  }
  if (options.island) {
    params.set("island", options.island);
  }
  if (options.region) {
    params.set("region", options.region);
  }
  if (options.node) {
    params.set("node", options.node);
  }
  const query = params.toString();
  return query ? `/spikes?${query}` : "/spikes";
}

export function mixHref(options: { stat?: string; fuel?: string }): string {
  const params = new URLSearchParams();
  if (options.stat && options.stat !== "mean") {
    params.set("stat", options.stat);
  }
  if (options.fuel) {
    params.set("fuel", options.fuel);
  }
  const query = params.toString();
  return query ? `/mix?${query}` : "/mix";
}
