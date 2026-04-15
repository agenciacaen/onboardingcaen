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

// =====================================================
// HELPERS
// =====================================================
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: val < 10 && val > 0 ? 2 : 0 }).format(val);

const formatNumber = (val: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

const formatPercent = (val: number) => `${val.toFixed(2)}%`;

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'bg-emerald-500';
    case 'paused': return 'bg-amber-500';
    case 'ended': return 'bg-slate-500';
    default: return 'bg-slate-500';
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'Ativo';
    case 'paused': return 'Pausado';
    case 'ended': return 'Encerrado';
    default: return 'Rascunho';
  }
};

// Extrair valor de uma métrica de custom_metrics (raw_actions mapeadas)
const getActionValue = (item: any, ...actionTypes: string[]): number => {
  if (!item?.custom_metrics) return 0;
  for (const type of actionTypes) {
    if (item.custom_metrics[type] !== undefined) {
      return item.custom_metrics[type];
    }
  }
  return 0;
};


// =====================================================
// MAIN COMPONENT
// =====================================================
export function CampaignTable({ campaigns = [], adSets = [], ads = [] }: CampaignTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('campaigns');

  const filterData = (dataList: any[]) => {
    return dataList.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredCampaigns = filterData(campaigns);
  const filteredAdSets = filterData(adSets);
  const filteredAds = filterData(ads);

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
            <CampaignsView data={filteredCampaigns} />
          </TabsContent>
          <TabsContent value="adsets" className="m-0 border-none outline-none">
            <AdSetsView data={filteredAdSets} />
          </TabsContent>
          <TabsContent value="ads" className="m-0 border-none outline-none">
            <AdsView data={filteredAds} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

// =====================================================
// TEMPLATE: CAMPANHAS
// Métricas: Status, Nome, Investimento, Impressões, 
// Cliques, CTR, ROAS, Conversões
// =====================================================
function CampaignsView({ data }: { data: CampaignData[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-[10px] uppercase tracking-widest border-border bg-muted/20 hover:bg-transparent">
            <TableHead className="w-10 text-center text-muted-foreground font-bold">St</TableHead>
            <TableHead className="text-muted-foreground font-bold min-w-[200px]">Campanha</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Investimento</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Impressões</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Cliques</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">CTR</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">ROAS</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Conversões</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-slate-500 text-xs">Nenhuma campanha encontrada</TableCell>
            </TableRow>
          ) : (
            data.map((campaign) => {
              const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
              const conversions = getActionValue(campaign, 
                'onsite_conversion.messaging_conversation_started_7d',
                'messaging_conversation_started_7d',
                'purchase', 'lead'
              );
              
              return (
                <TableRow key={campaign.id} className="text-[11px] border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="text-center py-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(campaign.status))} />
                      <span className="text-[8px] text-muted-foreground">{getStatusLabel(campaign.status)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 rounded-full bg-primary/60" />
                      <div>
                        <div className="font-bold truncate max-w-[180px]">{campaign.name}</div>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span className="uppercase tracking-widest">{campaign.platform}</span>
                          {campaign.budget_daily > 0 && (
                            <span className="text-primary/70">• {formatCurrency(campaign.budget_daily)}/dia</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary py-3">
                    {formatCurrency(campaign.spend)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatNumber(campaign.impressions)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatNumber(campaign.clicks)}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      ctr > 2 ? "bg-emerald-500/10 text-emerald-400" : ctr > 1 ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"
                    )}>
                      {formatPercent(ctr)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className={cn(
                      "text-[11px] font-bold",
                      campaign.roas >= 3 ? "text-emerald-400" : campaign.roas >= 1 ? "text-amber-400" : "text-red-400"
                    )}>
                      {campaign.roas.toFixed(2)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground py-3">
                    {conversions > 0 ? formatNumber(conversions) : '-'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// =====================================================
// TEMPLATE: CONJUNTOS DE ANÚNCIOS
// Métricas relevantes para ad sets: Alcance, Frequência,
// CPM, Impressões, Cliques, CPC, CTR, 
// Custo por Resultado, Investimento
// =====================================================
function AdSetsView({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-[10px] uppercase tracking-widest border-border bg-muted/20 hover:bg-transparent">
            <TableHead className="w-10 text-center text-muted-foreground font-bold">St</TableHead>
            <TableHead className="text-muted-foreground font-bold min-w-[200px]">Conjunto de Anúncios</TableHead>
            <TableHead className="text-muted-foreground font-bold text-xs hidden lg:table-cell">Campanha</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Investimento</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Alcance</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Impressões</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Frequência</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">CPM</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Cliques</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">CPC</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">CTR</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Resultados</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Custo/Res.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="text-center py-8 text-slate-500 text-xs">Nenhum conjunto de anúncios encontrado</TableCell>
            </TableRow>
          ) : (
            data.map((item: any) => {
              const reach = item.reach || 0;
              const frequency = reach > 0 ? item.impressions / reach : 0;
              const cpm = item.impressions > 0 ? (item.spend / item.impressions) * 1000 : 0;
              const cpc = item.clicks > 0 ? item.spend / item.clicks : 0;
              const ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;

              // Resultados (conversões do conjunto)
              const results = getActionValue(item, 
                'onsite_conversion.messaging_conversation_started_7d',
                'messaging_conversation_started_7d',
                'purchase', 'lead', 'landing_page_view'
              );
              const costPerResult = results > 0 ? item.spend / results : 0;

              return (
                <TableRow key={item.id} className="text-[11px] border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="text-center py-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(item.status))} />
                      <span className="text-[8px] text-muted-foreground">{getStatusLabel(item.status)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 rounded-full bg-amber-500/60" />
                      <div>
                        <div className="font-bold text-foreground truncate max-w-[180px]">{item.name}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 lg:hidden truncate max-w-[150px]">
                          {item.campaign_name || '-'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground truncate max-w-[150px] hidden lg:table-cell text-xs">
                    {item.campaign_name || '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary py-3">
                    {formatCurrency(item.spend)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {reach > 0 ? formatNumber(reach) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatNumber(item.impressions)}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      frequency > 3 ? "bg-red-500/10 text-red-400" : frequency > 2 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                    )}>
                      {frequency.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatCurrency(cpm)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatNumber(item.clicks)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatCurrency(cpc)}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      ctr > 2 ? "bg-emerald-500/10 text-emerald-400" : ctr > 1 ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"
                    )}>
                      {formatPercent(ctr)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground py-3">
                    {results > 0 ? formatNumber(results) : '-'}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {costPerResult > 0 ? (
                      <span className={cn(
                        "text-[10px] font-bold",
                        costPerResult < 10 ? "text-emerald-400" : costPerResult < 30 ? "text-amber-400" : "text-red-400"
                      )}>
                        {formatCurrency(costPerResult)}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// =====================================================
// TEMPLATE: ANÚNCIOS
// Métricas relevantes para ads: Preview criativo, 
// Investimento, Impressões, Cliques, CTR, CPC,
// Engajamento (Reações, Comentários, Compartilhamentos),
// Vídeo (ThruPlays, % assistido), Resultados
// =====================================================
function AdsView({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-[10px] uppercase tracking-widest border-border bg-muted/20 hover:bg-transparent">
            <TableHead className="w-10 text-center text-muted-foreground font-bold">St</TableHead>
            <TableHead className="text-muted-foreground font-bold min-w-[250px]">Anúncio</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Investimento</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Impressões</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Cliques</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">CTR</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">CPC</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Reações</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Comentários</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Compart.</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">ThruPlays</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Vídeo 50%</TableHead>
            <TableHead className="text-right text-muted-foreground font-bold">Resultados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="text-center py-8 text-slate-500 text-xs">Nenhum anúncio encontrado</TableCell>
            </TableRow>
          ) : (
            data.map((item: any) => {
              const ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
              const cpc = item.clicks > 0 ? item.spend / item.clicks : 0;

              // Engagement
              const reactions = getActionValue(item, 'post_reaction', 'like');
              const comments = getActionValue(item, 'comment');
              const shares = getActionValue(item, 'shared', 'post');
              
              // Video
              const thruPlays = getActionValue(item, 'video_view') || item.custom_metrics?.['thruplay'] || 0;
              const video50 = item.custom_metrics?.['video_p50_watched_actions'] || 0;

              // Resultados
              const results = getActionValue(item, 
                'onsite_conversion.messaging_conversation_started_7d',
                'messaging_conversation_started_7d',
                'purchase', 'lead'
              );

              // Engajamento total para a badge
              const totalEngagement = reactions + comments + shares;

              return (
                <TableRow key={item.id} className="text-[11px] border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="text-center py-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(item.status))} />
                      <span className="text-[8px] text-muted-foreground">{getStatusLabel(item.status)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      {/* PREVIEW DO CRIATIVO */}
                      <div className="flex-shrink-0 relative overflow-hidden rounded-lg bg-slate-800/80 w-12 h-12 border border-slate-700/50 flex items-center justify-center shadow-md group/thumb">
                        {item.thumbnail_url ? (
                          <>
                            <img 
                              src={item.thumbnail_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110" 
                            />
                            {/* Overlay de formato */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-0.5">
                              <span className="text-[7px] text-white/80 font-bold uppercase tracking-widest">
                                {item.format || 'img'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="text-slate-500 w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground truncate max-w-[180px]">{item.name}</div>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span className="truncate max-w-[100px]">{item.adset_name || '-'}</span>
                          {totalEngagement > 0 && (
                            <span className="flex items-center gap-0.5 text-pink-400">
                              • ❤ {formatNumber(totalEngagement)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary py-3">
                    {formatCurrency(item.spend)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatNumber(item.impressions)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatNumber(item.clicks)}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      ctr > 2 ? "bg-emerald-500/10 text-emerald-400" : ctr > 1 ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"
                    )}>
                      {formatPercent(ctr)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground py-3">
                    {formatCurrency(cpc)}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {reactions > 0 ? (
                      <span className="text-pink-400 font-semibold">{formatNumber(reactions)}</span> 
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {comments > 0 ? (
                      <span className="text-primary/80 font-semibold">{formatNumber(comments)}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {shares > 0 ? (
                      <span className="text-emerald-400 font-semibold">{formatNumber(shares)}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {thruPlays > 0 ? (
                      <span className="text-violet-400 font-semibold">{formatNumber(thruPlays)}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {video50 > 0 ? (
                      <span className="text-violet-400/80 font-semibold">{formatNumber(video50)}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    {results > 0 ? (
                      <span className="font-bold text-emerald-400">{formatNumber(results)}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
