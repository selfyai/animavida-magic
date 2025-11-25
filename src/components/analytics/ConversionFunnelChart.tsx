import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ConversionFunnelChartProps {
  data: {
    totalViews: number;
    totalClicks: number;
    totalVideos: number;
  } | null;
}

export default function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  if (!data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🎯 Funil de Conversão</h3>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          Nenhum dado de conversão disponível
        </div>
      </Card>
    );
  }

  const chartData = [
    {
      name: "Ideias Clicadas",
      value: data.totalClicks,
      fill: "hsl(var(--chart-1))",
    },
    {
      name: "Vídeos Gerados",
      value: data.totalVideos,
      fill: "hsl(var(--chart-2))",
    },
  ];

  const conversionRate =
    data.totalClicks > 0 ? ((data.totalVideos / data.totalClicks) * 100).toFixed(1) : "0";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🎯 Funil de Conversão</h3>
        <div className="text-sm text-muted-foreground">
          Taxa de conversão: <span className="font-bold text-primary">{conversionRate}%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
