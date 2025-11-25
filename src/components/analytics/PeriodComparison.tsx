import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PeriodComparisonProps {
  current: number;
  previous: number;
  label: string;
  format?: "number" | "currency" | "percentage";
}

export default function PeriodComparison({ current, previous, label, format = "number" }: PeriodComparisonProps) {
  const difference = current - previous;
  const percentChange = previous > 0 ? ((difference / previous) * 100) : 0;
  const isPositive = difference > 0;
  const isNeutral = difference === 0;

  const formatValue = (value: number) => {
    switch (format) {
      case "currency":
        return `R$ ${value.toFixed(2)}`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          {isNeutral ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Minus className="h-4 w-4" />
              <span className="text-xs font-medium">0%</span>
            </div>
          ) : isPositive ? (
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUp className="h-4 w-4" />
              <span className="text-xs font-medium">+{percentChange.toFixed(1)}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <ArrowDown className="h-4 w-4" />
              <span className="text-xs font-medium">{percentChange.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{formatValue(current)}</span>
            <span className="text-sm text-muted-foreground">atual</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatValue(previous)} no período anterior
          </div>
        </div>

        {!isNeutral && (
          <div className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}{formatValue(difference)} vs período anterior
          </div>
        )}
      </div>
    </Card>
  );
}
