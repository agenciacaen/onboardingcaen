import { MousePointerClick, Eye, Activity, DollarSign, Target, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/cards/StatsCard';

export interface TrafficKpiData {
  impressions: { value: number; change: number };
  clicks: { value: number; change: number };
  ctr: { value: number; change: number };
  cpc: { value: number; change: number };
  roas: { value: number; change: number };
  spend: { value: number; change: number };
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

export function TrafficKpiCards({ data }: TrafficKpiCardsProps) {
  const formatCompact = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <StatsCard
        title="Gasto Total"
        value={formatCurrency(data.spend.value)}
        change={data.spend.change}
        icon={DollarSign}
      />
      <StatsCard
        title="Impressões"
        value={formatCompact(data.impressions.value)}
        change={data.impressions.change}
        icon={Eye}
      />
      <StatsCard
        title="Cliques"
        value={formatCompact(data.clicks.value)}
        change={data.clicks.change}
        icon={MousePointerClick}
      />
      <StatsCard
        title="CTR"
        value={`${data.ctr.value.toFixed(2)}%`}
        change={data.ctr.change}
        icon={TrendingUp}
      />
      
      {/* Custom Metrics */}
      {data.customMetrics && data.customMetrics.map((cm, idx) => (
        <StatsCard
          key={cm.id || idx}
          title={cm.title}
          value={cm.value}
          change={cm.change}
          icon={cm.icon || Activity}
        />
      ))}
      
      {/* Fallback original metrics if no custom metrics provided for those slots */}
      {(!data.customMetrics || data.customMetrics.length === 0) && (
        <>
          <StatsCard
            title="CPC Médio"
            value={formatCurrency(data.cpc.value)}
            change={data.cpc.change}
            icon={Target}
          />
          <StatsCard
            title="ROAS"
            value={`${data.roas.value.toFixed(2)}x`}
            change={data.roas.change}
            icon={Activity}
          />
        </>
      )}
    </div>
  );
}
