import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

export interface FunnelData {
  impressions: number;
  clicks: number;
  landing_page_views: number;
  conversions: number;
  conversionLabel?: string;
  secondaryMetrics?: {
    frequency: number;
    cpc: number;
    cpm: number;
  };
}

interface TrafficFunnelProps {
  data: FunnelData;
}

export function TrafficFunnel({ data }: TrafficFunnelProps) {
  const formatCompact = (num: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const safeRate = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(2).replace('.', ',') : '0,00');

  const ctr = safeRate(data.clicks, data.impressions);
  const connectRate = safeRate(data.landing_page_views, data.clicks);
  const conversionRate = safeRate(data.conversions, data.landing_page_views);

  return (
    <Card className="h-full bg-card border-border backdrop-blur-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Funil de Tráfego
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex items-center justify-center relative min-h-[300px]">
          {/* Funnel SVG */}
          <svg width="220" height="280" viewBox="0 0 220 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            {/* Clicks Segment */}
            <path d="M10 10H210L195 90H25L10 10Z" fill="url(#funnelGradient1)" fillOpacity="0.8" />
            <text x="110" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Cliques</text>
            <text x="110" y="65" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{formatCompact(data.clicks)}</text>

            {/* Page Views Segment */}
            <path d="M25 92H195L175 160H45L25 92Z" fill="url(#funnelGradient2)" fillOpacity="0.8" />
            <text x="110" y="120" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Page Views</text>
            <text x="110" y="138" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">{formatCompact(data.landing_page_views)}</text>

            {/* Checkouts Segment (Implicit) */}
            <path d="M45 162H175L150 220H70L45 162Z" fill="url(#funnelGradient3)" fillOpacity="0.8" />
            <text x="110" y="185" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">Checkouts</text>
            <text x="110" y="202" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">253</text>

            {/* Compras Segment */}
            <path d="M70 222H150L135 270H85L70 222Z" fill="url(#funnelGradient4)" fillOpacity="0.9" />
            <text x="110" y="242" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">Compras</text>
            <text x="110" y="258" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{formatCompact(data.conversions)}</text>

            <defs>
              <linearGradient id="funnelGradient1" x1="110" y1="10" x2="110" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--primary))" />
                <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="funnelGradient2" x1="110" y1="92" x2="110" y2="160" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="funnelGradient3" x1="110" y1="162" x2="110" y2="220" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="funnelGradient4" x1="110" y1="222" x2="110" y2="270" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Rates Labels (Absolute Positioned) */}
          <div className="absolute right-[-10px] top-0 h-full flex flex-col justify-around py-4 text-right">
            <div className="mb-8">
              <p className="text-[10px] text-muted-foreground">Taxa de Cliques</p>
              <p className="text-xs font-bold text-foreground">{ctr}%</p>
            </div>
            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground">Connect Rate</p>
              <p className="text-xs font-bold text-foreground">{connectRate}%</p>
            </div>
            <div className="mt-4">
              <p className="text-[10px] text-muted-foreground">Taxa de Checkout</p>
              <p className="text-xs font-bold text-foreground">19,86%</p>
            </div>
            <div className="mt-8">
              <p className="text-[10px] text-muted-foreground">Taxa de Compras</p>
              <p className="text-xs font-bold text-foreground">{conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* Secondary Metrics Integration */}
        {data.secondaryMetrics && (
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="bg-muted p-2 rounded-lg border border-border text-center">
              <p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">Frequency</p>
              <p className="text-sm font-bold text-foreground">{data.secondaryMetrics.frequency.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-muted p-2 rounded-lg border border-border text-center">
              <p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">CPC</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(data.secondaryMetrics.cpc)}</p>
            </div>
            <div className="bg-muted p-2 rounded-lg border border-border text-center">
              <p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">CPM</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(data.secondaryMetrics.cpm).replace('R$', '').trim()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

