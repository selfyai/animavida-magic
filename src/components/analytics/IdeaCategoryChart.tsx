import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface IdeaCategoryChartProps {
  data: Array<{
    category: string;
    count: number;
    unique_users: number;
  }>;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function IdeaCategoryChart({ data }: IdeaCategoryChartProps) {
  const chartData = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item, index) => ({
      name: item.category,
      value: item.count,
      fill: COLORS[index % COLORS.length],
    }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">💡 Categorias de Ideias</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado de categorias disponível
        </div>
      )}
    </Card>
  );
}
