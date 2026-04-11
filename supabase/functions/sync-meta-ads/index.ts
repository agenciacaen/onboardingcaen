import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    if (!token) {
      throw new Error("META_SYSTEM_USER_TOKEN secret is not set");
    }

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body can be empty
    }
    const { client_id } = body as any;

    let query = supabase
      .from('meta_ad_accounts')
      .select('*')
      .eq('status', 'active');
    
    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    const { data: accounts, error: errAccounts } = await query;

    if (errAccounts) throw errAccounts;
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ message: "No active accounts to sync" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let syncedCount = 0;

    for (const account of accounts) {
      const formattedAccountId = account.ad_account_id.startsWith('act_') ? account.ad_account_id : `act_${account.ad_account_id}`;
      
      const campUrl = `https://graph.facebook.com/v19.0/${formattedAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&access_token=${token}`;
      const campRes = await fetch(campUrl);
      const campData = await campRes.json();
      
      if (campData.error) {
        console.error(`Error fetching campaigns for ${formattedAccountId}:`, campData.error);
        continue;
      }

      const campaigns = campData.data || [];
      const today = new Date().toISOString().split('T')[0];

      for (const campaign of campaigns) {
        let budget_daily = campaign.daily_budget ? campaign.daily_budget / 100 : null;
        let budget_total = campaign.lifetime_budget ? campaign.lifetime_budget / 100 : null;
        let cStatus = campaign.status === 'ACTIVE' ? 'active' : (campaign.status === 'PAUSED' ? 'paused' : 'ended');

        const { data: existingCamp } = await supabase
          .from('traffic_campaigns')
          .select('id')
          .eq('client_id', account.client_id)
          .eq('meta_campaign_id', campaign.id)
          .single();

        let localCampId;
        if (existingCamp) {
          localCampId = existingCamp.id;
          await supabase.from('traffic_campaigns').update({
            name: campaign.name,
            status: cStatus,
            platform: 'meta',
            objective: campaign.objective,
            budget_daily: budget_daily,
            budget_total: budget_total,
            start_date: campaign.start_time ? campaign.start_time.split('T')[0] : null,
            end_date: campaign.stop_time ? campaign.stop_time.split('T')[0] : null,
            updated_at: new Date().toISOString()
          }).eq('id', localCampId);
        } else {
          const { data: newCamp, error: errInsert } = await supabase.from('traffic_campaigns').insert({
            client_id: account.client_id,
            meta_account_id: account.id,
            meta_campaign_id: campaign.id,
            name: campaign.name,
            status: cStatus,
            platform: 'meta',
            objective: campaign.objective,
            budget_daily: budget_daily,
            budget_total: budget_total,
            start_date: campaign.start_time ? campaign.start_time.split('T')[0] : null,
            end_date: campaign.stop_time ? campaign.stop_time.split('T')[0] : null,
          }).select().single();
          if (newCamp) localCampId = newCamp.id;
          if (errInsert) console.error("Insert camp error:", errInsert);
        }

        if (localCampId) {
           const insightsUrl = `https://graph.facebook.com/v19.0/${campaign.id}/insights?date_preset=today&fields=impressions,clicks,spend,reach,cpc,cpm,ctr,actions,purchase_roas&access_token=${token}`;
           const insRes = await fetch(insightsUrl);
           const insData = await insRes.json();
           
           if (!insData.error && insData.data && insData.data.length > 0) {
             const metric = insData.data[0];
             let conversions = 0;
             let roas = 0;
             if (metric.actions) {
                const convObj = metric.actions.find((a: any) => a.action_type === 'lead' || a.action_type === 'purchase');
                if (convObj) conversions = parseInt(convObj.value);
             }
             if (metric.purchase_roas && metric.purchase_roas.length > 0) {
                roas = parseFloat(metric.purchase_roas[0].value);
             }

             const { data: existingMetric } = await supabase
              .from('traffic_metrics')
              .select('id')
              .eq('campaign_id', localCampId)
              .eq('date', today)
              .single();

             const payload = {
                client_id: account.client_id,
                campaign_id: localCampId,
                date: today,
                impressions: parseInt(metric.impressions || 0),
                clicks: parseInt(metric.clicks || 0),
                spend: parseFloat(metric.spend || 0),
                reach: parseInt(metric.reach || 0),
                cpc: parseFloat(metric.cpc || 0),
                cpm: parseFloat(metric.cpm || 0),
                ctr: parseFloat(metric.ctr || 0),
                conversions: conversions,
                roas: roas
             };

             if (existingMetric) {
                await supabase.from('traffic_metrics').update(payload).eq('id', existingMetric.id);
             } else {
                await supabase.from('traffic_metrics').insert(payload);
             }
           }
        }
      }

      await supabase.from('meta_ad_accounts').update({ last_sync_at: new Date().toISOString() }).eq('id', account.id);
      syncedCount++;
    }

    return new Response(JSON.stringify({ success: true, message: `Synced ${syncedCount} accounts` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    console.error("Sync Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
