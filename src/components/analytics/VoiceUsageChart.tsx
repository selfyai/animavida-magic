import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface VoiceUsageChartProps {
  data: Array<{
    voice_id: string;
    voice_name: string;
    count: number;
    unique_users: number;
  }>;
}

export default function VoiceUsageChart({ data }: VoiceUsageChartProps) {
  const chartData = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      name: item.voice_name,
      videos: item.count,
      usuarios: item.unique_users,
    }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Uso por Voz</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={100} />
          <Tooltip />
          <Legend />
          <Bar dataKey="videos" fill="hsl(var(--primary))" name="Vídeos" />
          <Bar dataKey="usuarios" fill="hsl(var(--chart-2))" name="Usuários" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
