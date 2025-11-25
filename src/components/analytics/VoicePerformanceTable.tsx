import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface VoicePerformanceTableProps {
  data: Array<{
    voice_id: string;
    voice_name: string;
    count: number;
    unique_users: number;
  }>;
}

export default function VoicePerformanceTable({ data }: VoicePerformanceTableProps) {
  const totalVideos = data.reduce((sum, item) => sum + item.count, 0);
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Detalhada por Voz</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Posição</TableHead>
            <TableHead>Voz</TableHead>
            <TableHead className="text-right">Total Vídeos</TableHead>
            <TableHead className="text-right">Usuários Únicos</TableHead>
            <TableHead className="text-right">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, index) => {
            const share = totalVideos > 0 ? ((item.count / totalVideos) * 100).toFixed(1) : "0";
            return (
              <TableRow key={item.voice_id}>
                <TableCell>
                  <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                </TableCell>
                <TableCell className="font-medium">{item.voice_name}</TableCell>
                <TableCell className="text-right">{item.count}</TableCell>
                <TableCell className="text-right">{item.unique_users}</TableCell>
                <TableCell className="text-right">{share}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
