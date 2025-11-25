import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TimelineChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export default function TimelineChart({ data }: TimelineChartProps) {
  const chartData = data.map((item) => ({
    data: new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    videos: item.count,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">📈 Vídeos Gerados ao Longo do Tempo</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="videos"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Vídeos"
              dot={{ fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado temporal disponível
        </div>
      )}
    </Card>
  );
}
