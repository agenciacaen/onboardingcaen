import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { TrafficKpiCards } from '@/modules/traffic/components/TrafficKpiCards';
import { AdSetList } from '@/modules/traffic/components/AdSetList';
import type { AdData } from '@/modules/traffic/components/AdSetList';
import { AdDetailModal } from '@/modules/traffic/components/AdDetailModal';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2, MoreHorizontal } from 'lucide-react';
import { subDays, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget_daily: number;
}

export function ClientCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { clientId } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [ads, setAds] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    impressions: { value: 0, change: 0 },
    clicks: { value: 0, change: 0 },
    ctr: { value: 0, change: 0 },
    cpc: { value: 0, change: 0 },
    roas: { value: 0, change: 0 },
    spend: { value: 0, change: 0 },
    purchases: { value: 0, change: 0 },
    revenue: { value: 0, change: 0 },
    landing_page_views: { value: 0, change: 0 }
  });

  useEffect(() => {
    async function fetchCampaignData() {
      if (!id || !clientId) return;

      try {
        setLoading(true);

        // Fetch campaign info
        const { data: campaignData, error: campaignError } = await supabase
          .from('traffic_campaigns')
          .select('id, name, platform, status, budget_daily')
          .eq('id', id)
          .eq('client_id', clientId)
          .single();

        if (campaignError) throw campaignError;
        setCampaign(campaignData);

        // Fetch aggregated metrics for this campaign in the date range
        const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

        const { data: metricsData, error: metricsError } = await supabase
          .from('traffic_metrics')
          .select('spend, impressions, clicks, conversions, revenue')
          .eq('campaign_id', id)
          .gte('date', startDate)
          .lte('date', endDate);

        if (metricsError) throw metricsError;

        // Aggregate metrics
        const totals = (metricsData || []).reduce(
          (acc, m) => ({
            spend: acc.spend + (m.spend || 0),
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            conversions: acc.conversions + (m.conversions || 0),
            revenue: acc.revenue + (m.revenue || 0),
          }),
          { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
        );

        const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
        const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
        const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

        setKpis({
          impressions: { value: totals.impressions, change: 0 },
          clicks: { value: totals.clicks, change: 0 },
          ctr: { value: parseFloat(ctr.toFixed(2)), change: 0 },
          cpc: { value: parseFloat(cpc.toFixed(2)), change: 0 },
          roas: { value: parseFloat(roas.toFixed(2)), change: 0 },
          spend: { value: totals.spend, change: 0 },
          purchases: { value: totals.conversions, change: 0 },
          revenue: { value: totals.revenue, change: 0 },
          landing_page_views: { value: Math.round(totals.clicks * 0.8), change: 0 } // Estimativa se não houver LPV direto
        });

        // Fetch ads for campaign
        const { data: adsData, error: adsError } = await supabase
          .from('traffic_ads')
          .select('id, name, status, ctr, cpc, roas, impressions, spend, is_best')
          .eq('campaign_id', id);

        if (adsError) throw adsError;
        setAds((adsData || []) as AdData[]);

      } catch (err) {
        console.error('Erro ao carregar campanha:', err);
        toast.error('Não foi possível carregar os dados da campanha.');
      } finally {
        setLoading(false);
      }
    }

    fetchCampaignData();
  }, [id, clientId, dateRange]);

  const handleAdClick = (ad: AdData) => {
    setSelectedAd(ad);
    setIsAdModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" rows={1} cols={3} />
        <LoadingSkeleton type="table" rows={4} cols={5} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">Campanha não encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/client/traffic/campaigns')}>
          Voltar para Campanhas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-fit gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/client/traffic/campaigns')}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para Campanhas
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="uppercase font-bold text-[10px] bg-blue-50 text-blue-700 border-blue-100 px-2">
              {campaign.platform}
            </Badge>
            <PageHeader title={campaign.name} description="Visão detalhada de performance e anúncios da campanha." className="p-0 space-y-0" />
          </div>
          <div className="flex items-center gap-2">
            <DateRangeSelector date={dateRange} setDate={setDateRange} />
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TrafficKpiCards data={kpis} />

      <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Anúncios da Campanha</h3>
            <p className="text-sm text-muted-foreground">Compare os criativos e performance individualmente</p>
          </div>
        </div>
        
        {ads.length > 0 ? (
          <AdSetList ads={ads} onAdClick={handleAdClick} />
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum anúncio encontrado para esta campanha.
          </div>
        )}
      </div>

      <AdDetailModal 
        ad={selectedAd} 
        isOpen={isAdModalOpen} 
        onClose={() => setIsAdModalOpen(false)} 
      />
    </div>
  );
}
