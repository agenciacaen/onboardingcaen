import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MessageCircle, ShoppingCart, Target, CreditCard } from 'lucide-react';

export interface ConversionMetric {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  change?: number;
  icon?: 'message' | 'cart' | 'target' | 'cost';
  highlight?: boolean;
}

interface ConversionMetricCardsProps {
  metrics: ConversionMetric[];
}

const iconMap = {
  message: MessageCircle,
  cart: ShoppingCart,
  target: Target,
  cost: CreditCard,
};

export function ConversionMetricCards({ metrics }: ConversionMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.icon || 'target'];
        return (
          <Card key={metric.id} className={metric.highlight ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{metric.formattedValue}</div>
              {metric.change !== undefined && metric.change !== 0 && (
                <p className="flex items-center text-xs mt-1">
                  <span
                    className={`flex items-center font-medium ${
                      metric.change > 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {metric.change > 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
