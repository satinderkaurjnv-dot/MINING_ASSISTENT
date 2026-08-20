"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type ChartData = {
  label: string;
  value: number;
};

export type MiningChartData = {
  type: "bar" | "line" | "pie" | "doughnut";
  title: string;
  unit?: string;
  data: ChartData[];
};

type MiningChartProps = {
  chart: MiningChartData;
};

export default function MiningChart({
  chart,
}: MiningChartProps) {
  const {
    type,
    title,
    unit,
    data,
  } = chart;

  if (!data || data.length === 0) {
    return null;
  }

  const tooltipFormatter = (value: any) => {
    if (typeof value === "number") {
      return `${value.toLocaleString()} ${
        unit || ""
      }`.trim();
    }

    return `${value} ${
      unit || ""
    }`.trim();
  };

  /*
  ==================================================
  DYNAMIC BAR CHART HEIGHT
  ==================================================

  Long labels need more vertical space.
  This works globally for any number of items.
  */

  const barChartHeight =
    Math.max(320, data.length * 55);

  return (
   <div
  style={{
    width: "100%",
    marginTop: "16px",
    padding: "10px",
    borderRadius: "14px",
    background: "#fff",
    border: "1px solid #e5e5e5",
    boxSizing: "border-box",
  }}
>
    
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          width: "100%",
          height:
            type === "bar"
              ? `${barChartHeight}px`
              : "320px",
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          {type === "line" ? (
            /*
            ==================================================
            LINE CHART
            ==================================================
            */

            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 40,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
                angle={-20}
                textAnchor="end"
                interval={0}
              />

              <YAxis />

              <Tooltip
                formatter={
                  tooltipFormatter
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="value"
                name={unit || "Value"}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          ) : type === "pie" ||
            type === "doughnut" ? (
            /*
            ==================================================
            PIE / DOUGHNUT
            ==================================================
            */

            <PieChart>
              <Tooltip
                formatter={
                  tooltipFormatter
                }
              />

              <Legend />

              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={
                  type === "doughnut"
                    ? 55
                    : 0
                }
                label
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                  />
                ))}
              </Pie>
            </PieChart>
          ) : (
            /*
            ==================================================
            HORIZONTAL BAR CHART
            ==================================================

            IMPORTANT:

            Horizontal bars prevent long labels from
            overlapping.

            No company names are hard-coded.
            Works for any numerical comparison.
            ==================================================
            */

            <BarChart
              layout="vertical"
              data={data}
              margin={{
  top: 5,
  right: 5,
  left: 0,
  bottom: 5,
}}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                tickFormatter={(value) =>
                  value.toLocaleString()
                }
              />

              <YAxis
  type="category"
  dataKey="label"
  width={85}
  tick={{
    fontSize: 11,
  }}
/>

              <Tooltip
                formatter={
                  tooltipFormatter
                }
              />

              <Legend />

              <Bar
                dataKey="value"
                name={unit || "Value"}
                radius={[
                  0,
                  6,
                  6,
                  0,
                ]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}