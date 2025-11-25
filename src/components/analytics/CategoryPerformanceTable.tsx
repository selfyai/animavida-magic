import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CategoryPerformanceTableProps {
  data: Array<{
    category: string;
    count: number;
    unique_users: number;
  }>;
}

export default function CategoryPerformanceTable({ data }: CategoryPerformanceTableProps) {
  const totalVideos = data.reduce((sum, item) => sum + item.count, 0);
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Detalhada por Categoria</h3>
      {sortedData.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Total Vídeos</TableHead>
              <TableHead className="text-right">Usuários Únicos</TableHead>
              <TableHead className="text-right">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => {
              const share = totalVideos > 0 ? ((item.count / totalVideos) * 100).toFixed(1) : "0";
              return (
                <TableRow key={item.category}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right">{item.unique_users}</TableCell>
                  <TableCell className="text-right">{share}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          Nenhum dado de categorias disponível
        </div>
      )}
    </Card>
  );
}
