"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WeekdayChartLine = {
  dataKey: string;
  name: string;
  color: string;
  stroke?: string;
  dots?: boolean;
};

export type WeekdayChartPoint = {
  trading_date: string;
} & Record<string, string | number | boolean | null | undefined>;

function shortDate(value: string): string {
  return value.length >= 10 ? value.slice(5) : value;
}

function formatRatio(value: number): string {
  return value.toFixed(2);
}

function formatShare(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Category axis: one tick per weekday. Do not use a calendar time scale. */
export function WeekdaySeriesChart({
  points,
  lines,
  yFormat = "ratio",
}: {
  points: readonly WeekdayChartPoint[];
  lines: readonly WeekdayChartLine[];
  yFormat?: "ratio" | "share";
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  if (points.length === 0) {
    return <p className="note">No weekday rows for this series.</p>;
  }

  const tick = yFormat === "share" ? formatShare : formatRatio;

  return (
    <div className="chart" aria-label="Weekday series">
      {ready ? (
        <ResponsiveContainer width="100%" height={256}>
          <LineChart
            data={[...points]}
            margin={{ top: 8, right: 12, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke="#d9d3c7" strokeDasharray="3 3" />
            <XAxis
              dataKey="trading_date"
              tickFormatter={shortDate}
              minTickGap={28}
              interval="equidistantPreserveStart"
            />
            <YAxis tickFormatter={tick} width={56} domain={["auto", "auto"]} />
            <Tooltip
              labelFormatter={(label) => String(label)}
              formatter={(value, name) => {
                if (typeof value !== "number") {
                  return ["", name];
                }
                return [tick(value), name];
              }}
            />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="linear"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.stroke ?? line.color}
                fill={line.color}
                strokeWidth={line.stroke === "none" ? 0 : 2}
                dot={
                  line.dots === false
                    ? false
                    : { r: line.stroke === "none" ? 4 : 2 }
                }
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
