import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { type BarDataPoint, trackEvent } from "@/lib/analytics";

interface FeatureBarChartProps {
  data: BarDataPoint[];
  selectedFeature: string | null;
  onSelectFeature: (name: string) => void;
}

const COLORS = [
  "hsl(199, 89%, 48%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(346, 77%, 50%)",
  "hsl(199, 60%, 60%)",
];

const FeatureBarChart = ({ data, selectedFeature, onSelectFeature }: FeatureBarChartProps) => {
  const handleClick = (entry: any) => {
    if (entry?.feature_name) {
      onSelectFeature(entry.feature_name);
      trackEvent("bar_chart_click");
    }
  };

  return (
    <div className="glass-card p-6 space-y-3">
      <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
        Feature Usage
      </h3>
      <div className="h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No data available. Try seeding or adjusting filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} onClick={(e) => e?.activePayload && handleClick(e.activePayload[0]?.payload)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis
                dataKey="feature_name"
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
                  color: "#ffffff",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#ffffff" }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} cursor="pointer">
                {data.map((entry, index) => (
                  <Cell
                    key={entry.feature_name}
                    fill={COLORS[index % COLORS.length]}
                    opacity={selectedFeature && selectedFeature !== entry.feature_name ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default FeatureBarChart;
