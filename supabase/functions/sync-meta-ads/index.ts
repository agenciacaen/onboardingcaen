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

interface MetaMetric {
  campaign_id: string;
  campaign_name: string;
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
  objective?: string;
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
      throw new Error("META_SYSTEM_USER_TOKEN secret is not set");
    }

    let client_id: string | undefined;
    let lookback_days = 7; // Padrão aumentado para garantir atribuições

    try {
      const text = await req.text();
      const body: SyncBody = text ? JSON.parse(text) : {};
      client_id = body.client_id;
      if (body.lookback_days) lookback_days = body.lookback_days;
    } catch (e) {
      console.log('[sync-meta-ads] Chamada sem body ou body inválido');
    }

    let query = supabase.from('meta_ad_accounts').select('*').eq('status', 'active');
    if (client_id) query = query.eq('client_id', client_id);

    const { data: accounts, error: errAccounts } = await query;
    if (errAccounts) throw errAccounts;
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ message: "No active accounts to sync" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Estratégia de Datas: Usamos time_range para controle total, garantindo que incluímos HOJE.
    const today = new Date().toISOString().split('T')[0];
    const sinceDate = lookback_days === 1 
      ? today 
      : new Date(Date.now() - lookback_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const timeRange = JSON.stringify({ since: sinceDate, until: today });

    let syncedCount = 0;
    let metricsInserted = 0;

    for (const account of accounts) {
      try {
        const formattedAccountId = account.ad_account_id.startsWith('act_') ? account.ad_account_id : `act_${account.ad_account_id}`;
        
        // 1. Buscar Insights agregados por campanha diretamente da conta
        const timeIncrement = '&time_increment=1'; // Sempre por dia para o gráfico
        const insightsUrl = `https://graph.facebook.com/v25.0/${formattedAccountId}/insights?level=campaign&time_range=${timeRange}&fields=campaign_id,campaign_name,impressions,clicks,spend,reach,cpc,cpm,ctr,actions,purchase_roas,date_start,date_stop,objective${timeIncrement}&access_token=${token}&limit=500`;
        
        const insRes = await fetch(insightsUrl);
        const insData = await insRes.json();

        if (insData.error) {
          console.error(`[sync-meta-ads] Erro Insights ${formattedAccountId}:`, insData.error.message);
          continue;
        }

        const metricsList = (insData.data || []) as MetaMetric[];
        console.log(`[sync-meta-ads] Sincronizando ${metricsList.length} entradas de métricas para ${account.name}`);

        for (const metric of metricsList) {
          // Garantir que a campanha existe no banco
          const { data: existingCamp } = await supabase
            .from('traffic_campaigns')
            .select('id')
            .eq('client_id', account.client_id)
            .eq('meta_campaign_id', metric.campaign_id)
            .maybeSingle();

          let localCampId: string;
          const campPayload = {
            name: metric.campaign_name,
            platform: 'meta',
            objective: metric.objective || 'UNKNOWN',
            updated_at: new Date().toISOString()
          };

          if (existingCamp) {
            localCampId = existingCamp.id;
            await supabase.from('traffic_campaigns').update(campPayload).eq('id', localCampId);
          } else {
            const { data: newCamp, error: insError } = await supabase.from('traffic_campaigns').insert({
              ...campPayload,
              client_id: account.client_id,
              meta_account_id: account.id,
              meta_campaign_id: metric.campaign_id,
              status: 'active' // Presumimos ativo se veio no insight
            }).select().single();
            
            if (insError) {
              console.error(`[sync-meta-ads] Erro ao inserir campanha ${metric.campaign_id}:`, insError.message);
              continue;
            }
            localCampId = newCamp.id;
          }

          // Salvar Métrica
          let conversions = 0;
          let roas = 0;
          if (metric.actions) {
             const convObj = metric.actions.find((a) => 
               a.action_type === 'onsite_conversion.total_messaging_connection' ||
               a.action_type === 'lead' || 
               a.action_type === 'purchase' || 
               a.action_type === 'offsite_conversion.fb_pixel_lead'
             );
             if (convObj) conversions = parseInt(convObj.value);
          }
          if (metric.purchase_roas && metric.purchase_roas.length > 0) {
             roas = parseFloat(metric.purchase_roas[0].value);
          }

          const { error: upsertError } = await supabase
           .from('traffic_metrics')
           .upsert({
             client_id: account.client_id,
             campaign_id: localCampId,
             date: metric.date_start,
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
           }, { onConflict: 'campaign_id,date' });

          if (!upsertError) metricsInserted++;
        }

        await supabase.from('meta_ad_accounts').update({ last_sync_at: new Date().toISOString() }).eq('id', account.id);
        syncedCount++;
      } catch (accountErr: any) {
        console.error(`[sync-meta-ads] Falha na conta ${account.ad_account_id}:`, accountErr.message);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sincronização profunda concluída! ${metricsInserted} registros processados.` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
