import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CampaignData {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok' | 'linkedin';
  status: 'active' | 'paused' | 'ended' | 'draft';
  budget_daily: number;
  spend: number;
  impressions: number;
  clicks: number;
  roas: number;
  custom_metrics?: Record<string, number>;
}

interface CampaignTableProps {
  data: CampaignData[];
}

export const META_METRIC_OPTIONS = [
  { id: 'onsite_conversion.total_messaging_connection', label: 'Conversas Iniciadas' },
  { id: 'lead', label: 'Leads (Cadastros)' },
  { id: 'purchase', label: 'Compras' },
  { id: 'landing_page_view', label: 'Visitas na Página' },
  { id: 'post_engagement', label: 'Engajamento' },
];

export function CampaignTable({ data }: CampaignTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('onsite_conversion.total_messaging_connection');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px]">Ativa</Badge>;
      case 'paused': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">Pausada</Badge>;
      case 'ended': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px]">Encerrada</Badge>;
      case 'draft': return <Badge className="bg-slate-500/10 text-slate-600 border-slate-200 text-[10px]">Rascunho</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate max spend for bar width calculation
  const maxSpend = Math.max(...filteredData.map(c => c.spend), 1);

  const selectedMetricLabel = META_METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label || 'Ações';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <CardTitle className="text-base">Campanhas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar campanha..."
                className="pl-8 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 text-xs">
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>{selectedMetricLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Coluna Customizada</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={selectedMetric} onValueChange={setSelectedMetric}>
                  {META_METRIC_OPTIONS.map((metricOption) => (
                    <DropdownMenuRadioItem key={metricOption.id} value={metricOption.id}>
                      {metricOption.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">{selectedMetricLabel}</TableHead>
              <TableHead className="text-right">Investimento</TableHead>
              <TableHead className="w-[140px]">% Gasto</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma campanha encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((campaign, index) => {
                const metricValue = campaign.custom_metrics?.[selectedMetric] || 0;
                const spendPercent = maxSpend > 0 ? (campaign.spend / maxSpend) * 100 : 0;
                const changePercent = Math.random() > 0.5
                  ? (Math.random() * 30).toFixed(1)
                  : (-Math.random() * 30).toFixed(1);
                const isPositive = parseFloat(changePercent) >= 0;

                return (
                  <TableRow key={campaign.id} className="text-xs">
                    <TableCell className="text-center text-muted-foreground font-medium">
                      {index + 1}.
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm truncate max-w-[200px] block">{campaign.name}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {metricValue}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(campaign.spend)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${spendPercent}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium min-w-[36px] text-right ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{changePercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={`/client/traffic/campaigns/${campaign.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
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
