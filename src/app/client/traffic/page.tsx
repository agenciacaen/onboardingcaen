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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';

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
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

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

        // Fetch last sync from meta accounts
        const { data: accounts } = await supabase
          .from('meta_ad_accounts')
          .select('last_sync_at')
          .eq('client_id', clientId)
          .eq('status', 'active');
        
        if (accounts && accounts.length > 0) {
          const latest = accounts.reduce((acc, curr) => {
             if (!acc) return curr.last_sync_at;
             if (!curr.last_sync_at) return acc;
             return new Date(curr.last_sync_at) > new Date(acc) ? curr.last_sync_at : acc;
          }, null as string | null);
          if (latest) setLastSyncDate(latest);
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
        <div>
          <PageHeader title="Tráfego Pago" description="Visão geral do desempenho de anúncios e campanhas." />
          {lastSyncDate && (
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.525 9.875C17.525 9.875 16.7 10 16.7 10C16.825 8.125 15.65 6.75 14 6.75C12.35 6.75 11.175 8.125 11.3 10C11.3 10 10.475 9.875 10.475 9.875C9.725 9.875 9.4 10.45 9.4 10.875L13.725 16.5C13.825 16.625 14.175 16.625 14.275 16.5L18.6 10.875C18.6 10.45 18.275 9.875 17.525 9.875Z"/>
                  <path d="M9.4 13.125C9.4 13.125 10.225 13 10.225 13C10.1 14.875 11.275 16.25 12.925 16.25C14.575 16.25 15.75 14.875 15.625 13C15.625 13 16.45 13.125 16.45 13.125C17.2 13.125 17.525 12.55 17.525 12.125L13.2 6.5C13.1 6.375 12.75 6.375 12.65 6.5L8.325 12.125C8.325 12.55 8.65 13.125 9.4 13.125Z"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 20.5C7.306 20.5 3.5 16.694 3.5 12C3.5 7.306 7.306 3.5 12 3.5C16.694 3.5 20.5 7.306 20.5 12C20.5 16.694 16.694 20.5 12 20.5Z"/>
                </svg>
                Meta Ads
              </span>
              <span className="ml-2">
                Última sincronização: {format(new Date(lastSyncDate), "dd/MM/yyyy 'às' HH:mm")}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector date={dateRange} setDate={setDateRange} />
          <Button variant="outline" size="icon" title="Gerar Relatório">
            <FileBarChart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4 bg-slate-100/50">
          <TabsTrigger value="kanban">Quadro Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista de Tarefas</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-0 pt-2">
          <ClientModuleTasksView module="traffic" view="kanban" />
        </TabsContent>

        <TabsContent value="list" className="mt-0 pt-2">
          <ClientModuleTasksView module="traffic" view="list" />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0 space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
