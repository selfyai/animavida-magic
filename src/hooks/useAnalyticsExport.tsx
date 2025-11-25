import { useCallback } from "react";
import { toast } from "sonner";

interface ExportData {
  totalVideos: number;
  topVoice: string;
  topCategory: string;
  avgConversionRate: number;
  voiceStats: Array<{ voice_name: string; count: number; unique_users: number }>;
  categoryStats: Array<{ category: string; count: number; unique_users: number }>;
  period: string;
}

export const useAnalyticsExport = () => {
  const exportToCSV = useCallback((data: ExportData) => {
    try {
      toast.info("Gerando relatório CSV...");

      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      csvContent += `Relatório de Analytics\n`;
      csvContent += `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}\n`;
      csvContent += `Período: ${data.period}\n\n`;

      // Summary
      csvContent += "RESUMO GERAL\n";
      csvContent += `Total de Vídeos,${data.totalVideos}\n`;
      csvContent += `Voz Mais Popular,${data.topVoice}\n`;
      csvContent += `Categoria Top,${data.topCategory}\n`;
      csvContent += `Taxa de Conversão,${data.avgConversionRate.toFixed(1)}%\n\n`;

      // Voice Statistics
      if (data.voiceStats.length > 0) {
        csvContent += "ESTATÍSTICAS POR VOZ\n";
        csvContent += "Voz,Total Vídeos,Usuários Únicos\n";
        
        const sortedVoices = [...data.voiceStats].sort((a, b) => b.count - a.count);
        sortedVoices.forEach((voice) => {
          csvContent += `${voice.voice_name},${voice.count},${voice.unique_users}\n`;
        });
        csvContent += "\n";
      }

      // Category Statistics
      if (data.categoryStats.length > 0) {
        csvContent += "ESTATÍSTICAS POR CATEGORIA\n";
        csvContent += "Categoria,Total Vídeos,Usuários Únicos\n";
        
        const sortedCategories = [...data.categoryStats].sort((a, b) => b.count - a.count);
        sortedCategories.forEach((category) => {
          csvContent += `${category.category},${category.count},${category.unique_users}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analytics-report-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Erro ao exportar relatório");
    }
  }, []);

  const printCharts = useCallback(() => {
    toast.info("Abrindo janela de impressão...");
    window.print();
  }, []);

  return { exportToCSV, printCharts };
};
