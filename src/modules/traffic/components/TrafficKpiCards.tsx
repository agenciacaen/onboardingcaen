import { DollarSign, ShoppingCart, Banknote, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

export interface TrafficKpiData {
  spend: { value: number; change: number };
  purchases: { value: number; change: number };
  revenue: { value: number; change: number };
  roas: { value: number; change: number };
  landing_page_views: { value: number; change: number };
  // Manter compatibilidade com dados legados
  impressions?: { value: number; change: number };
  clicks?: { value: number; change: number };
  ctr?: { value: number; change: number };
  cpc?: { value: number; change: number };
  customMetrics?: Array<{
    title: string;
    value: string | number;
    change: number;
    icon?: any;
    id?: string;
  }>;
}

interface TrafficKpiCardsProps {
  data: TrafficKpiData;
}

interface KpiItemProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KpiItem({ title, value, change, icon: Icon, iconBg, iconColor }: KpiItemProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        </div>
        {change !== 0 && (
          <div className="flex items-center mt-2">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                change > 0 ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrafficKpiCards({ data }: TrafficKpiCardsProps) {
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);

  const formatCompact = (num: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

  const kpis: KpiItemProps[] = [
    {
      title: 'Investimento',
      value: formatCurrency(data.spend.value),
      change: data.spend.change,
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Compras',
      value: formatCompact(data.purchases.value),
      change: data.purchases.change,
      icon: ShoppingCart,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
    },
    {
      title: 'Receita',
      value: formatCurrency(data.revenue.value),
      change: data.revenue.change,
      icon: Banknote,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'ROAS',
      value: `${data.roas.value.toFixed(2)}x`,
      change: data.roas.change,
      icon: TrendingUp,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Visitas na Página',
      value: formatCompact(data.landing_page_views.value),
      change: data.landing_page_views.change,
      icon: Eye,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <KpiItem key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
