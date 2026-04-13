import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

export interface FunnelStep {
  label: string;
  value: number;
}

export interface FunnelData {
  steps: FunnelStep[];
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

  // Fallback to default steps if none provided (maintenance mode or initial load)
  const steps = data.steps && data.steps.length > 0 ? data.steps : [
    { label: 'Cliques', value: 0 },
    { label: 'Page Views', value: 0 },
    { label: 'Checkouts', value: 0 },
    { label: 'Compras', value: 0 },
  ];

  const totalSteps = steps.length;
  const svgWidth = 220;
  const svgHeight = 280;
  const marginTop = 10;
  const marginBottom = 10;
  const padding = 2;
  const availableHeight = svgHeight - marginTop - marginBottom - (totalSteps - 1) * padding;
  const stepHeight = availableHeight / totalSteps;
  
  const initialWidth = 200;
  const finalWidth = 60;
  const widthReduction = (initialWidth - finalWidth) / totalSteps;

  const segments = steps.map((step, i) => {
    const yTop = marginTop + i * (stepHeight + padding);
    const yBottom = yTop + stepHeight;
    const wTop = initialWidth - i * widthReduction;
    const wBottom = initialWidth - (i + 1) * widthReduction;
    
    return {
      path: `M ${110 - wTop / 2} ${yTop} H ${110 + wTop / 2} L ${110 + wBottom / 2} ${yBottom} H ${110 - wBottom / 2} Z`,
      yText: yTop + stepHeight / 2,
      label: step.label,
      value: step.value,
      yTop,
      yBottom,
      gradientId: `funnelGradient${i}`
    };
  });

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
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            {segments.map((seg, i) => (
              <g key={i} className="transition-all duration-500">
                <path d={seg.path} fill={`url(#${seg.gradientId})`} fillOpacity={0.8 + (i * 0.05)} />
                <text x="110" y={seg.yText - 8} textAnchor="middle" fill="white" fontSize={Math.max(8, 12 - i)} fontWeight="600" className="pointer-events-none">
                  {seg.label}
                </text>
                <text x="110" y={seg.yText + 12} textAnchor="middle" fill="white" fontSize={Math.max(10, 16 - i)} fontWeight="bold" className="pointer-events-none">
                  {formatCompact(seg.value)}
                </text>
              </g>
            ))}

            <defs>
              {segments.map((seg, i) => (
                <linearGradient key={i} id={seg.gradientId} x1="110" y1={seg.yTop} x2="110" y2={seg.yBottom} gradientUnits="userSpaceOnUse">
                  <stop stopColor="hsl(var(--primary))" stopOpacity={1 - (i * 0.15)} />
                  <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity={0.8 - (i * 0.15)} />
                </linearGradient>
              ))}
            </defs>
          </svg>

          {/* Rates Labels (Absolute Positioned) */}
          <div className="absolute right-[-10px] top-0 h-full flex flex-col justify-between py-8 text-right pr-2">
            {steps.map((_, i) => {
              if (i === steps.length - 1) {
                // Final Conversion Rate
                if (steps.length > 2) {
                  return (
                    <div key="final" className="mt-auto">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Taxa Final</p>
                      <p className="text-xs font-black text-primary">{safeRate(steps[steps.length - 1].value, steps[0].value)}%</p>
                    </div>
                  );
                }
                return null;
              }
              
              return (
                <div key={i} className="group transition-all">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Taxa {i+1}-{i+2}</p>
                  <p className="text-xs font-black text-foreground">{safeRate(steps[i+1].value, steps[i].value)}%</p>
                </div>
              );
            })}
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

