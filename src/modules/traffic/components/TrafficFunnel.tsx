import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface FunnelData {
  impressions: number;
  clicks: number;
  landing_page_views: number;
  conversions: number;
  conversionLabel?: string;
}

interface TrafficFunnelProps {
  data: FunnelData;
}

export function TrafficFunnel({ data }: TrafficFunnelProps) {
  const formatCompact = (num: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

  const safeRate = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(2) : '0.00');

  const stages = [
    {
      label: 'Impressões',
      value: data.impressions,
      widthPercent: 100,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Cliques',
      value: data.clicks,
      widthPercent: data.impressions > 0 ? Math.max((data.clicks / data.impressions) * 100, 30) : 30,
      color: 'from-cyan-500 to-cyan-600',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      rate: safeRate(data.clicks, data.impressions),
      rateLabel: 'CTR',
    },
    {
      label: 'Visitas na Página',
      value: data.landing_page_views,
      widthPercent: data.impressions > 0 ? Math.max((data.landing_page_views / data.impressions) * 100, 22) : 22,
      color: 'from-violet-500 to-violet-600',
      textColor: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-500/10',
      rate: safeRate(data.landing_page_views, data.clicks),
      rateLabel: 'Taxa de Visita',
    },
    {
      label: data.conversionLabel || 'Conversões',
      value: data.conversions,
      widthPercent: data.impressions > 0 ? Math.max((data.conversions / data.impressions) * 100, 15) : 15,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      rate: safeRate(data.conversions, data.landing_page_views > 0 ? data.landing_page_views : data.clicks),
      rateLabel: 'Taxa de Conversão',
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18l-3 6h-12L3 4zm3 6v10h12V10" />
          </svg>
          Funil de Tráfego
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-3">
            {/* Funnel bar */}
            <div className="flex-1 relative">
              <div
                className={`h-10 rounded-lg bg-gradient-to-r ${stage.color} flex items-center justify-between px-3 transition-all duration-700 ease-out`}
                style={{ width: `${stage.widthPercent}%`, minWidth: '120px' }}
              >
                <span className="text-white text-xs font-semibold truncate">{stage.label}</span>
                <span className="text-white text-sm font-bold">{formatCompact(stage.value)}</span>
              </div>
            </div>
            {/* Conversion rate */}
            <div className="w-24 text-right flex-shrink-0">
              {stage.rate ? (
                <div>
                  <span className={`text-sm font-bold ${stage.textColor}`}>{stage.rate}%</span>
                  <p className="text-[10px] text-muted-foreground">{stage.rateLabel}</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
