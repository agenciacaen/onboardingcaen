import { supabase } from '@/services/supabase';

export const trafficService = {
  async getOverview(clientId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('get_traffic_overview', {
      p_client_id: clientId,
      p_start: startDate,
      p_end: endDate
    });

    if (error) throw error;
    return data;
  },

  async getCampaigns(clientId: string) {
    const { data, error } = await supabase
      .from('traffic_campaigns')
      .select(`
        id,
        name,
        platform,
        status,
        budget_daily,
        traffic_metrics (
          spend,
          impressions,
          clicks,
          conversions,
          revenue
        )
      `)
      .eq('client_id', clientId);
      
    if (error) throw error;
    return data;
  },

  async getCampaignAds(campaignId: string) {
    const { data, error } = await supabase
      .from('traffic_ads')
      .select('id, name, status, ctr, cpc, roas, impressions, spend, is_best')
      .eq('campaign_id', campaignId);

    if (error) throw error;
    return data;
  },

  async getBestAds(clientId: string, startDate: string, endDate: string, metric: string = 'roas', limit: number = 3) {
    const { data, error } = await supabase.rpc('get_best_ads', {
      p_client_id: clientId,
      p_start: startDate,
      p_end: endDate,
      p_metric: metric,
      p_limit: limit
    });

    if (error) throw error;
    return data;
  }
};
