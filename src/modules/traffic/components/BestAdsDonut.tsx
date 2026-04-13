import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Trophy } from 'lucide-react';

export interface TopAdData {
  name: string;
  spend: number;
  conversions: number;
  color?: string;
}

interface BestAdsDonutProps {
  ads: TopAdData[];
  metricLabel?: string;
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#6366f1'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    return (
      <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
        <p className="font-semibold truncate max-w-[180px]">{payload[0].name}</p>
        <p className="text-muted-foreground">Investimento: {formatCurrency(payload[0].payload.spend)}</p>
        <p className="text-muted-foreground">Resultado: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function BestAdsDonut({ ads, metricLabel = 'Por Resultado' }: BestAdsDonutProps) {
  const chartData = ads.map((ad, i) => ({
    name: ad.name.length > 30 ? ad.name.substring(0, 30) + '...' : ad.name,
    value: ad.conversions,
    spend: ad.spend,
    color: COLORS[i % COLORS.length],
  }));

  const totalConversions = ads.reduce((acc, ad) => acc + ad.conversions, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Melhores Anúncios
        </CardTitle>
        <CardDescription>{metricLabel}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {ads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível.</p>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-[160px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold">{totalConversions}</span>
                <span className="text-[10px] text-muted-foreground">Total</span>
              </div>
            </div>
            {/* Legend */}
            <div className="w-full mt-3 space-y-1.5">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate flex-1 text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
