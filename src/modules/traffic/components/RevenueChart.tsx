import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface RevenueDataPoint {
  date: string;
  spend: number;
  conversions: number;
}

interface RevenueChartProps {
  data: any[];
  metric1?: { id: string; label: string };
  metric2?: { id: string; label: string };
}

const CustomTooltip = ({ active, payload, label, metric1Label, metric2Label, metric1Id, metric2Id }: any) => {
  if (active && payload && payload.length && label) {
    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const isCurrency = (id: string) => ['spend', 'revenue', 'cpc', 'cpc_link', 'cpm'].includes(id);

    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1">{format(new Date(label), 'dd/MM/yyyy')}</p>
        {payload.map((entry: any, i: number) => {
          const mId = i === 0 ? metric1Id : metric2Id;
          const isCurr = isCurrency(mId);
          return (
            <p key={i} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {isCurr ? formatCurrency(entry.value) : entry.value.toFixed(id === 'roas' || id === 'ctr' ? 2 : 0)}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ 
  data, 
  metric1 = { id: 'spend', label: 'Investimento' }, 
  metric2 = { id: 'revenue', label: 'Receita' } 
}: RevenueChartProps) {
  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), 'dd/MM', { locale: ptBR });
  };

  const formatYAxis = (tickItem: number) => {
    return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(tickItem);
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{metric1.label} x {metric2.label}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorM1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorM2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.15)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dx={-5}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#10b981' }}
              dx={5}
            />
            <Tooltip content={<CustomTooltip metric1Id={metric1.id} metric2Id={metric2.id} />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey={metric1.id}
              name={metric1.label}
              stroke="hsl(var(--primary))"
              fill="url(#colorM1)"
              strokeWidth={3}
              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey={metric2.id}
              name={metric2.label}
              stroke="#10b981"
              fill="url(#colorM2)"
              strokeWidth={3}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

