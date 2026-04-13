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
import { Search, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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
  campaigns?: CampaignData[];
  adSets?: any[];
  ads?: any[];
}

export function CampaignTable({ campaigns = [], adSets = [], ads = [] }: CampaignTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('campaigns');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const filterData = (dataList: any[]) => {
    return dataList.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredCampaigns = filterData(campaigns);
  const filteredAdSets = filterData(adSets);
  const filteredAds = filterData(ads);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-500';
      case 'paused': return 'bg-amber-500';
      case 'ended': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <Card className="bg-card border-border backdrop-blur-sm overflow-hidden">
      <Tabs defaultValue="campaigns" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <CardHeader className="pb-3 border-b border-border bg-muted/10">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            
            <TabsList className="bg-muted/50 border border-border">
              <TabsTrigger value="campaigns" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Campanhas ({filteredCampaigns.length})
              </TabsTrigger>
              <TabsTrigger value="adsets" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Conjuntos ({filteredAdSets.length})
              </TabsTrigger>
              <TabsTrigger value="ads" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Anúncios ({filteredAds.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={`Buscar em ${activeTab === 'campaigns' ? 'campanhas' : activeTab === 'adsets' ? 'conjuntos' : 'anúncios'}...`}
                  className="pl-8 h-8 text-[11px] bg-muted border-border text-foreground"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <TabsContent value="campaigns" className="m-0 border-none outline-none">
            <CampaignsView data={filteredCampaigns} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
          </TabsContent>
          <TabsContent value="adsets" className="m-0 border-none outline-none">
            <AdSetsView data={filteredAdSets} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
          </TabsContent>
          <TabsContent value="ads" className="m-0 border-none outline-none">
            <AdsView data={filteredAds} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

// ----------------------------------------------------
// VIEW: CAMPANHAS
// ----------------------------------------------------
function CampaignsView({ data, formatCurrency, getStatusColor }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-[10px] uppercase tracking-widest border-border bg-muted/20 hover:bg-transparent">
          <TableHead className="w-10 text-center text-muted-foreground font-bold">St</TableHead>
          <TableHead className="text-muted-foreground font-bold">Campanha</TableHead>
          <TableHead className="text-right text-muted-foreground font-bold">Investimento</TableHead>
          <TableHead className="text-right text-muted-foreground font-bold">Cliques</TableHead>
          <TableHead className="text-right text-muted-foreground font-bold">Impressões</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs">Nenhuma campanha</TableCell>
          </TableRow>
        ) : (
          data.map((campaign: any) => (
            <TableRow key={campaign.id} className="text-[11px] border-border hover:bg-muted/30 transition-colors">
              <TableCell className="text-center pb-3 pt-3">
                 <div className={cn("w-2 h-2 rounded-full mx-auto", getStatusColor(campaign.status))} title={campaign.status} />
              </TableCell>
              <TableCell className="pb-3 pt-3 font-bold text-foreground">
                {campaign.name}
              </TableCell>
              <TableCell className="text-right font-bold text-primary pb-3 pt-3">
                {formatCurrency(campaign.spend)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground pb-3 pt-3">
                {campaign.clicks}
              </TableCell>
              <TableCell className="text-right text-muted-foreground pb-3 pt-3">
                {campaign.impressions}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

// ----------------------------------------------------
// VIEW: CONJUNTOS DE ANÚNCIOS
// ----------------------------------------------------
function AdSetsView({ data, formatCurrency, getStatusColor }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-[10px] uppercase tracking-widest border-border bg-muted/20 hover:bg-transparent">
          <TableHead className="w-10 text-center text-muted-foreground font-bold">St</TableHead>
          <TableHead className="text-muted-foreground font-bold">Conjunto de Anúncios</TableHead>
          <TableHead className="text-muted-foreground font-bold text-xs">Campanha</TableHead>
          <TableHead className="text-right text-muted-foreground font-bold">Investimento</TableHead>
          <TableHead className="text-right text-muted-foreground font-bold">Cliques</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs">Nenhum conjunto</TableCell>
          </TableRow>
        ) : (
          data.map((item: any) => (
            <TableRow key={item.id} className="text-[11px] border-border hover:bg-muted/30 transition-colors">
              <TableCell className="text-center pb-3 pt-3">
                 <div className={cn("w-2 h-2 rounded-full mx-auto", getStatusColor(item.status))} title={item.status} />
              </TableCell>
              <TableCell className="pb-3 pt-3 font-bold text-foreground">
                {item.name}
              </TableCell>
              <TableCell className="pb-3 pt-3 text-muted-foreground truncate max-w-[200px]">
                {item.campaign_name || '-'}
              </TableCell>
              <TableCell className="text-right font-bold text-primary pb-3 pt-3">
                {formatCurrency(item.spend)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground pb-3 pt-3">
                {item.clicks}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

// ----------------------------------------------------
// VIEW: ANÚNCIOS (COM THUMBNAIL)
// ----------------------------------------------------
function AdsView({ data, formatCurrency, getStatusColor }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-[10px] uppercase tracking-widest border-border bg-muted/20 hover:bg-transparent">
          <TableHead className="w-10 text-center text-muted-foreground font-bold">St</TableHead>
          <TableHead className="text-muted-foreground font-bold">Anúncio</TableHead>
          <TableHead className="text-muted-foreground font-bold text-xs hidden md:table-cell">Conjunto</TableHead>
          <TableHead className="text-right text-muted-foreground font-bold">Investimento</TableHead>
          <TableHead className="text-right text-muted-foreground font-bold">Cliques</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs">Nenhum anúncio</TableCell>
          </TableRow>
        ) : (
          data.map((item: any) => (
            <TableRow key={item.id} className="text-[11px] border-border hover:bg-muted/30 transition-colors">
              <TableCell className="text-center pb-3 pt-3">
                 <div className={cn("w-2 h-2 rounded-full mx-auto", getStatusColor(item.status))} title={item.status} />
              </TableCell>
              <TableCell className="pb-3 pt-3 flex items-center gap-3">
                <div className="flex-shrink-0 relative overflow-hidden rounded bg-slate-800 w-10 h-10 border border-slate-700 flex items-center justify-center">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-500 w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-foreground mb-0.5">{item.name}</div>
                  <div className="text-[9px] text-muted-foreground md:hidden truncate max-w-[150px]">
                    {item.adset_name || '-'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="pb-3 pt-3 text-muted-foreground truncate max-w-[150px] hidden md:table-cell">
                {item.adset_name || '-'}
              </TableCell>
              <TableCell className="text-right font-bold text-primary pb-3 pt-3">
                {formatCurrency(item.spend)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground pb-3 pt-3">
                {item.clicks}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
