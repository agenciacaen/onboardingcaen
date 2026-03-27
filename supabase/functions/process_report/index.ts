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

    const { client_id, module, period_start, period_end } = await req.json()

    if (!client_id || !module || !period_start || !period_end) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Auth verification
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, client_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (profile.role !== 'admin' && profile.client_id !== client_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let summary: Record<string, unknown> = {}
    let tableName = ''
    let reportId: string | null = null

    if (module === 'traffic') {
      tableName = 'traffic_reports'
      const { data: metrics } = await supabaseAdmin
        .from('traffic_metrics')
        .select('spend, impressions, clicks, conversions')
        .eq('client_id', client_id)
        .gte('date', period_start)
        .lte('date', period_end)

      const totalSpend = metrics?.reduce((acc: number, curr: any) => acc + (curr.spend || 0), 0) || 0
      const totalImpressions = metrics?.reduce((acc: number, curr: any) => acc + (curr.impressions || 0), 0) || 0
      const totalClicks = metrics?.reduce((acc: number, curr: any) => acc + (curr.clicks || 0), 0) || 0
      const totalConversions = metrics?.reduce((acc: number, curr: any) => acc + (curr.conversions || 0), 0) || 0

      summary = {
        spend: totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        roas: totalSpend > 0 ? totalConversions / totalSpend : 0
      }
    } else if (module === 'social') {
      tableName = 'social_reports'
      const { data: contents } = await supabaseAdmin
        .from('social_contents')
        .select('status, platform')
        .eq('client_id', client_id)
        .gte('created_at', period_start) // Simplified range
        .lte('created_at', period_end)

      const statusCounts = contents?.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
      }, {}) || {}

      summary = {
        total_posts: contents?.length || 0,
        by_status: statusCounts
      }
    } else if (module === 'web') {
      tableName = 'traffic_reports' // Web typically doesn't have a distinct report table based on backend.md, using traffic/social logic
      
      const { data: pages } = await supabaseAdmin
        .from('web_pages')
        .select('seo_score, status')
        .eq('client_id', client_id)

      const avgScore = pages?.reduce((acc: number, curr: any) => acc + (curr.seo_score || 0), 0) / (pages?.length || 1) || 0
      
      summary = {
        active_pages: pages?.filter((p: any) => p.status === 'active').length || 0,
        avg_seo_score: avgScore
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid module' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert Report
    // Se o module for web, como não há `web_reports` no backend.md, usaremos `traffic_reports` provisoriamente
    const { data: report, error: reportError } = await supabaseAdmin
      .from(tableName || 'traffic_reports')
      .insert({
        client_id,
        title: `Relatório ${module.toUpperCase()} - ${period_start} a ${period_end}`,
        period_start,
        period_end,
        summary,
        generated_by: user.id
      })
      .select('id')
      .single()

    if (reportError || !report) {
      throw new Error(`Failed to insert report: ${reportError?.message}`)
    }
    
    reportId = report.id

    // Call generate_pdf
    const { data: pdfData, error: pdfError } = await supabaseAdmin.functions.invoke('generate_pdf', {
      body: { report_id: reportId, module }
    })

    return new Response(JSON.stringify({
      success: true,
      data: {
        report_id: reportId,
        summary,
        file_url: pdfData?.file_url || null,
        pdf_error: pdfError?.message || null
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
