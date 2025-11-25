import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HourData {
  hour: number;
  videos: number;
  clicks: number;
  conversionRate: number;
}

interface HourHeatmapProps {
  data: HourData[];
}

export default function HourHeatmap({ data }: HourHeatmapProps) {
  const maxVideos = Math.max(...data.map((d) => d.videos), 1);

  const getIntensityColor = (videos: number) => {
    const intensity = videos / maxVideos;
    if (intensity === 0) return "bg-muted/30";
    if (intensity <= 0.25) return "bg-primary/20";
    if (intensity <= 0.5) return "bg-primary/40";
    if (intensity <= 0.75) return "bg-primary/60";
    return "bg-primary/80";
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}h`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🕐 Mapa de Calor por Horário</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Baixa</span>
          <div className="flex gap-1">
            <div className="h-4 w-4 rounded bg-muted/30"></div>
            <div className="h-4 w-4 rounded bg-primary/20"></div>
            <div className="h-4 w-4 rounded bg-primary/40"></div>
            <div className="h-4 w-4 rounded bg-primary/60"></div>
            <div className="h-4 w-4 rounded bg-primary/80"></div>
          </div>
          <span>Alta</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2">
        <TooltipProvider>
          {data.map((hourData) => (
            <Tooltip key={hourData.hour}>
              <TooltipTrigger asChild>
                <div
                  className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-border/50 transition-all hover:scale-105 hover:border-primary ${getIntensityColor(
                    hourData.videos
                  )}`}
                >
                  <span className="text-xs font-medium">
                    {formatHour(hourData.hour)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {hourData.videos}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{formatHour(hourData.hour)}</p>
                  <div className="space-y-0.5 text-sm">
                    <p>📹 Vídeos gerados: {hourData.videos}</p>
                    <p>👆 Cliques em ideias: {hourData.clicks}</p>
                    <p>
                      📊 Taxa de conversão:{" "}
                      {hourData.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
