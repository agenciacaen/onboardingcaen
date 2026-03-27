import { AdStatusBadge } from './AdStatusBadge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface AdData {
  id: string;
  name: string;
  thumbnail_url?: string;
  status: 'active' | 'paused' | 'rejected' | 'draft';
  ctr: number;
  cpc: number;
  roas: number;
  is_best?: boolean;
  impressions?: number;
  spend?: number;
}

interface AdSetListProps {
  ads: AdData[];
  onAdClick?: (ad: AdData) => void;
}

export function AdSetList({ ads, onAdClick }: AdSetListProps) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ads.map((ad) => (
        <Card 
          key={ad.id} 
          className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
          onClick={() => onAdClick?.(ad)}
        >
          <div className="relative aspect-video bg-muted overflow-hidden">
            {ad.thumbnail_url ? (
              <img src={ad.thumbnail_url} alt={ad.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <span className="text-xs font-medium uppercase">Preview Indisponível</span>
              </div>
            )}
            <div className="absolute top-2 left-2">
              <AdStatusBadge status={ad.status} className="bg-background/80 backdrop-blur-sm" />
            </div>
            {ad.is_best && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary text-primary-foreground shadow-sm">Melhor Ad</Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm line-clamp-1 mb-3" title={ad.name}>{ad.name}</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">ROAS</span>
                <span className="text-sm font-bold text-emerald-600">{ad.roas.toFixed(2)}x</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">CTR</span>
                <span className="text-sm font-semibold">{ad.ctr.toFixed(2)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">CPC</span>
                <span className="text-sm font-semibold">{formatCurrency(ad.cpc)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4 py-2 border-t bg-muted/20 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Clique para ver detalhes</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Métricas acumuladas no período selecionado</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
