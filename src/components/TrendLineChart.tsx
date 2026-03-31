import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type LineDataPoint } from "@/lib/analytics";

interface TrendLineChartProps {
  data: LineDataPoint[];
  featureName: string | null;
}

const TrendLineChart = ({ data, featureName }: TrendLineChartProps) => {
  return (
    <div className="glass-card p-6 space-y-3">
      <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
        {featureName ? `Daily Trend: ${featureName}` : "Select a feature from the bar chart"}
      </h3>
      <div className="h-[300px]">
        {!featureName || data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            {featureName ? "No trend data for this feature." : "Click a bar above to view its daily trend."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(215, 16%, 55%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(222, 30%, 18%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(215, 16%, 55%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(222, 30%, 18%)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 40%, 10%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 92%)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2}
                dot={{ fill: "hsl(160, 84%, 39%)", r: 4 }}
                activeDot={{ r: 6, fill: "hsl(160, 84%, 50%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TrendLineChart;
