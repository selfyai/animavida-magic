import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeekdayData {
  day: string;
  dayNumber: number;
  videos: number;
  clicks: number;
  conversionRate: number;
}

interface WeekdayChartProps {
  data: WeekdayData[];
}

export default function WeekdayChart({ data }: WeekdayChartProps) {
  const chartData = data.map((d) => ({
    name: d.day,
    "Vídeos Gerados": d.videos,
    "Taxa de Conversão (%)": parseFloat(d.conversionRate.toFixed(1)),
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📅 Performance por Dia da Semana</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-sm"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            yAxisId="left"
            className="text-sm"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            label={{
              value: "Vídeos",
              angle: -90,
              position: "insideLeft",
              style: { fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-sm"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            label={{
              value: "Conversão (%)",
              angle: 90,
              position: "insideRight",
              style: { fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="Vídeos Gerados"
            fill="hsl(var(--primary))"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="Taxa de Conversão (%)"
            fill="hsl(var(--accent))"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
