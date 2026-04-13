import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CampaignData {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok' | 'linkedin';
  status: 'active' | 'paused' | 'ended' | 'draft';
  budget_daily: number;
  spend: number;
  adsets_count?: number;
  ads_count?: number;
  impressions: number;
  clicks: number;
  roas: number;
  custom_metrics?: Record<string, number>;
}

interface CampaignTableProps {
  data: CampaignData[];
}

export function CampaignTable({ data }: CampaignTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-card border-border backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">Campanhas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar campanha..."
                className="pl-8 h-8 text-[11px] bg-muted border-border text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="text-[10px] uppercase tracking-widest border-border bg-muted/20 hover:bg-transparent">
              <TableHead className="w-8 text-center text-muted-foreground font-bold">#</TableHead>
              <TableHead className="text-muted-foreground font-bold">Campanhas</TableHead>
              <TableHead className="text-muted-foreground font-bold text-center">Conjuntos</TableHead>
              <TableHead className="text-muted-foreground font-bold text-center">Anúncios</TableHead>
              <TableHead className="text-right text-muted-foreground font-bold">Investimento</TableHead>
              <TableHead className="w-[100px] text-right text-muted-foreground font-bold">% Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                  Nenhuma campanha encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((campaign, index) => {
                const changePercent = Math.random() > 0.5 ? (Math.random() * 30).toFixed(1) : (-Math.random() * 30).toFixed(1);
                const isPositive = parseFloat(changePercent) >= 0;

                return (
                  <TableRow key={campaign.id} className="text-[11px] border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center text-muted-foreground font-medium pb-3 pt-3">
                      {index + 1}.
                    </TableCell>
                    <TableCell className="pb-3 pt-3">
                      <span className="font-bold text-foreground truncate max-w-[220px] block">{campaign.name}</span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground pb-3 pt-3">
                      Conjunto 0{Math.floor(Math.random() * 5) + 1}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground pb-3 pt-3">
                      Relatório profissional
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary pb-3 pt-3">
                      {formatCurrency(campaign.spend)}
                    </TableCell>
                    <TableCell className="text-right pb-3 pt-3">
                      <span className={cn(
                        "font-bold py-1 px-2 rounded-sm",
                        isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                      )}>
                        {isPositive ? '+' : ''}{changePercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
