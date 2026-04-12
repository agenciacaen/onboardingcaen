import { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { TrafficKpiCards } from '@/modules/traffic/components/TrafficKpiCards';
import { TrafficFunnel, type FunnelData } from '@/modules/traffic/components/TrafficFunnel';
import { ConversionMetricCards, type ConversionMetric } from '@/modules/traffic/components/ConversionMetricCards';
import { RevenueChart, type RevenueDataPoint } from '@/modules/traffic/components/RevenueChart';
import { BestAdsDonut, type TopAdData } from '@/modules/traffic/components/BestAdsDonut';
import { SecondaryMetrics, type SecondaryMetricsData } from '@/modules/traffic/components/SecondaryMetrics';
import { CampaignTable, type CampaignData } from '@/modules/traffic/components/CampaignTable';
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

  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  // --- State for dashboard metrics ---
  const [kpis, setKpis] = useState({
    spend: { value: 0, change: 0 },
    purchases: { value: 0, change: 0 },
    revenue: { value: 0, change: 0 },
    roas: { value: 0, change: 0 },
    landing_page_views: { value: 0, change: 0 },
  });

  const [funnelData, setFunnelData] = useState<FunnelData>({
    impressions: 0,
    clicks: 0,
    landing_page_views: 0,
    conversions: 0,
    conversionLabel: 'Conversões',
  });

  const [conversionCards, setConversionCards] = useState<ConversionMetric[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<RevenueDataPoint[]>([]);
  const [topAds, setTopAds] = useState<TopAdData[]>([]);
  const [secondaryMetrics, setSecondaryMetrics] = useState<SecondaryMetricsData>({ frequency: 0, cpc: 0, cpm: 0 });
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [conversionLabel, setConversionLabel] = useState('Conversões');

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !dateRange?.from || !dateRange?.to) return;

      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      try {
        setIsLoading(true);

        // 1. Fetch traffic overview
        const overview = await trafficService.getOverview(clientId, startDate, endDate);

        // 2. Fetch last sync
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

        // 3. Fetch daily metrics with raw_actions
        const { data: metrics, error: metricsError } = await supabase
          .from('traffic_metrics')
          .select('date, spend, impressions, clicks, conversions, roas, cpc, cpm, reach, raw_actions')
          .eq('client_id', clientId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        // Aggregate all metrics
        let totalSpend = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalReach = 0;
        let totalConversions = 0;
        let totalCpc = 0;
        let totalCpm = 0;
        let totalRoas = 0;
        let rCount = 0;

        // Action aggregations
        const actionTotals: Record<string, number> = {};
        const dailyConversions: RevenueDataPoint[] = [];

        if (!metricsError && metrics) {
          metrics.forEach(m => {
            totalSpend += m.spend || 0;
            totalImpressions += m.impressions || 0;
            totalClicks += m.clicks || 0;
            totalReach += m.reach || 0;
            totalConversions += m.conversions || 0;
            totalCpc += m.cpc || 0;
            totalCpm += m.cpm || 0;
            if (m.roas) {
              totalRoas += m.roas;
              rCount++;
            }

            // Aggregate actions
            let dayConversions = m.conversions || 0;
            if (m.raw_actions && Array.isArray(m.raw_actions)) {
              m.raw_actions.forEach((act: { action_type: string; value: string }) => {
                const val = Number(act.value || 0);
                actionTotals[act.action_type] = (actionTotals[act.action_type] || 0) + val;
              });
            }

            dailyConversions.push({
              date: m.date,
              spend: m.spend || 0,
              conversions: dayConversions,
            });
          });
        }

        const avgRoas = rCount > 0 ? totalRoas / rCount : 0;
        const avgCpc = metrics && metrics.length > 0 ? totalCpc / metrics.length : 0;
        const avgCpm = metrics && metrics.length > 0 ? totalCpm / metrics.length : 0;
        const frequency = totalReach > 0 ? totalImpressions / totalReach : 0;

        // Determine primary conversion type
        const purchaseCount = actionTotals['purchase'] || 0;
        const leadCount = actionTotals['lead'] || 0;
        const conversasCount = actionTotals['onsite_conversion.total_messaging_connection'] || 0;
        const landingPageViews = actionTotals['landing_page_view'] || 0;

        // Determine best conversion label
        let primaryConvLabel = 'Conversões';
        let primaryConvCount = totalConversions;
        if (conversasCount > 0) {
          primaryConvLabel = 'Conversas Iniciadas';
          primaryConvCount = conversasCount;
        } else if (leadCount > 0) {
          primaryConvLabel = 'Leads';
          primaryConvCount = leadCount;
        } else if (purchaseCount > 0) {
          primaryConvLabel = 'Compras';
          primaryConvCount = purchaseCount;
        }
        setConversionLabel(primaryConvLabel);

        // Revenue (from purchase_roas * spend approximation, or use purchase value if available)
        const revenueEstimate = totalSpend * avgRoas;

        // KPIs
        setKpis({
          spend: { value: totalSpend, change: 0 },
          purchases: { value: primaryConvCount, change: 0 },
          revenue: { value: revenueEstimate, change: 0 },
          roas: { value: avgRoas, change: 0 },
          landing_page_views: { value: landingPageViews || totalClicks, change: 0 },
        });

        // Funnel
        setFunnelData({
          impressions: totalImpressions,
          clicks: totalClicks,
          landing_page_views: landingPageViews || Math.round(totalClicks * 0.8),
          conversions: primaryConvCount,
          conversionLabel: primaryConvLabel,
        });

        // Conversion metric cards
        const cards: ConversionMetric[] = [];
        cards.push({
          id: 'primary_conv',
          label: primaryConvLabel,
          value: primaryConvCount,
          formattedValue: new Intl.NumberFormat('pt-BR').format(primaryConvCount),
          icon: conversasCount > 0 ? 'message' : purchaseCount > 0 ? 'cart' : 'target',
          highlight: true,
        });
        if (primaryConvCount > 0) {
          cards.push({
            id: 'cost_per_conv',
            label: `Custo por ${primaryConvLabel.replace('Iniciadas', '').trim()}`,
            value: totalSpend / primaryConvCount,
            formattedValue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpend / primaryConvCount),
            icon: 'cost',
          });
        }
        setConversionCards(cards);

        // Revenue chart data
        setRevenueChartData(dailyConversions);

        // Secondary metrics
        setSecondaryMetrics({
          frequency,
          cpc: avgCpc,
          cpm: avgCpm,
        });

        // 4. Fetch campaigns for table
        const campaignsRaw = await trafficService.getCampaigns(clientId, startDate, endDate);
        if (campaignsRaw) {
          const processedCampaigns: CampaignData[] = campaignsRaw.map(c => {
            const cMetrics = c.traffic_metrics || [];
            const campSpend = cMetrics.reduce((acc: number, m: any) => acc + (m.spend || 0), 0);
            const campImpressions = cMetrics.reduce((acc: number, m: any) => acc + (m.impressions || 0), 0);
            const campClicks = cMetrics.reduce((acc: number, m: any) => acc + (m.clicks || 0), 0);
            const campRoas = cMetrics.length > 0
              ? cMetrics.reduce((acc: number, m: any) => acc + (m.roas || 0), 0) / cMetrics.length
              : 0;

            const customMetrics: Record<string, number> = {};
            cMetrics.forEach((m: any) => {
              if (m.raw_actions && Array.isArray(m.raw_actions)) {
                m.raw_actions.forEach((action: any) => {
                  const type = action.action_type;
                  const value = Number(action.value || 0);
                  customMetrics[type] = (customMetrics[type] || 0) + value;
                });
              }
            });

            return {
              id: c.id,
              name: c.name,
              platform: c.platform as any,
              status: c.status as any,
              budget_daily: c.budget_daily || 0,
              spend: campSpend,
              impressions: campImpressions,
              clicks: campClicks,
              roas: campRoas,
              custom_metrics: customMetrics,
            };
          });
          setCampaigns(processedCampaigns);

          // Top ads for donut (use top campaigns by conversions)
          const topCampaigns = [...processedCampaigns]
            .sort((a, b) => {
              const aConv = a.custom_metrics?.[Object.keys(actionTotals).find(k =>
                k === 'onsite_conversion.total_messaging_connection' || k === 'lead' || k === 'purchase'
              ) || ''] || 0;
              const bConv = b.custom_metrics?.[Object.keys(actionTotals).find(k =>
                k === 'onsite_conversion.total_messaging_connection' || k === 'lead' || k === 'purchase'
              ) || ''] || 0;
              return bConv - aConv;
            })
            .slice(0, 5);

          setTopAds(topCampaigns.map(c => {
            // Find the main conversion metric for this campaign
            let conv = 0;
            if (conversasCount > 0) conv = c.custom_metrics?.['onsite_conversion.total_messaging_connection'] || 0;
            else if (leadCount > 0) conv = c.custom_metrics?.['lead'] || 0;
            else if (purchaseCount > 0) conv = c.custom_metrics?.['purchase'] || 0;
            else conv = Math.round(c.clicks * 0.1); // fallback

            return {
              name: c.name,
              spend: c.spend,
              conversions: conv,
            };
          }));
        }

        // 5. Fetch best ads from RPC (for reference, keep the original)
        // This data feeds the donut chart if available
        const adsData = await trafficService.getBestAds(clientId, startDate, endDate, 'roas', 5);
        if (adsData && adsData.length > 0) {
          setTopAds(adsData.map((ad: Record<string, unknown>) => ({
            name: (ad.ad_name as string) || 'Anúncio',
            spend: ad.spend as number,
            conversions: Math.round((ad.roas as number) * (ad.spend as number) / 100) || 1,
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
        <LoadingSkeleton type="card" rows={1} cols={5} />
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
              <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium border border-blue-100 dark:border-blue-900">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
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

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 bg-slate-100/50 dark:bg-slate-800/50">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kanban">Quadro Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista de Tarefas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 space-y-6">
          {/* ROW 1: Top KPI Cards */}
          <TrafficKpiCards data={kpis} />

          {/* ROW 2: Funnel + Conversion Cards + Revenue Chart + Best Ads Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Funnel */}
            <div className="lg:col-span-3">
              <TrafficFunnel data={funnelData} />
            </div>

            {/* Center-Left: Conversion metric cards */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <ConversionMetricCards metrics={conversionCards} />
            </div>

            {/* Center-Right: Revenue chart */}
            <div className="lg:col-span-4">
              <RevenueChart data={revenueChartData} conversionLabel={conversionLabel} />
            </div>

            {/* Right: Best Ads Donut */}
            <div className="lg:col-span-3">
              <BestAdsDonut ads={topAds} metricLabel={`Por ${conversionLabel}`} />
            </div>
          </div>

          {/* ROW 3: Campaign Table */}
          <CampaignTable data={campaigns} />

          {/* ROW 4: Secondary Metrics */}
          <SecondaryMetrics data={secondaryMetrics} />
        </TabsContent>

        <TabsContent value="kanban" className="mt-0 pt-2">
          <ClientModuleTasksView module="traffic" view="kanban" />
        </TabsContent>

        <TabsContent value="list" className="mt-0 pt-2">
          <ClientModuleTasksView module="traffic" view="list" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
