export const TRIM_OPTIONS = [0, 1, 3] as const;
export type TrimHighestDays = (typeof TRIM_OPTIONS)[number];

export const WINDOW_STATS = ["mean", "median"] as const;
export type WindowStat = (typeof WINDOW_STATS)[number];

/** URL/UI sentinel for nodes whose Gold region is null. Not an EMI label. */
export const UNLABELLED_REGION = "unlabelled";

/** One row of `nz_energy.gold.weekday_evening_node_prices`. */
export type NodeDayRow = {
  trading_date: string;
  point_of_connection: string;
  island: string | null;
  network_reporting_region: string | null;
  daytime_avg_dollars_per_mwh: number;
  evening_avg_dollars_per_mwh: number;
  evening_to_daytime_ratio: number;
  daytime_period_count: number;
  evening_period_count: number;
};

/** One row of `nz_energy.gold.weekday_evening_fuel_mix`. */
export type FuelDayRow = {
  trading_date: string;
  fuel_code: string;
  daytime_kwh: number;
  evening_kwh: number;
  daytime_total_kwh: number;
  evening_total_kwh: number;
  daytime_share: number;
  evening_share: number;
};

export type NodeWindowRow = {
  point_of_connection: string;
  island: string | null;
  network_reporting_region: string | null;
  window_stat: WindowStat;
  trim_highest_days: TrimHighestDays;
  weekday_days: number;
  dropped_days: number;
  ratio: number;
  spike_rank: number;
};

export type FuelWindowRow = {
  fuel_code: string;
  window_stat: WindowStat;
  weekday_days: number;
  evening_share: number;
};

/** One row of `nz_energy.gold.evening_spike_ranked` (check file only). */
export type RankedCheckRow = {
  spike_rank: number;
  point_of_connection: string;
  island: string | null;
  network_reporting_region: string | null;
  mean_daytime_dollars_per_mwh: number;
  mean_evening_dollars_per_mwh: number;
  mean_evening_to_daytime_ratio: number;
  weekday_days: number;
};
