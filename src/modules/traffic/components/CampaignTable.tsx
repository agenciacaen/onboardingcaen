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
import { Eye, Search, Filter, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
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

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-600 border-green-200">Ativa</Badge>;
      case 'paused': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pausada</Badge>;
      case 'ended': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Encerrada</Badge>;
      case 'draft': return <Badge className="bg-slate-500/10 text-slate-600 border-slate-200">Rascunho</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'meta': return <div className="text-blue-600 font-bold text-xs p-1 bg-blue-50 rounded-sm inline-block min-w-8 text-center">META</div>;
      case 'google': return <div className="text-red-500 font-bold text-xs p-1 bg-red-50 rounded-sm inline-block min-w-8 text-center">GOOG</div>;
      case 'tiktok': return <div className="text-black dark:text-white font-bold text-xs p-1 bg-neutral-100 dark:bg-neutral-800 rounded-sm inline-block min-w-8 text-center">TICK</div>;
      case 'linkedin': return <div className="text-blue-800 font-bold text-xs p-1 bg-blue-100 rounded-sm inline-block min-w-8 text-center">LINK</div>;
      default: return <span className="text-xs uppercase font-medium">{platform}</span>;
    }
  }

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMetricLabel = META_METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label || 'Ações';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar campanha..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <span>Métricas: {selectedMetricLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Coluna Customizada</DropdownMenuLabel>
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

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Orçamento / Dia</TableHead>
              <TableHead className="text-right">Gasto</TableHead>
              <TableHead className="text-right">{selectedMetricLabel}</TableHead>
              <TableHead className="text-right">CPA ({selectedMetricLabel})</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma campanha encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((campaign) => {
                const metricValue = campaign.custom_metrics?.[selectedMetric] || 0;
                const cpa = metricValue > 0 ? campaign.spend / metricValue : 0;
                
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(campaign.platform)}
                        <span className="font-medium text-sm">{campaign.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(campaign.budget_daily)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(campaign.spend)}
                    </TableCell>
                    
                    {/* Dynamic Columns */}
                    <TableCell className="text-right font-medium text-slate-800 dark:text-slate-100">
                      {metricValue}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(cpa)}
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-emerald-600 font-semibold">{campaign.roas.toFixed(2)}x</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/client/traffic/campaigns/${campaign.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
