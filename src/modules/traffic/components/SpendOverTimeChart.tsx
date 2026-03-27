import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SpendDataPoint {
  date: string;
  spend: number;
}

interface SpendOverTimeChartProps {
  data: SpendDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-background border rounded p-2 shadow-sm text-sm">
        <p className="font-semibold">{format(new Date(label), 'dd/MM/yyyy')}</p>
        <p className="text-primary">
          Gasto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SpendOverTimeChart({ data }: SpendOverTimeChartProps) {
  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), 'dd MMM', { locale: ptBR });
  };

  const formatYAxis = (tickItem: number) => {
    return new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(tickItem);
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Investimento por Dia</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
              dy={10}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="spend" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              dot={{ r: 4, fill: "hsl(var(--primary))" }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
