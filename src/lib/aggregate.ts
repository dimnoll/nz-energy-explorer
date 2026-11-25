import type {
  FuelDayRow,
  FuelWindowRow,
  NodeDayRow,
  NodeWindowRow,
  TrimHighestDays,
  WindowStat,
} from "./types";

export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError("mean of empty list");
  }
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError("median of empty list");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Drop the n largest values. Remaining order is not kept. */
export function dropHighest(
  values: readonly number[],
  n: number,
): number[] {
  if (n <= 0) {
    return [...values];
  }
  return [...values].sort((a, b) => b - a).slice(n);
}

function windowValue(values: readonly number[], stat: WindowStat): number {
  return stat === "mean" ? mean(values) : median(values);
}

function maxLabel(values: readonly (string | null)[]): string | null {
  const present = values.filter((value): value is string => {
    return value != null && value !== "";
  });
  if (present.length === 0) {
    return null;
  }
  return present.reduce((best, value) => (value > best ? value : best));
}

function denseRankByRatio(rows: NodeWindowRow[]): NodeWindowRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.ratio !== a.ratio) {
      return b.ratio - a.ratio;
    }
    return a.point_of_connection.localeCompare(b.point_of_connection);
  });
  let rank = 0;
  let lastRatio: number | null = null;
  return sorted.map((row) => {
    if (lastRatio === null || row.ratio !== lastRatio) {
      rank += 1;
      lastRatio = row.ratio;
    }
    return { ...row, spike_rank: rank };
  });
}

export function rankNodes(
  days: readonly NodeDayRow[],
  options: {
    stat: WindowStat;
    trimHighestDays: TrimHighestDays;
    island?: string | null;
    networkReportingRegion?: string | null;
  },
): NodeWindowRow[] {
  const filtered = days.filter((row) => {
    if (options.island && row.island !== options.island) {
      return false;
    }
    if (
      options.networkReportingRegion &&
      row.network_reporting_region !== options.networkReportingRegion
    ) {
      return false;
    }
    return true;
  });

  const byNode = new Map<string, NodeDayRow[]>();
  for (const row of filtered) {
    const list = byNode.get(row.point_of_connection);
    if (list) {
      list.push(row);
    } else {
      byNode.set(row.point_of_connection, [row]);
    }
  }

  const windows: NodeWindowRow[] = [];
  for (const [pointOfConnection, nodeDays] of byNode) {
    const ratios = nodeDays.map((row) => row.evening_to_daytime_ratio);
    const remaining = dropHighest(ratios, options.trimHighestDays);
    if (remaining.length === 0) {
      continue;
    }
    windows.push({
      point_of_connection: pointOfConnection,
      island: maxLabel(nodeDays.map((row) => row.island)),
      network_reporting_region: maxLabel(
        nodeDays.map((row) => row.network_reporting_region),
      ),
      window_stat: options.stat,
      trim_highest_days: options.trimHighestDays,
      weekday_days: remaining.length,
      dropped_days: ratios.length - remaining.length,
      ratio: windowValue(remaining, options.stat),
      spike_rank: 0,
    });
  }

  return denseRankByRatio(windows);
}

export function nodeDailySeries(
  days: readonly NodeDayRow[],
  pointOfConnection: string,
): NodeDayRow[] {
  return days
    .filter((row) => row.point_of_connection === pointOfConnection)
    .slice()
    .sort((a, b) => a.trading_date.localeCompare(b.trading_date));
}

export function rankFuels(
  days: readonly FuelDayRow[],
  stat: WindowStat,
): FuelWindowRow[] {
  const byFuel = new Map<string, number[]>();
  for (const row of days) {
    const list = byFuel.get(row.fuel_code);
    if (list) {
      list.push(row.evening_share);
    } else {
      byFuel.set(row.fuel_code, [row.evening_share]);
    }
  }

  const windows: FuelWindowRow[] = [];
  for (const [fuelCode, shares] of byFuel) {
    windows.push({
      fuel_code: fuelCode,
      window_stat: stat,
      weekday_days: shares.length,
      evening_share: windowValue(shares, stat),
    });
  }

  return windows.sort((a, b) => {
    if (b.evening_share !== a.evening_share) {
      return b.evening_share - a.evening_share;
    }
    return a.fuel_code.localeCompare(b.fuel_code);
  });
}
