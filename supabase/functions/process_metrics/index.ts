import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    interface MetricItem {
      external_campaign_id: string;
      external_ad_id?: string;
      impressions: number;
      clicks: number;
      spend: number;
      conversions: number;
      reach: number;
    }

    const { client_id, platform, date, raw_metrics } = await req.json()

    if (!client_id || !platform || !date || !Array.isArray(raw_metrics)) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validação de acesso: apenas admin pode chamar
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let inserted = 0
    const updated = 0
    const errors: { item: MetricItem; error: string }[] = []

    for (const item of raw_metrics as MetricItem[]) {
      try {
        // Encontrar campaign
        const { data: campaign } = await supabaseAdmin
          .from('traffic_campaigns')
          .select('id')
          .eq('client_id', client_id)
          .eq('external_id', item.external_campaign_id)
          .single()

        const campaign_id = campaign?.id

        // Encontrar ad se fornecido
        let ad_id = null
        if (item.external_ad_id) {
          const { data: ad } = await supabaseAdmin
            .from('traffic_ads')
            .select('id')
            .eq('client_id', client_id)
            .eq('external_id', item.external_ad_id)
            .single()
          ad_id = ad?.id
        }

        const impressions = item.impressions || 0
        const clicks = item.clicks || 0
        const spend = item.spend || 0
        const conversions = item.conversions || 0
        const reach = item.reach || 0

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
        const cpc = clicks > 0 ? spend / clicks : 0
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0
        const roas = spend > 0 ? conversions / spend : 0

        const metricData = {
          client_id,
          campaign_id,
          ad_id,
          date,
          impressions,
          clicks,
          spend,
          conversions,
          reach,
          ctr,
          cpc,
          cpm,
          roas,
        }

        // UPSERT
        const { error: upsertError } = await supabaseAdmin
          .from('traffic_metrics')
          .upsert(metricData, {
            onConflict: 'client_id, campaign_id, ad_id, date'
          })

        if (upsertError) {
          errors.push({ item, error: upsertError.message })
        } else {
          inserted++
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error processing metric";
        errors.push({ item, error: message })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        inserted,
        updated,
        errors
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
