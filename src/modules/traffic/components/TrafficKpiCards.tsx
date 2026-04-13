import { 
  DollarSign, TrendingUp, TrendingDown, Eye, CheckCircle2, 
  BarChart3, Target, MousePointer2, Users, Percent, 
  Activity, MessageSquare, Briefcase, Video, Heart, Share2, MessageCircle
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
  [key: string]: KpiMetricData | undefined;
  spend: KpiMetricData;
  roas: KpiMetricData;
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
    <Card className="overflow-hidden bg-card border-border backdrop-blur-sm relative group hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-4 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
            <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
          </div>
          <div className={cn('p-1.5 rounded-full bg-muted border border-border', iconColor)}>
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
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: (num < 10 && num > 0) ? 2 : 0 }).format(num);

  const formatCompact = (num: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

  const getMetric = (id: string): KpiMetricData => data[id] || { value: 0, change: 0 };

  const allPossibleKpis: Record<string, KpiItemProps> = {
    // performance
    spend: {
      title: 'Investimento',
      value: formatCurrency(getMetric('spend').value),
      change: getMetric('spend').change,
      icon: DollarSign,
      iconColor: 'text-primary',
      history: getMetric('spend').history,
      lineColor: 'hsl(var(--primary))',
    },
    impressions: {
      title: 'Impressões',
      value: formatCompact(getMetric('impressions').value),
      change: getMetric('impressions').change,
      icon: Activity,
      iconColor: 'text-slate-400',
      history: getMetric('impressions').history,
      lineColor: '#94a3b8',
    },
    reach: {
      title: 'Alcance',
      value: formatCompact(getMetric('reach').value),
      change: getMetric('reach').change,
      icon: Users,
      iconColor: 'text-emerald-400',
      history: getMetric('reach').history,
      lineColor: '#10b981',
    },
    frequency: {
      title: 'Frequência',
      value: getMetric('frequency').value.toFixed(2),
      change: getMetric('frequency').change,
      icon: Activity,
      iconColor: 'text-slate-500',
      history: getMetric('frequency').history,
      lineColor: '#64748b',
    },
    cpm: {
      title: 'CPM',
      value: formatCurrency(getMetric('cpm').value),
      change: getMetric('cpm').change,
      icon: Target,
      iconColor: 'text-slate-400',
      history: getMetric('cpm').history,
      lineColor: '#94a3b8',
    },
    // clicks
    clicks: {
      title: 'Cliques (Todos)',
      value: formatCompact(getMetric('clicks').value),
      change: getMetric('clicks').change,
      icon: MousePointer2,
      iconColor: 'text-primary/70',
      history: getMetric('clicks').history,
      lineColor: 'hsl(var(--primary)/0.7)',
    },
    link_clicks: {
      title: 'Cliques no Link',
      value: formatCompact(getMetric('link_clicks').value),
      change: getMetric('link_clicks').change,
      icon: MousePointer2,
      iconColor: 'text-primary',
      history: getMetric('link_clicks').history,
      lineColor: 'hsl(var(--primary))',
    },
    cpc: {
      title: 'CPC (Todos)',
      value: formatCurrency(getMetric('cpc').value),
      change: getMetric('cpc').change,
      icon: DollarSign,
      iconColor: 'text-primary/70',
      history: getMetric('cpc').history,
      lineColor: 'hsl(var(--primary)/0.7)',
    },
    cpc_link: {
      title: 'CPC (Link)',
      value: formatCurrency(getMetric('cpc_link').value),
      change: getMetric('cpc_link').change,
      icon: DollarSign,
      iconColor: 'text-primary',
      history: getMetric('cpc_link').history,
      lineColor: 'hsl(var(--primary))',
    },
    ctr: {
      title: 'CTR (Todos)',
      value: `${getMetric('ctr').value.toFixed(2)}%`,
      change: getMetric('ctr').change,
      icon: Percent,
      iconColor: 'text-amber-300',
      history: getMetric('ctr').history,
      lineColor: '#fbbf24',
    },
    ctr_link: {
      title: 'CTR (Link)',
      value: `${getMetric('ctr_link').value.toFixed(2)}%`,
      change: getMetric('ctr_link').change,
      icon: Percent,
      iconColor: 'text-amber-500',
      history: getMetric('ctr_link').history,
      lineColor: '#f59e0b',
    },
    // conversions
    purchases: {
      title: 'Compras',
      value: formatCompact(getMetric('purchases').value),
      change: getMetric('purchases').change,
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      history: getMetric('purchases').history,
      lineColor: '#10b981',
    },
    revenue: {
      title: 'Receita',
      value: formatCurrency(getMetric('revenue').value),
      change: getMetric('revenue').change,
      icon: BarChart3,
      iconColor: 'text-primary',
      history: getMetric('revenue').history,
      lineColor: 'hsl(var(--primary))',
    },
    roas: {
      title: 'ROAS',
      value: getMetric('roas').value.toFixed(2),
      change: getMetric('roas').change,
      icon: Target,
      iconColor: 'text-purple-400',
      history: getMetric('roas').history,
      lineColor: '#a855f7',
    },
    initiate_checkout: {
      title: 'Checkouts',
      value: formatCompact(getMetric('initiate_checkout').value),
      change: getMetric('initiate_checkout').change,
      icon: ShoppingCartIcon,
      iconColor: 'text-amber-400',
      history: getMetric('initiate_checkout').history,
      lineColor: '#f59e0b',
    },
    add_to_cart: {
      title: 'No Carrinho',
      value: formatCompact(getMetric('add_to_cart').value),
      change: getMetric('add_to_cart').change,
      icon: ShoppingCartIcon,
      iconColor: 'text-primary/70',
      history: getMetric('add_to_cart').history,
      lineColor: 'hsl(var(--primary)/0.7)',
    },
    view_content: {
      title: 'Vizu. Conteúdo',
      value: formatCompact(getMetric('view_content').value),
      change: getMetric('view_content').change,
      icon: Eye,
      iconColor: 'text-muted-foreground',
      history: getMetric('view_content').history,
      lineColor: 'hsl(var(--muted-foreground))',
    },
    // messaging
    conversations: {
      title: 'Conversas',
      value: formatCompact(getMetric('conversations').value),
      change: getMetric('conversations').change,
      icon: MessageSquare,
      iconColor: 'text-emerald-400',
      history: getMetric('conversations').history,
      lineColor: '#10b981',
    },
    leads: {
      title: 'Leads',
      value: formatCompact(getMetric('leads').value),
      change: getMetric('leads').change,
      icon: Briefcase,
      iconColor: 'text-primary',
      history: getMetric('leads').history,
      lineColor: 'hsl(var(--primary))',
    },
    landing_page_views: {
      title: 'Visitas',
      value: formatCompact(getMetric('landing_page_views').value),
      change: getMetric('landing_page_views').change,
      icon: Eye,
      iconColor: 'text-slate-400',
      history: getMetric('landing_page_views').history,
      lineColor: '#94a3b8',
    },
    // engagement
    post_engagement: {
      title: 'Envolvi. Publi',
      value: formatCompact(getMetric('post_engagement').value),
      change: getMetric('post_engagement').change,
      icon: Heart,
      iconColor: 'text-pink-400',
      history: getMetric('post_engagement').history,
      lineColor: '#ec4899',
    },
    post_reaction: {
      title: 'Reações',
      value: formatCompact(getMetric('post_reaction').value),
      change: getMetric('post_reaction').change,
      icon: Heart,
      iconColor: 'text-red-400',
      history: getMetric('post_reaction').history,
      lineColor: '#ef4444',
    },
    comment: {
      title: 'Comentários',
      value: formatCompact(getMetric('comment').value),
      change: getMetric('comment').change,
      icon: MessageCircle,
      iconColor: 'text-primary',
      history: getMetric('comment').history,
      lineColor: 'hsl(var(--primary))',
    },
    shared: {
      title: 'Compartilhamentos',
      value: formatCompact(getMetric('shared').value),
      change: getMetric('shared').change,
      icon: Share2,
      iconColor: 'text-emerald-400',
      history: getMetric('shared').history,
      lineColor: '#10b981',
    },
    // video
    video_p25: { title: 'Vídeo 25%', value: formatCompact(getMetric('video_p25').value), change: getMetric('video_p25').change, icon: Video, iconColor: 'text-muted-foreground', history: getMetric('video_p25').history, lineColor: 'hsl(var(--muted-foreground))' },
    video_p50: { title: 'Vídeo 50%', value: formatCompact(getMetric('video_p50').value), change: getMetric('video_p50').change, icon: Video, iconColor: 'text-muted-foreground', history: getMetric('video_p50').history, lineColor: 'hsl(var(--muted-foreground))' },
    video_p75: { title: 'Vídeo 75%', value: formatCompact(getMetric('video_p75').value), change: getMetric('video_p75').change, icon: Video, iconColor: 'text-muted-foreground', history: getMetric('video_p75').history, lineColor: 'hsl(var(--muted-foreground))' },
    video_p95: { title: 'Vídeo 95%', value: formatCompact(getMetric('video_p95').value), change: getMetric('video_p95').change, icon: Video, iconColor: 'text-primary/70', history: getMetric('video_p95').history, lineColor: 'hsl(var(--primary)/0.7)' },
    video_p100: { title: 'Vídeo 100%', value: formatCompact(getMetric('video_p100').value), change: getMetric('video_p100').change, icon: Video, iconColor: 'text-primary', history: getMetric('video_p100').history, lineColor: 'hsl(var(--primary))' },
  };

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

function ShoppingCartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
