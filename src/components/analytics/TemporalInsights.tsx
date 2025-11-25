import { Card } from "@/components/ui/card";
import { Clock, Calendar, Bell, TrendingUp } from "lucide-react";

interface TemporalInsightsData {
  bestHour: string;
  bestDay: string;
  recommendedNotificationTime: string;
  pattern: string;
  bestHourConversion: number;
  bestDayConversion: number;
}

interface TemporalInsightsProps {
  insights: TemporalInsightsData;
}

export default function TemporalInsights({ insights }: TemporalInsightsProps) {
  const insightCards = [
    {
      icon: Clock,
      title: "Melhor Horário",
      value: insights.bestHour,
      description: `${insights.bestHourConversion.toFixed(1)}% de conversão`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Calendar,
      title: "Melhor Dia",
      value: insights.bestDay,
      description: `${insights.bestDayConversion.toFixed(1)}% de conversão`,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Bell,
      title: "Horário Recomendado para Notificações",
      value: insights.recommendedNotificationTime,
      description: "Baseado nos horários de pico",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      title: "Padrão Identificado",
      value: insights.pattern,
      description: "Análise do comportamento dos usuários",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">💡 Insights Temporais</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {insightCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start gap-4">
              <div className={`rounded-lg p-3 ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="mb-2 font-semibold">Recomendação Estratégica</h4>
            <p className="text-sm text-muted-foreground">
              Com base nos dados analisados, recomendamos agendar notificações push e
              lançar promoções durante <strong>{insights.recommendedNotificationTime}</strong>,
              especialmente aos <strong>{insights.bestDay}</strong>, quando a taxa de
              conversão é {insights.bestDayConversion.toFixed(1)}% maior que a média.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
