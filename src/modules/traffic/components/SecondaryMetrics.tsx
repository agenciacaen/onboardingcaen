import { Card, CardContent } from '@/components/ui/card';
import { Repeat, MousePointerClick, LayoutGrid } from 'lucide-react';

export interface SecondaryMetricsData {
  frequency: number;
  cpc: number;
  cpm: number;
}

interface SecondaryMetricsProps {
  data: SecondaryMetricsData;
}

export function SecondaryMetrics({ data }: SecondaryMetricsProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const items = [
    {
      label: 'Frequência',
      value: data.frequency.toFixed(2),
      icon: Repeat,
      description: 'Média de vezes que cada pessoa viu',
    },
    {
      label: 'CPC',
      value: formatCurrency(data.cpc),
      icon: MousePointerClick,
      description: 'Custo por clique',
    },
    {
      label: 'CPM',
      value: formatCurrency(data.cpm),
      icon: LayoutGrid,
      description: 'Custo por mil impressões',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
