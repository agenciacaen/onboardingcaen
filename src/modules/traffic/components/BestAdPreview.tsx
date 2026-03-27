
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BestAdData {
  id: string;
  name: string;
  thumbnail_url: string;
  roas: number;
  ctr: number;
  spend: number;
}

interface BestAdPreviewProps {
  ads: BestAdData[];
}

export function BestAdPreview({ ads }: BestAdPreviewProps) {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  return (
    <Card className="col-span-1 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Top Performers
          </CardTitle>
          <CardDescription>Melhores anúncios por ROAS</CardDescription>
        </div>
        <Link to="best-ads" className="text-xs text-primary flex items-center hover:underline">
          Ver todos
          <ArrowUpRight className="h-3 w-3 ml-1" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível no período.</p>
          ) : (
            ads.map((ad, index) => (
              <div key={ad.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border hover:border-primary/50 transition-colors">
                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {ad.thumbnail_url ? (
                    <img src={ad.thumbnail_url} alt={ad.name} className="object-cover h-full w-full" />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-xs font-medium text-muted-foreground">
                      SEM IMG
                    </div>
                  )}
                  {index === 0 && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded-bl-md">
                      #1
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={ad.name}>{ad.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-500/10 text-green-600 dark:text-green-500">
                      ROAS {ad.roas.toFixed(2)}x
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      CTR {ad.ctr.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium">{formatCurrency(ad.spend)}</p>
                  <p className="text-[10px] text-muted-foreground">Gasto</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
