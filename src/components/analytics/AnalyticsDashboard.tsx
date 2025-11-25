import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Target, Zap, Download, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import VoiceUsageChart from "./VoiceUsageChart";
import IdeaCategoryChart from "./IdeaCategoryChart";
import TimelineChart from "./TimelineChart";
import ConversionFunnelChart from "./ConversionFunnelChart";
import VoicePerformanceTable from "./VoicePerformanceTable";
import CategoryPerformanceTable from "./CategoryPerformanceTable";
import PeriodComparison from "./PeriodComparison";
import HourHeatmap from "./HourHeatmap";
import WeekdayChart from "./WeekdayChart";
import TemporalInsights from "./TemporalInsights";
import { useAnalyticsExport } from "@/hooks/useAnalyticsExport";

interface HourData {
  hour: number;
  videos: number;
  clicks: number;
  conversionRate: number;
}

interface WeekdayData {
  day: string;
  dayNumber: number;
  videos: number;
  clicks: number;
  conversionRate: number;
}

interface TemporalInsightsData {
  bestHour: string;
  bestDay: string;
  recommendedNotificationTime: string;
  pattern: string;
  bestHourConversion: number;
  bestDayConversion: number;
}

interface AnalyticsData {
  totalVideos: number;
  topVoice: string;
  topCategory: string;
  avgConversionRate: number;
  voiceStats: any[];
  categoryStats: any[];
  timelineData: any[];
  conversionData: any;
  hourlyData: HourData[];
  weekdayData: WeekdayData[];
  temporalInsights: TemporalInsightsData;
  previousPeriodData?: {
    totalVideos: number;
    avgConversionRate: number;
  };
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [selectedVoice, setSelectedVoice] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Array<{ voice_id: string; voice_name: string }>>([]);
  const { exportToCSV, printCharts } = useAnalyticsExport();
  const [data, setData] = useState<AnalyticsData>({
    totalVideos: 0,
    topVoice: "-",
    topCategory: "-",
    avgConversionRate: 0,
    voiceStats: [],
    categoryStats: [],
    timelineData: [],
    conversionData: null,
    hourlyData: [],
    weekdayData: [],
    temporalInsights: {
      bestHour: "-",
      bestDay: "-",
      recommendedNotificationTime: "-",
      pattern: "-",
      bestHourConversion: 0,
      bestDayConversion: 0,
    },
    previousPeriodData: {
      totalVideos: 0,
      avgConversionRate: 0,
    },
  });

  useEffect(() => {
    loadAvailableVoices();
    loadAnalytics();
  }, [period, selectedVoice, selectedCategory, compareEnabled]);

  const loadAvailableVoices = async () => {
    try {
      const { data: voices } = await supabase
        .from("voice_settings")
        .select("voice_id, voice_name")
        .eq("is_enabled", true)
        .order("voice_name");
      
      if (voices) {
        setAvailableVoices(voices);
      }
    } catch (error) {
      console.error("Error loading voices:", error);
    }
  };

  const handleExportCSV = () => {
    exportToCSV({
      ...data,
      period: getPeriodLabel(),
    });
  };

  const handlePrintCharts = () => {
    printCharts();
  };

