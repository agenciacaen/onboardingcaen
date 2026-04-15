import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { TrafficKpiCards } from '@/modules/traffic/components/TrafficKpiCards';
import { TrafficFunnel, type FunnelData } from '@/modules/traffic/components/TrafficFunnel';
import { ConversionMetricCards, type ConversionMetric } from '@/modules/traffic/components/ConversionMetricCards';
import { RevenueChart } from '@/modules/traffic/components/RevenueChart';
import { BestAdsDonut } from '@/modules/traffic/components/BestAdsDonut';
import { CampaignTable, type CampaignData } from '@/modules/traffic/components/CampaignTable';
import type { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Download, HelpCircle, RefreshCw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { TrafficSettings, METRIC_CATEGORIES } from '@/modules/traffic/components/TrafficSettings';
import { trafficService } from '@/modules/traffic/services/traffic.service';
import { supabase } from '@/services/supabase';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClientModuleTasksView } from '@/components/modules/ClientModuleTasksView';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tipo de nível de visualização
type ViewLevel = 'campaign' | 'adset' | 'ad';

// Mapeamento de action_type do Meta para chaves simplificadas usadas nos gráficos/KPIs
const ACTION_KEY_MAP: Record<string, string> = {
  'onsite_conversion.messaging_conversation_started_7d': 'conversations',
  'messaging_conversation_started_7d': 'conversations',
  'onsite_messaging_conversation_started': 'conversations',
  'onsite_conversion.total_messaging_connection': 'messaging_connection',
  'purchase': 'purchases',
  'purchase_value': 'revenue',
  'lead': 'leads',
  'offsite_conversion.fb_pixel_lead': 'pixel_leads',
  'landing_page_view': 'landing_page_views',
  'link_click': 'link_clicks',
  'initiate_checkout': 'initiate_checkout',
  'add_to_cart': 'add_to_cart',
  'view_content': 'view_content',
  'add_payment_info': 'add_payment_info',
  'post_engagement': 'post_engagement',
  'post_reaction': 'post_reaction',
  'like': 'post_reaction',
  'comment': 'comment',
  'shared': 'shared',
  'page_engagement': 'page_engagement',
  'onsite_conversion.post_save': 'post_save',
  'video_view': 'video_view',
};

