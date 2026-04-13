import { 
  DollarSign, TrendingUp, TrendingDown, Eye, CheckCircle2, 
  BarChart3, Target, MousePointer2, Users, Percent, 
  Activity, MessageSquare, Briefcase 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

export interface KpiMetricData {
  value: number;
  change: number;
  history?: any[];
}

export interface TrafficKpiData {
  spend: KpiMetricData;
  impressions?: KpiMetricData;
  clicks?: KpiMetricData;
  reach?: KpiMetricData;
  ctr?: KpiMetricData;
  cpc?: KpiMetricData;
  cpm?: KpiMetricData;
  roas: KpiMetricData;
  frequency?: KpiMetricData;
  purchases?: KpiMetricData;
  leads?: KpiMetricData;
  conversations?: KpiMetricData;
  landing_page_views?: KpiMetricData;
  revenue?: KpiMetricData;
}

interface TrafficKpiCardsProps {
  data: TrafficKpiData;
  selectedMetrics?: string[];
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
            <LineChart data={history && history.length > 0 ? history : [
              { value: 10 }, { value: 15 }, { value: 8 }, { value: 12 }, { value: 14 }, { value: 10 }, { value: 18 }
            ]}>
              <Line 
                type="monotone" 
                dataKey="value" 
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

export function TrafficKpiCards({ data, selectedMetrics }: TrafficKpiCardsProps) {
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(num);

  const formatCompact = (num: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

  const formatPercent = (num: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(num / 100);

  const allPossibleKpis: Record<string, KpiItemProps> = {
    spend: {
      title: 'Investimento',
      value: formatCurrency(data.spend.value),
      change: data.spend.change,
      icon: DollarSign,
      iconColor: 'text-blue-400',
      history: data.spend.history,
      lineColor: '#3b82f6',
    },
    impressions: {
      title: 'Impressões',
      value: formatCompact(data.impressions?.value || 0),
      change: data.impressions?.change || 0,
      icon: Activity,
      iconColor: 'text-slate-400',
      history: data.impressions?.history,
      lineColor: '#94a3b8',
    },
    clicks: {
      title: 'Cliques',
      value: formatCompact(data.clicks?.value || 0),
      change: data.clicks?.change || 0,
      icon: MousePointer2,
      iconColor: 'text-blue-300',
      history: data.clicks?.history,
      lineColor: '#60a5fa',
    },
    reach: {
      title: 'Alcance',
      value: formatCompact(data.reach?.value || 0),
      change: data.reach?.change || 0,
      icon: Users,
      iconColor: 'text-emerald-400',
      history: data.reach?.history,
      lineColor: '#10b981',
    },
    ctr: {
      title: 'CTR',
      value: `${(data.ctr?.value || 0).toFixed(2)}%`,
      change: data.ctr?.change || 0,
      icon: Percent,
      iconColor: 'text-amber-400',
      history: data.ctr?.history,
      lineColor: '#f59e0b',
    },
    cpc: {
      title: 'CPC',
      value: formatCurrency(data.cpc?.value || 0),
      change: data.cpc?.change || 0,
      icon: DollarSign,
      iconColor: 'text-blue-400',
      history: data.cpc?.history,
      lineColor: '#3b82f6',
    },
    cpm: {
      title: 'CPM',
      value: formatCurrency(data.cpm?.value || 0),
      change: data.cpm?.change || 0,
      icon: DollarSign,
      iconColor: 'text-slate-400',
      history: data.cpm?.history,
      lineColor: '#94a3b8',
    },
    roas: {
      title: 'ROAS',
      value: (data.roas.value || 0).toFixed(2),
      change: data.roas.change,
      icon: Target,
      iconColor: 'text-purple-400',
      history: data.roas.history,
      lineColor: '#a855f7',
    },
    frequency: {
      title: 'Frequência',
      value: (data.frequency?.value || 0).toFixed(2),
      change: data.frequency?.change || 0,
      icon: Activity,
      iconColor: 'text-slate-500',
      history: data.frequency?.history,
      lineColor: '#64748b',
    },
    purchases: {
      title: 'Compras',
      value: formatCompact(data.purchases?.value || 0),
      change: data.purchases?.change || 0,
      icon: CheckCircle2,
      iconColor: 'text-white',
      history: data.purchases?.history,
      lineColor: '#10b981',
    },
    leads: {
      title: 'Leads',
      value: formatCompact(data.leads?.value || 0),
      change: data.leads?.change || 0,
      icon: Briefcase,
      iconColor: 'text-blue-400',
      history: data.leads?.history,
      lineColor: '#3b82f6',
    },
    conversations: {
      title: 'Conversas',
      value: formatCompact(data.conversations?.value || 0),
      change: data.conversations?.change || 0,
      icon: MessageSquare,
      iconColor: 'text-emerald-400',
      history: data.conversations?.history,
      lineColor: '#10b981',
    },
    landing_page_views: {
      title: 'Visitas',
      value: formatCompact(data.landing_page_views?.value || 0),
      change: data.landing_page_views?.change || 0,
      icon: Eye,
      iconColor: 'text-slate-400',
      history: data.landing_page_views?.history,
      lineColor: '#94a3b8',
    },
    revenue: {
      title: 'Receita',
      value: formatCurrency(data.revenue?.value || 0),
      change: data.revenue?.change || 0,
      icon: BarChart3,
      iconColor: 'text-blue-400',
      history: data.revenue?.history,
      lineColor: '#60a5fa',
    },
  };

  // Se não houver métricas selecionadas, exibir as padrão
  const metricsToShow = selectedMetrics && selectedMetrics.length > 0
    ? selectedMetrics.filter(m => allPossibleKpis[m])
    : ['spend', 'purchases', 'revenue', 'roas', 'landing_page_views'];

  return (
    <div className={cn(
      "grid gap-3",
      metricsToShow.length <= 4 ? "grid-cols-2 lg:grid-cols-4" : 
      metricsToShow.length === 5 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" :
      "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    )}>
      {metricsToShow.map((metricId) => (
        <KpiItem key={metricId} {...allPossibleKpis[metricId]} />
      ))}
    </div>
  );
}

