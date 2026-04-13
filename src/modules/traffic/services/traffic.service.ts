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

  async getCampaigns(clientId: string, startDate?: string, endDate?: string) {
    let query = supabase
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
          roas,
          ctr,
          cpc,
          raw_actions,
          date
        )
      `)
      .eq('client_id', clientId);

    if (startDate) {
      query = query.gte('traffic_metrics.date', startDate);
    }
    if (endDate) {
      query = query.lte('traffic_metrics.date', endDate);
    }
      
    const { data, error } = await query;
      
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
  },

  async syncData(clientId: string) {
    const { data, error } = await supabase.functions.invoke('sync-meta-ads', {
      body: { client_id: clientId, lookback_days: 1 }
    });

    if (error) throw error;
    return data;
  },

  async getSettings(clientId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('traffic_config')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return data.traffic_config;
  },

  async updateSettings(clientId: string, settings: any) {
    const { error } = await supabase
      .from('clients')
      .update({ traffic_config: settings })
      .eq('id', clientId);

    if (error) throw error;
    return true;
  }
};