export function ClientTrafficPage() {
  const { clientId } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const [isLoading, setIsLoading] = useState(true);

  // --- Hierarchy filter state ---
  const [viewLevel, setViewLevel] = useState<ViewLevel>('campaign');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>('all');
  const [selectedAdId, setSelectedAdId] = useState<string>('all');

  // --- State for dashboard metrics ---
  const [kpis, setKpis] = useState<any>({
    spend: { value: 0, change: 0, history: [] },
    impressions: { value: 0, change: 0, history: [] },
    clicks: { value: 0, change: 0, history: [] },
    reach: { value: 0, change: 0, history: [] },
    ctr: { value: 0, change: 0, history: [] },
    cpc: { value: 0, change: 0, history: [] },
    cpm: { value: 0, change: 0, history: [] },
    roas: { value: 0, change: 0, history: [] },
    frequency: { value: 0, change: 0, history: [] },
    purchases: { value: 0, change: 0, history: [] },
    leads: { value: 0, change: 0, history: [] },
    conversations: { value: 0, change: 0, history: [] },
    landing_page_views: { value: 0, change: 0, history: [] },
    revenue: { value: 0, change: 0, history: [] },
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setLastSyncDate] = useState<string | null>(null);
  const [settingsVersion, setSettingsVersion] = useState(0);

  const [conversionCards, setConversionCards] = useState<ConversionMetric[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [, setCampaigns] = useState<CampaignData[]>([]);
  const [, setAdSets] = useState<any[]>([]);
  const [, setAds] = useState<any[]>([]);
  const [topAds, setTopAds] = useState<any[]>([]);
  
  // Raw data for hierarchy filtering
  const [allCampaigns, setAllCampaigns] = useState<CampaignData[]>([]);
  const [allAdSets, setAllAdSets] = useState<any[]>([]);
  const [allAds, setAllAds] = useState<any[]>([]);
  
  const ALL_METRICS = METRIC_CATEGORIES.flatMap(c => c.metrics);

  const [funnelData, setFunnelData] = useState<FunnelData>({
    steps: [],
    secondaryMetrics: { frequency: 0, cpc: 0, cpm: 0 }
  });

  const [chartConfig, setChartConfig] = useState<any>({ left_metric: 'spend', right_metric: 'revenue' });
  const [adsConfig, setAdsConfig] = useState<any>({ sort_by: 'conversions', limit: 5 });
  const [visibilityConfig, setVisibilityConfig] = useState<any>({
    show_funnel: true,
    show_chart: true,
    show_ranking: true,
    show_table: true,
    show_summary_cards: true
  });
  const [conversionLabel, setConversionLabel] = useState('Conversões');

  // Filtered adsets/ads based on selected campaign
  const filteredAdSets = useMemo(() => {
    if (selectedCampaignId === 'all') return allAdSets;
    return allAdSets.filter(a => a.campaign_id === selectedCampaignId);
  }, [allAdSets, selectedCampaignId]);

  const filteredAds = useMemo(() => {
    if (selectedCampaignId === 'all' && selectedAdSetId === 'all') return allAds;
    let result = allAds;
    if (selectedCampaignId !== 'all') {
      result = result.filter(a => a.campaign_id === selectedCampaignId);
    }
    if (selectedAdSetId !== 'all') {
      result = result.filter(a => a.adset_id === selectedAdSetId);
    }
    return result;
  }, [allAds, selectedCampaignId, selectedAdSetId]);

  // Reset child selectors when parent changes
  useEffect(() => {
    setSelectedAdSetId('all');
    setSelectedAdId('all');
  }, [selectedCampaignId]);

  useEffect(() => {
    setSelectedAdId('all');
  }, [selectedAdSetId]);

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !dateRange?.from || !dateRange?.to) return;

      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      try {
        setIsLoading(true);

        // 1. Fetch traffic settings & overview
        const settings = await trafficService.getSettings(clientId);
        if (settings && settings.selected_metrics) {
          setSelectedMetrics(settings.selected_metrics);
        }

        await trafficService.getOverview(clientId, startDate, endDate);

        // 2. Fetch last sync
        const { data: accounts } = await supabase
          .from('meta_ad_accounts')
          .select('last_sync_at')
          .eq('client_id', clientId)
          .eq('status', 'active');

        // 2. Fetch settings
        const config = await trafficService.getSettings(clientId);
        const funnelObjective = config?.funnel_main_metric || 'conversions';
        const userFunnelConfig = config?.funnel_config;

        const activeMetrics = config?.selected_metrics || ['spend', 'purchases', 'revenue', 'roas', 'landing_page_views'];
        setSelectedMetrics(activeMetrics);
        if (config?.chart_config) setChartConfig(config.chart_config);
        if (config?.ads_config) setAdsConfig(config.ads_config);
        if (config?.visibility_config) setVisibilityConfig(config.visibility_config);

        if (accounts && accounts.length > 0) {
          const latest = accounts.reduce((acc, curr) => {
            if (!acc) return curr.last_sync_at;
            if (!curr.last_sync_at) return acc;
            return new Date(curr.last_sync_at) > new Date(acc) ? curr.last_sync_at : acc;
          }, null as string | null);
          if (latest) {
             setLastSyncDate(latest);
          }
        }

        // 3. Fetch daily metrics FILTERED BY LEVEL
        // *** FIX: Only fetch metrics at the active view level to prevent triplication ***
        let metricsQuery = supabase
          .from('traffic_metrics')
          .select('date, spend, impressions, clicks, conversions, roas, cpc, cpm, reach, raw_actions, campaign_id, adset_id, ad_id, level')
          .eq('client_id', clientId)
          .eq('level', viewLevel)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        // Apply hierarchy filters
        if (selectedCampaignId !== 'all') {
          metricsQuery = metricsQuery.eq('campaign_id', selectedCampaignId);
        }
        if (selectedAdSetId !== 'all' && (viewLevel === 'adset' || viewLevel === 'ad')) {
          metricsQuery = metricsQuery.eq('adset_id', selectedAdSetId);
        }
        if (selectedAdId !== 'all' && viewLevel === 'ad') {
          metricsQuery = metricsQuery.eq('ad_id', selectedAdId);
        }

        const { data: metrics, error: metricsError } = await metricsQuery;

        // Aggregate all metrics
        let totalSpend = 0;
        let totalImpressions = 0;
        let totalClicks = 0; // "Clicks (All)" from Meta
        let totalReach = 0;
        let totalConversions = 0;
        let totalRoas = 0;
        let rCount = 0;

        // History trackers for sparklines
        const sparklinesHistory: Record<string, any[]> = {};
        
        // Action aggregation tracker
        const actionTotals: Record<string, number> = {};
        const dailyTimelineData: any[] = [];

        if (!metricsError && metrics) {
          metrics.forEach(m => {
            totalSpend += m.spend || 0;
            totalImpressions += m.impressions || 0;
            totalClicks += m.clicks || 0;
            totalReach += m.reach || 0;
            totalConversions += m.conversions || 0;
            
            if (m.roas) {
              totalRoas += m.roas;
              rCount++;
            }

            // Action aggregations per day
            if (m.raw_actions && Array.isArray(m.raw_actions)) {
              m.raw_actions.forEach((act: { action_type: string; value: string }) => {
                const val = Number(act.value || 0);
                actionTotals[act.action_type] = (actionTotals[act.action_type] || 0) + val;
              });
            }

            // Timeline data for chart
            // *** FIX: Map action types to simplified keys so chart can find them ***
            const dailyItem: any = {
              date: m.date,
              spend: m.spend || 0,
              impressions: m.impressions || 0,
              clicks: m.clicks || 0,
              reach: m.reach || 0,
              conversions: m.conversions || 0,
              roas: m.roas || 0,
              cpc: m.clicks > 0 ? (m.spend || 0) / m.clicks : 0,
              cpm: m.impressions > 0 ? ((m.spend || 0) / m.impressions) * 1000 : 0,
              frequency: m.reach > 0 ? (m.impressions || 0) / m.reach : 0,
            };

            // Map raw actions to simplified keys for chart consumption
            if (m.raw_actions && Array.isArray(m.raw_actions)) {
               m.raw_actions.forEach((act: any) => {
                 const simplifiedKey = ACTION_KEY_MAP[act.action_type] || act.action_type;
                 dailyItem[simplifiedKey] = (dailyItem[simplifiedKey] || 0) + Number(act.value || 0);
                 // Also keep original key for backward compat
                 dailyItem[act.action_type] = (dailyItem[act.action_type] || 0) + Number(act.value || 0);
               });
            }
            
            // Revenue shortcut
            if (dailyItem['revenue']) {
              // already set from purchase_value mapping
            } else {
              dailyItem['revenue'] = (m.spend || 0) * (m.roas || 0);
            }

            // Link click based metrics
            const dayLinkClicks = dailyItem['link_clicks'] || 0;
            dailyItem['cpc_link'] = dayLinkClicks > 0 ? (m.spend || 0) / dayLinkClicks : 0;
            dailyItem['ctr_link'] = (m.impressions || 0) > 0 ? (dayLinkClicks / (m.impressions || 1)) * 100 : 0;
            dailyItem['ctr'] = (m.impressions || 0) > 0 ? ((m.clicks || 0) / (m.impressions || 1)) * 100 : 0;

            dailyTimelineData.push(dailyItem);

            // Generic history tracker for sparklines
            const currentMetrics = ['spend', 'impressions', 'roas', 'purchases', 'revenue', 'clicks', 'reach', 'conversations', 'leads', 'landing_page_views'];
            currentMetrics.forEach(metricId => {
               if (!sparklinesHistory[metricId]) sparklinesHistory[metricId] = [];
               let val = 0;
               if (metricId === 'spend') val = m.spend || 0;
               if (metricId === 'impressions') val = m.impressions || 0;
               if (metricId === 'roas') val = m.roas || 0;
               if (metricId === 'clicks') val = m.clicks || 0;
               if (metricId === 'reach') val = m.reach || 0;

               // Events from raw_actions using simplified keys
               if (m.raw_actions && Array.isArray(m.raw_actions)) {
                  const eventMap: Record<string, string[]> = {
                    purchases: ['purchase'],
                    conversations: ['onsite_conversion.messaging_conversation_started_7d', 'messaging_conversation_started_7d', 'onsite_messaging_conversation_started'],
                    leads: ['lead', 'offsite_conversion.fb_pixel_lead'],
                    landing_page_views: ['landing_page_view'],
                    revenue: ['purchase_value']
                  };
                  
                  if (eventMap[metricId]) {
                    const found = m.raw_actions.find((a: any) => eventMap[metricId].includes(a.action_type));
                    val = found ? Number(found.value || 0) : 0;
                  }
               }
               sparklinesHistory[metricId].push({ date: m.date, value: val });
            });
          });
        }

        const avgRoas = rCount > 0 ? totalRoas / rCount : 0;
        const totalLPV = actionTotals['landing_page_view'] || 0;
        const totalLinkClicks = actionTotals['link_click'] || 0;
        
        // CPC/CTR Calculations
        const cpcAll = totalClicks > 0 ? totalSpend / totalClicks : 0;
        const cpcLink = totalLinkClicks > 0 ? totalSpend / totalLinkClicks : 0;
        const ctrAll = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0;
        const ctrLink = totalImpressions > 0 ? (totalLinkClicks / totalImpressions) : 0;
        const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
        const frequency = totalReach > 0 ? totalImpressions / totalReach : 1.15;

        // Unified Events Extraction
        const purchases = actionTotals['purchase'] || 0;
        const leads = (actionTotals['lead'] || 0) + (actionTotals['offsite_conversion.fb_pixel_lead'] || 0);
        const conversations = actionTotals['onsite_conversion.messaging_conversation_started_7d'] || actionTotals['messaging_conversation_started_7d'] || actionTotals['onsite_messaging_conversation_started'] || 0;
        const initCheckouts = actionTotals['initiate_checkout'] || 0;
        const addToCart = actionTotals['add_to_cart'] || 0;
        const contentViews = actionTotals['view_content'] || 0;
        
        // Engagement
        const postEngagement = actionTotals['post_engagement'] || 0;
        const postReactions = (actionTotals['post_reaction'] || 0) + (actionTotals['like'] || 0);
        const comments = actionTotals['comment'] || 0;
        const shares = actionTotals['shared'] || 0;
        const pageEngagement = actionTotals['page_engagement'] || 0;

        // Video
        const v25 = actionTotals['video_p25_watched_actions'] || 0;
        const v50 = actionTotals['video_p50_watched_actions'] || 0;
        const v75 = actionTotals['video_p75_watched_actions'] || 0;
        const v95 = actionTotals['video_p95_watched_actions'] || 0;
        const v100 = actionTotals['video_p100_watched_actions'] || 0;

        // Determine Funnel Metric
        let finalFunnelCount = conversations || totalConversions;
        let finalFunnelLabel = 'Conversas';

        if (funnelObjective === 'purchases') {
          finalFunnelCount = purchases;
          finalFunnelLabel = 'Compras';
        } else if (funnelObjective === 'leads') {
          finalFunnelCount = leads;
          finalFunnelLabel = 'Leads';
        } else if (funnelObjective === 'conversations') {
          finalFunnelCount = conversations;
          finalFunnelLabel = 'Conversas';
        } else if (funnelObjective === 'landing_page_views') {
          finalFunnelCount = totalLPV;
          finalFunnelLabel = 'Visitas';
        } else if (funnelObjective === 'initiate_checkout') {
          finalFunnelCount = initCheckouts;
          finalFunnelLabel = 'Checkouts';
        } else if (funnelObjective === 'conversions') {
          finalFunnelCount = conversations || totalConversions;
          finalFunnelLabel = 'Conversas';
        } else if (funnelObjective === 'link_clicks') {
          finalFunnelCount = totalLinkClicks;
          finalFunnelLabel = 'Cliques Link';
        }

        setConversionLabel(finalFunnelLabel);

        // Revenue approximation
        const revenueEstimate = actionTotals['purchase_value'] || (totalSpend * avgRoas);

        // KPIs
        setKpis({
          spend: { value: totalSpend, change: 0, history: sparklinesHistory['spend'] },
          impressions: { value: totalImpressions, change: 0, history: sparklinesHistory['impressions'] },
          reach: { value: totalReach, change: 0, history: sparklinesHistory['reach'] },
          frequency: { value: frequency, change: 0 },
          cpm: { value: avgCpm, change: 0 },
          
          clicks: { value: totalClicks, change: 0, history: sparklinesHistory['clicks'] },
          link_clicks: { value: totalLinkClicks, change: 0 },
          cpc: { value: cpcAll, change: 0 },
          cpc_link: { value: cpcLink, change: 0 },
          ctr: { value: ctrAll * 100, change: 0 },
          ctr_link: { value: ctrLink * 100, change: 0 },

          purchases: { value: purchases, change: 0, history: sparklinesHistory['purchases'] },
          revenue: { value: revenueEstimate, change: 0, history: sparklinesHistory['revenue'] },
          roas: { value: avgRoas, change: 0, history: sparklinesHistory['roas'] },
          initiate_checkout: { value: initCheckouts, change: 0 },
          add_to_cart: { value: addToCart, change: 0 },
          view_content: { value: contentViews, change: 0 },

          conversations: { value: conversations, change: 0, history: sparklinesHistory['conversations'] },
          leads: { value: leads, change: 0, history: sparklinesHistory['leads'] },
          landing_page_views: { value: totalLPV, change: 0, history: sparklinesHistory['landing_page_views'] },

          post_engagement: { value: postEngagement, change: 0 },
          post_reaction: { value: postReactions, change: 0 },
          comment: { value: comments, change: 0 },
          shared: { value: shares, change: 0 },
          page_engagement: { value: pageEngagement, change: 0 },

          video_p25: { value: v25, change: 0 },
          video_p50: { value: v50, change: 0 },
          video_p75: { value: v75, change: 0 },
          video_p95: { value: v95, change: 0 },
          video_p100: { value: v100, change: 0 },
        });

        // Helper to get metric value by ID
        const getMetricValue = (metricId: string) => {
          // Standard Native Metrics
          if (metricId === 'spend') return totalSpend;
          if (metricId === 'impressions') return totalImpressions;
          if (metricId === 'clicks') return totalClicks;
          if (metricId === 'reach') return totalReach;
          if (metricId === 'cpc') return cpcAll;
          if (metricId === 'cpc_link') return cpcLink;
          if (metricId === 'ctr') return ctrAll * 100;
          if (metricId === 'ctr_link') return ctrLink * 100;
          if (metricId === 'cpm') return avgCpm;
          if (metricId === 'frequency') return frequency;
          if (metricId === 'roas') return avgRoas;
          
          // Legacy/Common Aliases
          if (metricId === 'landing_page_views') return totalLPV;
          if (metricId === 'purchases') return purchases;
          if (metricId === 'conversations') return conversations;
          if (metricId === 'leads') return leads;
          if (metricId === 'initiate_checkout') return initCheckouts;
          if (metricId === 'add_to_cart') return addToCart;
          if (metricId === 'view_content') return contentViews;
          
          // Dynamic match from actionTotals (Meta action_type)
          if (actionTotals[metricId] !== undefined) return actionTotals[metricId];

          // Special case for revenue (purchase_value)
          if (metricId === 'revenue') return actionTotals['purchase_value'] || (totalSpend * avgRoas);

          return 0;
        };

        // Funnel
        const funnelSteps = userFunnelConfig?.steps?.map((step: any) => ({
          label: step.label,
          value: getMetricValue(step.metric)
        })) || [
          { label: 'Impressões', value: totalImpressions },
          { label: 'Cliques', value: totalClicks },
          { label: 'Visitas', value: totalLPV || Math.round(totalClicks * 0.8) },
          { label: finalFunnelLabel, value: finalFunnelCount }
        ];

        setFunnelData({
          steps: funnelSteps,
          secondaryMetrics: {
            frequency: frequency,
            cpc: cpcAll,
            cpm: avgCpm
          }
        });

        // Conversion metric cards
        const cards: ConversionMetric[] = [];
        cards.push({
          id: 'primary_conv',
          label: finalFunnelLabel,
          value: finalFunnelCount,
          formattedValue: new Intl.NumberFormat('pt-BR').format(finalFunnelCount),
          icon: funnelObjective === 'conversations' ? 'message' : funnelObjective === 'purchases' ? 'cart' : 'target',
          highlight: true,
        });
        if (finalFunnelCount > 0) {
          cards.push({
            id: 'cost_per_conv',
            label: `Custo por ${finalFunnelLabel}`,
            value: totalSpend / finalFunnelCount,
            formattedValue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpend / finalFunnelCount),
            icon: 'cost',
            highlight: true,
          });
        }
        setConversionCards(cards);

        // Revenue chart data
        setRevenueChartData(dailyTimelineData);

        // 4. Fetch campaigns for table
        const campaignsRaw = await trafficService.getCampaigns(clientId, startDate, endDate);
        let processedCampaigns: CampaignData[] = [];
        if (campaignsRaw) {
          processedCampaigns = campaignsRaw.map(c => {
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
              custom_metrics: customMetrics
            };
          });
          setAllCampaigns(processedCampaigns);
          setCampaigns(processedCampaigns);
        }

        // 5. Fetch Ad Sets
        const adsetsRaw = await trafficService.getAdSets(clientId, startDate, endDate);
        let processedAdsets: any[] = [];
        if (adsetsRaw) {
           processedAdsets = adsetsRaw.map(a => {
             const aMetrics = a.traffic_metrics || [];
             const aSpend = aMetrics.reduce((acc: number, m: any) => acc + (m.spend || 0), 0);
             const aImpressions = aMetrics.reduce((acc: number, m: any) => acc + (m.impressions || 0), 0);
             const aClicks = aMetrics.reduce((acc: number, m: any) => acc + (m.clicks || 0), 0);
             const customMetrics: Record<string, number> = {};
             aMetrics.forEach((m: any) => {
               if (m.raw_actions && Array.isArray(m.raw_actions)) {
                 m.raw_actions.forEach((action: any) => {
                   const type = action.action_type;
                   const value = Number(action.value || 0);
                   customMetrics[type] = (customMetrics[type] || 0) + value;
                 });
               }
             });
             return {
                id: a.id,
                name: a.name,
                status: a.status,
                campaign_id: a.campaign_id,
                campaign_name: Array.isArray(a.traffic_campaigns) ? a.traffic_campaigns[0]?.name : (a.traffic_campaigns as any)?.name,
                spend: aSpend,
                impressions: aImpressions,
                clicks: aClicks,
                reach: aMetrics.reduce((acc: number, m: any) => acc + (m.reach || 0), 0),
                custom_metrics: customMetrics
             };
           });
           setAllAdSets(processedAdsets);
           setAdSets(processedAdsets);
        }

        // 6. Fetch Ads
        const adsRaw = await trafficService.getAds(clientId, startDate, endDate);
        let processedAds: any[] = [];
        if (adsRaw) {
           processedAds = adsRaw.map(a => {
             const aMetrics = a.traffic_metrics || [];
             const aSpend = aMetrics.reduce((acc: number, m: any) => acc + (m.spend || 0), 0);
             const aImpressions = aMetrics.reduce((acc: number, m: any) => acc + (m.impressions || 0), 0);
             const aClicks = aMetrics.reduce((acc: number, m: any) => acc + (m.clicks || 0), 0);
             const customMetrics: Record<string, number> = {};
             aMetrics.forEach((m: any) => {
               if (m.raw_actions && Array.isArray(m.raw_actions)) {
                 m.raw_actions.forEach((action: any) => {
                   const type = action.action_type;
                   const value = Number(action.value || 0);
                   customMetrics[type] = (customMetrics[type] || 0) + value;
                 });
               }
             });
             return {
                id: a.id,
                name: a.name,
                status: a.status,
                thumbnail_url: a.thumbnail_url,
                campaign_id: a.campaign_id,
                adset_id: a.adset_id,
                campaign_name: Array.isArray(a.traffic_campaigns) ? a.traffic_campaigns[0]?.name : (a.traffic_campaigns as any)?.name,
                adset_name: Array.isArray(a.traffic_ad_sets) ? a.traffic_ad_sets[0]?.name : (a.traffic_ad_sets as any)?.name,
                spend: aSpend,
                impressions: aImpressions,
                clicks: aClicks,
                custom_metrics: customMetrics
             };
           });
           setAllAds(processedAds);
           setAds(processedAds);
        }

          // Top ads for donut
          const sortBy = adsConfig.sort_by || 'conversions';
          const topCampaigns = [...processedCampaigns]
            .sort((a, b) => {
              let aVal = 0;
              let bVal = 0;

              if (sortBy === 'spend') {
                aVal = a.spend;
                bVal = b.spend;
              } else if (sortBy === 'roas') {
                aVal = a.roas;
                bVal = b.roas;
              } else if (sortBy === 'cpc') {
                return (a.clicks > 0 ? a.spend / a.clicks : 999) - (b.clicks > 0 ? b.spend / b.clicks : 999);
              } else {
                // Default: conversions
                const mainKey = Object.keys(actionTotals).find(k => 
                  k === 'onsite_conversion.messaging_conversation_started_7d' || k === 'lead' || k === 'purchase'
                ) || '';
                aVal = a.custom_metrics?.[mainKey] || 0;
                bVal = b.custom_metrics?.[mainKey] || 0;
              }
              
              return bVal - aVal;
            })
            .slice(0, adsConfig.limit || 5);

          setTopAds(topCampaigns.map(c => {
            const mainKey = Object.keys(actionTotals).find(k => 
              k === 'onsite_conversion.messaging_conversation_started_7d' || k === 'lead' || k === 'purchase'
            ) || '';
            
            return {
              name: c.name,
              spend: c.spend,
              conversions: c.custom_metrics?.[mainKey] || 0,
              roas: c.roas,
              cpc: c.clicks > 0 ? c.spend / c.clicks : 0
            };
          }));

      } catch (error) {
        console.error('Erro ao carregar dados de tráfego:', error);
        toast.error('Não foi possível carregar os dados de tráfego.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [clientId, dateRange, settingsVersion, viewLevel, selectedCampaignId, selectedAdSetId, selectedAdId]);

  const handleSync = async () => {
    if (!clientId) return;
    try {
      setIsSyncing(true);
      // Sincronização padrão (7 dias) incluindo hoje para rapidez e precisão
      const res = await trafficService.syncData(clientId, 7);
      if (res.success) {
        toast.success(`Sincronização concluída! Dados atualizados.`);
        setSettingsVersion(v => v + 1); // Refresh data
      } else {
        toast.error('Erro na sincronização: ' + res.error);
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Falha ao conectar com a API do Meta.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle campaign selection from dropdown - also updates viewLevel
  const handleCampaignSelect = (value: string) => {
    setSelectedCampaignId(value);
  };

  // Handle adset selection from dropdown
  const handleAdSetSelect = (value: string) => {
    setSelectedAdSetId(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tráfego Pago" description="Visão geral do desempenho de anúncios e campanhas." />
        <LoadingSkeleton type="card" rows={1} cols={5} />
        <LoadingSkeleton type="card" rows={1} cols={3} />
      </div>
    );
  }

  // View level label for UI
  const viewLevelLabel = viewLevel === 'campaign' ? 'Campanhas' : viewLevel === 'adset' ? 'Conjuntos' : 'Anúncios';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen bg-background p-6 pb-12 overflow-x-hidden">
      {/* HEADER SECTION (DashCortex Style) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="p-2 transition-transform hover:scale-105 duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="hsl(var(--primary))" fillOpacity="0.2"/>
              <circle cx="12" cy="12" r="4" fill="hsl(var(--primary))"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Overview <span className="flex items-center gap-1.5 text-primary"><svg className="inline h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM17.2 13.5C16.8 15.5 15.2 17.1 13.2 17.5C11.2 17.9 9.1 17.1 7.8 15.6C6.5 14.1 6.1 12 6.9 10.1C7.7 8.2 9.6 7 11.6 7C12.3 7 13.1 7.1 13.8 7.4C14.5 7.7 15.1 8.2 15.6 8.7C16.1 9.2 16.5 9.8 16.7 10.5C16.9 11.2 17 11.9 17 12.6C17 12.9 16.8 13.2 16.5 13.2C16.2 13.2 15.9 12.9 15.9 12.6C15.9 10.5 14.1 8.7 12 8.7C9.9 8.7 8.1 10.5 8.1 12.6C8.1 14.7 9.9 16.5 12 16.5C13.2 16.5 14.2 15.9 14.8 15C15.4 14.1 15.5 13.1 15.2 12.1C15.1 11.8 15.3 11.5 15.6 11.4C15.9 11.3 16.2 11.5 16.3 11.8C16.7 13.3 16.6 14.9 15.8 16.1C14.9 17.3 13.5 18 12 18C10.5 18 9.1 17.3 8.1 16.1C7.1 14.9 6.8 13.3 7.2 11.8C7.6 10.3 8.7 9.1 10.2 8.4C11.7 7.7 13.4 7.7 14.8 8.4C15.5 8.8 16.1 9.3 16.5 10C17 10.7 17.2 11.4 17.2 12.2V13.5Z"/></svg> Meta</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
              Relatório Meta Ads | Nível: <span className="text-primary">{viewLevelLabel}</span> | <span className="text-slate-300">Agência CAEN</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
             <Button 
                onClick={handleSync} 
                disabled={isSyncing}
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 text-primary", isSyncing && "animate-spin")}
                title="Sincronizar dados agora"
             >
                <RefreshCw className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Download className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <HelpCircle className="h-4 w-4" />
             </Button>
          </div>

          {/* VIEW LEVEL SELECTOR */}
          <Select value={viewLevel} onValueChange={(v) => setViewLevel(v as ViewLevel)}>
            <SelectTrigger className="w-[130px] h-9 bg-muted text-[11px] border-border text-foreground">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="campaign">Campanhas</SelectItem>
              <SelectItem value="adset">Conjuntos</SelectItem>
              <SelectItem value="ad">Anúncios</SelectItem>
            </SelectContent>
          </Select>

          {/* CAMPAIGN FILTER */}
          <Select value={selectedCampaignId} onValueChange={handleCampaignSelect}>
            <SelectTrigger className="w-[180px] h-9 bg-muted text-[11px] border-border text-foreground">
              <SelectValue placeholder="Campanhas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Campanhas</SelectItem>
              {allCampaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500')} />
                    <span className="truncate max-w-[140px]">{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ADSET FILTER (visible when viewing adsets or ads, or when a campaign is selected) */}
          {(viewLevel === 'adset' || viewLevel === 'ad') && (
            <Select value={selectedAdSetId} onValueChange={handleAdSetSelect}>
              <SelectTrigger className="w-[180px] h-9 bg-muted text-[11px] border-border text-foreground">
                <SelectValue placeholder="Conjuntos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Conjuntos</SelectItem>
                {filteredAdSets.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="truncate max-w-[140px]">{a.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* AD FILTER (visible only when viewing ads) */}
          {viewLevel === 'ad' && (
            <Select value={selectedAdId} onValueChange={(v) => setSelectedAdId(v)}>
              <SelectTrigger className="w-[180px] h-9 bg-muted text-[11px] border-border text-foreground">
                <SelectValue placeholder="Anúncios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Anúncios</SelectItem>
                {filteredAds.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="truncate max-w-[140px]">{a.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="bg-muted border border-border rounded-lg">
            <DateRangeSelector date={dateRange} setDate={setDateRange} />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">

        <TabsContent value="dashboard" className="mt-0 space-y-4">
          {/* ROW 1: Top KPI Cards with Sparklines */}
          <TrafficKpiCards data={kpis} selectedMetrics={selectedMetrics} />

          {/* ROW 2: Main Content Grid (Dynamic Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Col: Funnel */}
            {visibilityConfig.show_funnel && (
              <div className={cn(
                "col-span-1",
                visibilityConfig.show_chart || visibilityConfig.show_ranking || visibilityConfig.show_table ? "lg:col-span-3" : "lg:col-span-12"
              )}>
                <TrafficFunnel data={funnelData} />
              </div>
            )}

            {/* Right Col: Complex Visuals Table + Charts */}
            <div className={cn(
              "flex flex-col gap-4",
              visibilityConfig.show_funnel ? "lg:col-span-9" : "lg:col-span-12"
            )}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                 {/* Center: Main Area Chart */}
                {visibilityConfig.show_chart && (
                  <div className={cn(
                    "col-span-1",
                    visibilityConfig.show_ranking ? "lg:col-span-8" : "lg:col-span-12"
                  )}>
                    <RevenueChart 
                      data={revenueChartData} 
                      metric1={{ id: chartConfig.left_metric || 'spend', label: ALL_METRICS.find(m => m.id === chartConfig.left_metric)?.label || 'Investimento' }} 
                      metric2={{ id: chartConfig.right_metric || 'revenue', label: ALL_METRICS.find(m => m.id === chartConfig.right_metric)?.label || 'Receita' }} 
                    />
                  </div>
                )}
                
                {/* Right: Best Ads Donut */}
                {visibilityConfig.show_ranking && (
                  <div className={cn(
                    "col-span-1",
                    visibilityConfig.show_chart ? "lg:col-span-4" : "lg:col-span-12"
                  )}>
                    <BestAdsDonut 
                      ads={topAds} 
                      sortBy={adsConfig.sort_by}
                      metricLabel={`Por ${adsConfig.sort_by === 'spend' ? 'Investimento' : adsConfig.sort_by === 'roas' ? 'ROAS' : adsConfig.sort_by === 'cpc' ? 'CPC' : conversionLabel}`} 
                    />
                  </div>
                )}
              </div>

              {/* Bottom: Campaign Table (Enhanced) - passes filtered data */}
              {visibilityConfig.show_table && (
                <CampaignTable 
                  campaigns={selectedCampaignId === 'all' ? allCampaigns : allCampaigns.filter(c => c.id === selectedCampaignId)} 
                  adSets={filteredAdSets} 
                  ads={filteredAds} 
                />
              )}
              
              {/* Extra Summary Row */}
              {visibilityConfig.show_summary_cards && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ConversionMetricCards metrics={conversionCards} />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kanban" className="mt-0 pt-2">
          <ClientModuleTasksView module="traffic" view="kanban" />
        </TabsContent>

        <TabsContent value="list" className="mt-0 pt-2">
          <ClientModuleTasksView module="traffic" view="list" />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 pt-2">
          {clientId && (
            <TrafficSettings 
              clientId={clientId} 
              onSettingsUpdated={() => setSettingsVersion(v => v + 1)} 
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* BRANDING FOOTER */}
      <div className="pt-8 border-t border-border flex justify-between items-center opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-primary rounded-sm"></div>
          <span className="text-xs font-bold text-foreground tracking-widest uppercase">DashCortex</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
           © 2026 Agência CAEN | Monitoramento de Tráfego em Tempo Real
        </p>
      </div>
    </div>
  );
}
