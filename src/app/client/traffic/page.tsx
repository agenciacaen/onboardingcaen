import { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { TrafficKpiCards } from '@/modules/traffic/components/TrafficKpiCards';
import { SpendOverTimeChart } from '@/modules/traffic/components/SpendOverTimeChart';
import { CampaignStatusSummary } from '@/modules/traffic/components/CampaignStatusSummary';
import { BestAdPreview } from '@/modules/traffic/components/BestAdPreview';
import type { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { trafficService } from '@/modules/traffic/services/traffic.service';
import { supabase } from '@/services/supabase';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';

export function ClientTrafficPage() {
  const { clientId } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState({
    impressions: { value: 0, change: 0 },
    clicks: { value: 0, change: 0 },
    ctr: { value: 0, change: 0 },
    cpc: { value: 0, change: 0 },
    roas: { value: 0, change: 0 },
    spend: { value: 0, change: 0 }
  });
  const [spendHistory, setSpendHistory] = useState<Array<{ date: string; spend: number }>>([]);
  const [statusCounts, setStatusCounts] = useState({ active: 0, paused: 0, ended: 0, draft: 0 });
  const [bestAds, setBestAds] = useState<Array<{ id: string; name: string; thumbnail_url: string; roas: number; ctr: number; spend: number }>>([]);

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !dateRange?.from || !dateRange?.to) return;

      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      try {
        setIsLoading(true);

        // Fetch traffic overview from RPC
        const overview = await trafficService.getOverview(clientId, startDate, endDate);
        
        if (overview) {
          setKpis({
            impressions: { value: overview.total_impressions || 0, change: 0 },
            clicks: { value: overview.total_clicks || 0, change: 0 },
            ctr: { value: overview.avg_ctr || 0, change: 0 },
            cpc: { value: overview.avg_cpc || 0, change: 0 },
            roas: { value: overview.avg_roas || 0, change: 0 },
            spend: { value: overview.total_spend || 0, change: 0 }
          });
        }

        // Fetch campaign status counts
        const { data: campaigns, error: campError } = await supabase
          .from('traffic_campaigns')
          .select('status')
          .eq('client_id', clientId);

        if (!campError && campaigns) {
          const counts = { active: 0, paused: 0, ended: 0, draft: 0 };
          campaigns.forEach((c) => {
            const s = c.status as keyof typeof counts;
            if (s in counts) counts[s]++;
          });
          setStatusCounts(counts);
        }

        // Fetch spend history (daily metrics)
        const { data: metrics, error: metricsError } = await supabase
          .from('traffic_metrics')
          .select('date, spend')
          .eq('client_id', clientId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        if (!metricsError && metrics) {
          setSpendHistory(metrics.map(m => ({ date: m.date, spend: m.spend || 0 })));
        }

        // Fetch best ads from RPC
        const adsData = await trafficService.getBestAds(clientId, startDate, endDate, 'roas', 3);
        if (adsData) {
          setBestAds(adsData.map((ad: Record<string, unknown>) => ({
            id: ad.ad_id as string,
            name: ad.ad_name as string,
            thumbnail_url: (ad.creative_url as string) || '',
            roas: ad.roas as number,
            ctr: ad.ctr as number,
            spend: ad.spend as number
          })));
        }

      } catch (error) {
        console.error('Erro ao carregar dados de tráfego:', error);
        toast.error('Não foi possível carregar os dados de tráfego.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [clientId, dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tráfego Pago" description="Visão geral do desempenho de anúncios e campanhas." />
        <LoadingSkeleton type="card" rows={1} cols={3} />
        <LoadingSkeleton type="card" rows={1} cols={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Tráfego Pago" description="Visão geral do desempenho de anúncios e campanhas." />
        <div className="flex items-center gap-2">
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="icon" title="Gerar Relatório">
            <FileBarChart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TrafficKpiCards data={kpis} />

      <div className="mt-6 flex flex-col gap-4">
        <CampaignStatusSummary 
          data={statusCounts} 
          activeFilter={activeStatus} 
          onFilterChange={setActiveStatus} 
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SpendOverTimeChart data={spendHistory} />
        <BestAdPreview ads={bestAds} />
      </div>
    </div>
  );
}
