import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import type { AdData } from './AdSetList';
import { AdStatusBadge } from './AdStatusBadge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const MOCK_HISTORY_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: subDays(new Date(), 30 - i).toISOString(),
  clicks: Math.floor(Math.abs(Math.sin(i)) * 50) + 10,
  roas: (Math.abs(Math.cos(i)) * 5) + 1
}));

interface AdDetailModalProps {
  ad: AdData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdDetailModal({ ad, isOpen, onClose }: AdDetailModalProps) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  if (!ad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {ad.name}
                {ad.is_best && <Badge className="bg-primary text-primary-foreground text-[10px]">TOP PERFORMER</Badge>}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <AdStatusBadge status={ad.status} />
                <span>• ID Externo: 123456789</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Criativo Preview */}
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
              {ad.thumbnail_url ? (
                <img src={ad.thumbnail_url} alt={ad.name} className="object-contain w-full h-full" />
              ) : (
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Visualização do Criativo</span>
              )}
            </div>
            
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Headline</span>
                <p className="text-sm font-medium mt-1">Sua Próxima Conquista Começa Aqui</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Copy Original</span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Descubra as melhore condições para morar no coração da cidade. Apartamentos de 2 e 3 dormitórios com suíte e lazer completo. Clique e agende sua visita hoje mesmo!
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">CTA</span>
                  <p className="text-sm mt-1">Saiba Mais</p>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">URL Destino</span>
                  <p className="text-sm mt-1 text-primary truncate">lp.caen.com.br/oferta-exclusiva</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Data */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Impressões</p>
                <p className="text-lg font-bold">{ad.impressions?.toLocaleString() || '12.450'}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">ROAS</p>
                <p className="text-lg font-bold text-emerald-600">{ad.roas.toFixed(2)}x</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Investido</p>
                <p className="text-lg font-bold">{formatCurrency(ad.spend || 450.00)}</p>
              </div>
            </div>

            <div className="h-[200px] w-full bg-muted/10 rounded-lg p-2 border">
              <p className="text-xs font-bold text-muted-foreground mb-4 px-2">CLIQUES DIÁRIOS (Últimos 30 dias)</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_HISTORY_DATA}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    hide
                  />
                  <YAxis hide />
                  <Tooltip 
                    labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorClicks)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-md border bg-background overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold">Métrica</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="text-xs">
                    <TableCell>CTR (Taxa de Cliques)</TableCell>
                    <TableCell className="text-right font-medium">{ad.ctr}%</TableCell>
                  </TableRow>
                  <TableRow className="text-xs">
                    <TableCell>CPC Médio</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(ad.cpc)}</TableCell>
                  </TableRow>
                  <TableRow className="text-xs">
                    <TableCell>CPM (Custo por Mil)</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(12.45)}</TableCell>
                  </TableRow>
                  <TableRow className="text-xs">
                    <TableCell>Conversões</TableCell>
                    <TableCell className="text-right font-medium">42</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