  const getPeriodFilter = () => {
    const now = new Date();
    switch (period) {
      case "7d":
        return {
          current: new Date(now.setDate(now.getDate() - 7)).toISOString(),
          previous: new Date(now.setDate(now.getDate() - 14)).toISOString(),
          days: 7,
        };
      case "30d":
        return {
          current: new Date(now.setDate(now.getDate() - 30)).toISOString(),
          previous: new Date(now.setDate(now.getDate() - 60)).toISOString(),
          days: 30,
        };
      case "90d":
        return {
          current: new Date(now.setDate(now.getDate() - 90)).toISOString(),
          previous: new Date(now.setDate(now.getDate() - 180)).toISOString(),
          days: 90,
        };
      default:
        return null;
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "7d":
        return "Últimos 7 dias";
      case "30d":
        return "Últimos 30 dias";
      case "90d":
        return "Últimos 90 dias";
      default:
        return "Todo período";
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const periodFilter = getPeriodFilter();

      // Current period query
      let videosQuery = supabase
        .from("generated_videos")
        .select("*");

      if (periodFilter) {
        videosQuery = videosQuery.gte("created_at", periodFilter.current);
      }
      if (selectedVoice !== "all") {
        videosQuery = videosQuery.eq("voice_id", selectedVoice);
      }
      if (selectedCategory !== "all") {
        videosQuery = videosQuery.eq("idea_category", selectedCategory);
      }

      const { data: videos, error: videosError } = await videosQuery;
      
      if (videosError) throw videosError;

      // Get voice names mapping
      const { data: voiceSettings } = await supabase
        .from("voice_settings")
        .select("voice_id, voice_name");

      const voiceMap = new Map(
        voiceSettings?.map((v) => [v.voice_id, v.voice_name]) || []
      );
      
      // Previous period query (for comparison)
      let previousVideos = null;
      if (compareEnabled && periodFilter) {
        let previousQuery = supabase
          .from("generated_videos")
          .select("*");

        previousQuery = previousQuery
          .gte("created_at", periodFilter.previous)
          .lt("created_at", periodFilter.current);

        if (selectedVoice !== "all") {
          previousQuery = previousQuery.eq("voice_id", selectedVoice);
        }
        if (selectedCategory !== "all") {
          previousQuery = previousQuery.eq("idea_category", selectedCategory);
        }

        const { data: prevData } = await previousQuery;
        previousVideos = prevData;
      }
      if (videosError) throw videosError;

      // Voice statistics
      const voiceStats = videos?.reduce((acc: any, video: any) => {
        const voiceId = video.voice_id;
        const voiceName = voiceMap.get(voiceId) || "Unknown";
        if (!acc[voiceId]) {
          acc[voiceId] = { voice_id: voiceId, voice_name: voiceName, count: 0, users: new Set() };
        }
        acc[voiceId].count++;
        acc[voiceId].users.add(video.user_id);
        return acc;
      }, {});

      const voiceStatsArray = Object.values(voiceStats || {}).map((v: any) => ({
        ...v,
        unique_users: v.users.size,
        users: undefined,
      }));

      // Category statistics
      const categoryStats = videos
        ?.filter((v: any) => v.idea_source === "template" && v.idea_category)
        .reduce((acc: any, video: any) => {
          const cat = video.idea_category;
          if (!acc[cat]) {
            acc[cat] = { category: cat, count: 0, users: new Set() };
          }
          acc[cat].count++;
          acc[cat].users.add(video.user_id);
          return acc;
        }, {});

      const categoryStatsArray = Object.values(categoryStats || {}).map((c: any) => ({
        ...c,
        unique_users: c.users.size,
        users: undefined,
      }));

      // Timeline data
      const timelineData = videos?.reduce((acc: any, video: any) => {
        const date = new Date(video.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count++;
        return acc;
      }, {});

      const timelineArray = Object.values(timelineData || {}).sort(
        (a: any, b: any) => a.date.localeCompare(b.date)
      );

      // Conversion data
      const { data: clicks } = await supabase
        .from("idea_clicks")
        .select("*")
        .gte("clicked_at", periodFilter?.current || "2000-01-01");

      const totalClicks = clicks?.length || 0;
      const totalConversions = clicks?.filter((c) => c.generated_video).length || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Previous period conversion data
      let previousConversionRate = 0;
      if (compareEnabled && periodFilter && previousVideos) {
        const { data: prevClicks } = await supabase
          .from("idea_clicks")
          .select("*")
          .gte("clicked_at", periodFilter.previous)
          .lt("clicked_at", periodFilter.current);

        const prevTotalClicks = prevClicks?.length || 0;
        const prevTotalConversions = prevClicks?.filter((c) => c.generated_video).length || 0;
        previousConversionRate = prevTotalClicks > 0 ? (prevTotalConversions / prevTotalClicks) * 100 : 0;
      }

      const topVoice = voiceStatsArray.sort((a, b) => b.count - a.count)[0];
      const topCat = categoryStatsArray.sort((a, b) => b.count - a.count)[0];

      // Temporal Analysis: Hourly data
      const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        videos: 0,
        clicks: 0,
      }));

      videos?.forEach((video: any) => {
        const hour = new Date(video.created_at).getHours();
        hourlyStats[hour].videos++;
      });

      clicks?.forEach((click: any) => {
        const hour = new Date(click.clicked_at).getHours();
        hourlyStats[hour].clicks++;
      });

      const hourlyData: HourData[] = hourlyStats.map((stat) => ({
        ...stat,
        conversionRate: stat.clicks > 0 ? (stat.videos / stat.clicks) * 100 : 0,
      }));

      // Temporal Analysis: Weekday data
      const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const weekdayStats = Array.from({ length: 7 }, (_, day) => ({
        dayNumber: day,
        day: dayNames[day],
        videos: 0,
        clicks: 0,
      }));

      videos?.forEach((video: any) => {
        const day = new Date(video.created_at).getDay();
        weekdayStats[day].videos++;
      });

      clicks?.forEach((click: any) => {
        const day = new Date(click.clicked_at).getDay();
        weekdayStats[day].clicks++;
      });

      const weekdayData: WeekdayData[] = weekdayStats.map((stat) => ({
        ...stat,
        conversionRate: stat.clicks > 0 ? (stat.videos / stat.clicks) * 100 : 0,
      }));

