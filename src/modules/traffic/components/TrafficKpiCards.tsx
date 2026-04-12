import { DollarSign, TrendingUp, TrendingDown, Eye, CheckCircle2, BarChart3, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

export interface TrafficKpiData {
  spend: { value: number; change: number; history?: any[] };
  purchases?: { value: number; change: number; history?: any[] };
  revenue?: { value: number; change: number; history?: any[] };
  roas: { value: number; change: number; history?: any[] };
  landing_page_views?: { value: number; change: number; history?: any[] };
}

interface TrafficKpiCardsProps {
  data: TrafficKpiData;
}

interface KpiItemProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  history?: any[];
  lineColor: string;
}

function KpiItem({ title, value, change, icon: Icon, iconColor, history, lineColor }: KpiItemProps) {
  return (
    <Card className="overflow-hidden bg-slate-900/40 border-slate-800/50 backdrop-blur-sm relative group hover:border-slate-700/50 transition-all duration-300">
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
            <p className="text-xl font-bold text-white tracking-tight">{value}</p>
          </div>
          <div className={cn('p-1.5 rounded-full bg-slate-800/80 border border-slate-700/50', iconColor)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <div className={cn(
            "flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold",
            change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {change >= 0 ? (
              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
            )}
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        </div>

        {/* Sparkline */}
        <div className="h-10 w-full mt-2 -mx-4 -mb-4 opacity-50 group-hover:opacity-80 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history || [
              { v: 10 }, { v: 15 }, { v: 8 }, { v: 12 }, { v: 14 }, { v: 10 }, { v: 18 }
            ]}>
              <Line 
                type="monotone" 
                dataKey={history ? "value" : "v"} 
                stroke={lineColor} 
                strokeWidth={2} 
                dot={false}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrafficKpiCards({ data }: TrafficKpiCardsProps) {
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(num);

  const formatCompact = (num: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

  const kpis: KpiItemProps[] = [
    {
      title: 'Investimento',
      value: formatCurrency(data.spend.value),
      change: data.spend.change,
      icon: DollarSign,
      iconColor: 'text-blue-400',
      history: data.spend.history,
      lineColor: '#3b82f6', // blue-500
    },
    ...(data.purchases ? [{
      title: 'Compras',
      value: formatCompact(data.purchases.value),
      change: data.purchases.change,
      icon: CheckCircle2,
      iconColor: 'text-white',
      history: data.purchases.history,
      lineColor: '#10b981', // emerald-500
    }] : []),
    ...(data.revenue ? [{
      title: 'Receita',
      value: formatCurrency(data.revenue.value),
      change: data.revenue.change,
      icon: BarChart3,
      iconColor: 'text-blue-400',
      history: data.revenue.history,
      lineColor: '#60a5fa', // blue-400
    }] : []),
    {
      title: 'ROAS',
      value: data.roas.value.toFixed(2),
      change: data.roas.change,
      icon: Target,
      iconColor: 'text-purple-400',
      history: data.roas.history,
      lineColor: '#a855f7', // purple-500
    },
    ...(data.landing_page_views ? [{
      title: 'Visitas na Página',
      value: formatCompact(data.landing_page_views.value),
      change: data.landing_page_views.change,
      icon: Eye,
      iconColor: 'text-slate-400',
      history: data.landing_page_views.history,
      lineColor: '#94a3b8', // slate-400
    }] : []),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <KpiItem key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}

