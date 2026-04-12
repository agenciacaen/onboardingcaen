import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncBody {
  client_id?: string;
  lookback_days?: number;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
}

interface MetaMetric {
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
  purchase_roas?: Array<{ value: string }>;
  date_start: string;
  date_stop: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    if (!token) {
      console.error('[sync-meta-ads] META_SYSTEM_USER_TOKEN não configurado');
      throw new Error("META_SYSTEM_USER_TOKEN secret is not set");
    }

    let client_id: string | undefined;
    let lookback_days = 1;

    try {
      const text = await req.text();
      const body: SyncBody = text ? JSON.parse(text) : {};
      client_id = body.client_id;
      if (body.lookback_days) lookback_days = body.lookback_days;
    } catch (e) {
      console.log('[sync-meta-ads] Chamada sem body ou body inválido');
    }

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

    const datePreset = lookback_days > 1 ? (lookback_days > 7 ? 'last_30d' : 'last_7d') : 'today';
    console.log(`[sync-meta-ads] Iniciando sync para ${accounts.length} contas. Preset: ${datePreset}`);
    let syncedCount = 0;
    let metricsInserted = 0;

    for (const account of accounts) {
      try {
        const formattedAccountId = account.ad_account_id.startsWith('act_') ? account.ad_account_id : `act_${account.ad_account_id}`;
        
        const campUrl = `https://graph.facebook.com/v25.0/${formattedAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&access_token=${token}`;
        const campRes = await fetch(campUrl);
        const campData = await campRes.json();
        
        if (campData.error) {
          console.error(`[sync-meta-ads] Erro Meta API (Campanhas) ${formattedAccountId}:`, campData.error.message);
          continue;
        }

        const campaigns: MetaCampaign[] = campData.data || [];
        for (const campaign of campaigns) {
          try {
            const budget_daily = campaign.daily_budget ? campaign.daily_budget / 100 : null;
            const budget_total = campaign.lifetime_budget ? campaign.lifetime_budget / 100 : null;
            const cStatus = campaign.status === 'ACTIVE' ? 'active' : (campaign.status === 'PAUSED' ? 'paused' : 'ended');

            const { data: existingCamp, error: findError } = await supabase
              .from('traffic_campaigns')
              .select('id')
              .eq('client_id', account.client_id)
              .eq('meta_campaign_id', campaign.id)
              .maybeSingle();

            if (findError) console.error(`[sync-meta-ads] Erro ao buscar campanha ${campaign.id}:`, findError.message);

            let localCampId: string | undefined = existingCamp?.id;
            const campPayload = {
              name: campaign.name,
              status: cStatus,
              platform: 'meta',
              objective: campaign.objective,
              budget_daily: budget_daily,
              budget_total: budget_total,
              start_date: campaign.start_time ? campaign.start_time.split('T')[0] : null,
              end_date: campaign.stop_time ? campaign.stop_time.split('T')[0] : null,
              updated_at: new Date().toISOString()
            };

            if (localCampId) {
              await supabase.from('traffic_campaigns').update(campPayload).eq('id', localCampId);
            } else {
              const { data: newCamp, error: insError } = await supabase.from('traffic_campaigns').insert({
                ...campPayload,
                client_id: account.client_id,
                meta_account_id: account.id,
                meta_campaign_id: campaign.id,
              }).select().single();
              
              if (insError) {
                console.error(`[sync-meta-ads] Erro ao inserir campanha ${campaign.id}:`, insError.message);
              } else {
                localCampId = newCamp.id;
              }
            }

            // Sync Insights
            if (localCampId) {
                const timeIncrement = lookback_days > 1 ? '&time_increment=1' : '';
                const insightsUrl = `https://graph.facebook.com/v25.0/${campaign.id}/insights?date_preset=${datePreset}&fields=impressions,clicks,spend,reach,cpc,cpm,ctr,actions,purchase_roas,date_start,date_stop${timeIncrement}&access_token=${token}`;
                const insRes = await fetch(insightsUrl);
                const insData = await insRes.json();
                
                if (insData.error) {
                  console.warn(`[sync-meta-ads] Erro insights para ${campaign.id}:`, insData.error.message);
                } else if (insData.data && insData.data.length > 0) {
                  console.log(`[sync-meta-ads] Processando ${insData.data.length} dias de métricas para ${campaign.name}`);
                  
                  for (const metric of (insData.data as MetaMetric[])) {
                    let conversions = 0;
                    let roas = 0;
                    const logDate = metric.date_start;
                    
                    if (!logDate) {
                      console.warn(`[sync-meta-ads] Métrica sem data para campanha ${campaign.id}, pulando...`);
                      continue;
                    }

                    if (metric.actions) {
                       const convObj = metric.actions.find((a) => 
                         a.action_type === 'lead' || 
                         a.action_type === 'purchase' || 
                         a.action_type === 'onsite_conversion.total_messaging_connection' ||
                         a.action_type === 'offsite_conversion.fb_pixel_lead'
                       );
                       if (convObj) conversions = parseInt(convObj.value);
                    }
                    if (metric.purchase_roas && metric.purchase_roas.length > 0) {
                       roas = parseFloat(metric.purchase_roas[0].value);
                    }

                    // USANDO UPSERT PARA SIMPLIFICAR E EVITAR CONFLITOS
                    const { error: upsertError } = await supabase
                     .from('traffic_metrics')
                     .upsert({
                       client_id: account.client_id,
                       campaign_id: localCampId,
                       date: logDate,
                       impressions: parseInt(metric.impressions || '0'),
                       clicks: parseInt(metric.clicks || '0'),
                       spend: parseFloat(metric.spend || '0'),
                       reach: parseInt(metric.reach || '0'),
                       cpc: parseFloat(metric.cpc || '0'),
                       cpm: parseFloat(metric.cpm || '0'),
                       ctr: parseFloat(metric.ctr || '0'),
                       conversions: conversions,
                       roas: roas,
                       updated_at: new Date().toISOString(),
                       raw_actions: metric.actions || []
                     }, { 
                       onConflict: 'campaign_id,date' 
                     });

                    if (upsertError) {
                      console.error(`[sync-meta-ads] Erro no upsert de métrica (Data: ${logDate}):`, upsertError.message);
                    } else {
                      metricsInserted++;
                    }
                  }
                }
            }
          } catch (campErr: any) {
            console.error(`[sync-meta-ads] Erro campanha ${campaign.id}:`, campErr.message);
          }
        }

        await supabase.from('meta_ad_accounts').update({ last_sync_at: new Date().toISOString() }).eq('id', account.id);
        syncedCount++;
      } catch (accountErr: any) {
        console.error(`[sync-meta-ads] Falha na conta ${account.ad_account_id}:`, accountErr.message);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sincronizadas ${syncedCount} contas. Métricas processadas: ${metricsInserted}.` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error('[sync-meta-ads] Erro Fatal:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