      // Temporal Insights
      const bestHourData = [...hourlyData].sort((a, b) => b.conversionRate - a.conversionRate)[0];
      const bestDayData = [...weekdayData].sort((a, b) => b.conversionRate - a.conversionRate)[0];
      
      const topHours = [...hourlyData]
        .filter((h) => h.videos > 0)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 3);

      const recommendedHours = topHours.length > 0
        ? `${topHours[0].hour}h-${(topHours[0].hour + 2) % 24}h`
        : "-";

      const avgVideosWeekday = weekdayStats.slice(1, 6).reduce((acc, d) => acc + d.videos, 0) / 5;
      const avgVideosWeekend = (weekdayStats[0].videos + weekdayStats[6].videos) / 2;
      
      const pattern = avgVideosWeekend > avgVideosWeekday * 1.3
        ? "Maior atividade nos finais de semana"
        : avgVideosWeekday > avgVideosWeekend * 1.3
        ? "Maior atividade durante a semana"
        : "Atividade distribuída uniformemente";

      const temporalInsights: TemporalInsightsData = {
        bestHour: bestHourData ? `${bestHourData.hour}h` : "-",
        bestDay: bestDayData?.day || "-",
        recommendedNotificationTime: recommendedHours,
        pattern,
        bestHourConversion: bestHourData?.conversionRate || 0,
        bestDayConversion: bestDayData?.conversionRate || 0,
      };

      setData({
        totalVideos: videos?.length || 0,
        topVoice: topVoice?.voice_name || "-",
        topCategory: topCat?.category || "-",
        avgConversionRate: conversionRate,
        voiceStats: voiceStatsArray,
        categoryStats: categoryStatsArray,
        timelineData: timelineArray,
        conversionData: {
          totalViews: totalClicks,
          totalClicks,
          totalVideos: totalConversions,
        },
        hourlyData,
        weekdayData,
        temporalInsights,
        previousPeriodData: {
          totalVideos: previousVideos?.length || 0,
          avgConversionRate: previousConversionRate,
        },
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex gap-4 flex-wrap items-center justify-between">
        <div className="flex gap-4 flex-wrap items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as vozes" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">Todas as vozes</SelectItem>
              {availableVoices.map((v) => (
                <SelectItem key={v.voice_id} value={v.voice_id}>
                  {v.voice_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {data.categoryStats.map((c) => (
                <SelectItem key={c.category} value={c.category}>
                  {c.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {period !== "all" && (
            <div className="flex items-center gap-2">
              <Switch
                id="compare-mode"
                checked={compareEnabled}
                onCheckedChange={setCompareEnabled}
              />
              <Label htmlFor="compare-mode" className="cursor-pointer text-sm">
                Comparar períodos
              </Label>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handlePrintCharts} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Imprimir Gráficos
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      {compareEnabled && period !== "all" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <PeriodComparison
            current={data.totalVideos}
            previous={data.previousPeriodData?.totalVideos || 0}
            label="Total de Vídeos"
            format="number"
          />
          <PeriodComparison
            current={data.avgConversionRate}
            previous={data.previousPeriodData?.avgConversionRate || 0}
            label="Taxa de Conversão"
            format="percentage"
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Vídeos</p>
                <p className="text-2xl font-bold">{data.totalVideos}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Voz Mais Popular</p>
                <p className="text-2xl font-bold truncate">{data.topVoice}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categoria Top</p>
                <p className="text-2xl font-bold truncate">{data.topCategory}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">{data.avgConversionRate.toFixed(1)}%</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div id="analytics-charts" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <VoiceUsageChart data={data.voiceStats} />
          <IdeaCategoryChart data={data.categoryStats} />
        </div>

        <ConversionFunnelChart data={data.conversionData} />
        <TimelineChart data={data.timelineData} />
      </div>

      {/* Temporal Patterns Section */}
      <Card className="p-6">
        <Tabs defaultValue="hours">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">⏰ Padrões Temporais de Engajamento</h3>
            <TabsList>
              <TabsTrigger value="hours">Por Horário</TabsTrigger>
              <TabsTrigger value="weekdays">Por Dia</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="hours">
            <HourHeatmap data={data.hourlyData} />
          </TabsContent>

          <TabsContent value="weekdays">
            <WeekdayChart data={data.weekdayData} />
          </TabsContent>

          <TabsContent value="insights">
            <TemporalInsights insights={data.temporalInsights} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Detailed Tables */}
      <Tabs defaultValue="voice">
        <TabsList>
          <TabsTrigger value="voice">Por Voz</TabsTrigger>
          <TabsTrigger value="category">Por Categoria</TabsTrigger>
        </TabsList>
        <TabsContent value="voice">
          <VoicePerformanceTable data={data.voiceStats} />
        </TabsContent>
        <TabsContent value="category">
          <CategoryPerformanceTable data={data.categoryStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
