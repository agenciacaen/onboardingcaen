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

    const { report_id, module } = await req.json()

    if (!report_id || !module) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Identificar tabela de relatório
    const tableName = module === 'traffic' || module === 'web' ? 'traffic_reports' : 'social_reports'

    // Buscar dados do relatório
    const { data: report } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('id', report_id)
      .single()

    if (!report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Buscar dados do cliente
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, name, logo_url')
      .eq('id', report.client_id)
      .single()

    const reportData = report.summary || {}
    let tableHtml = ''

    if (module === 'traffic') {
      tableHtml = `
        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f1f5f9; text-align:left;">
            <th style="padding:10px; border-bottom:1px solid #cbd5e1;">Métrica</th>
            <th style="padding:10px; border-bottom:1px solid #cbd5e1;">Valor</th>
          </tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">Gasto</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">R$ ${reportData.spend?.toFixed(2) || '0.00'}</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">Impressões</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.impressions || 0}</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">Cliques</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.clicks || 0}</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">Conversões</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.conversions || 0}</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">CTR Médio</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.ctr?.toFixed(2) || '0.00'}%</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">ROAS</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.roas?.toFixed(2) || '0.00'}</td></tr>
        </table>
      `
    } else if (module === 'social') {
      tableHtml = `
        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f1f5f9; text-align:left;">
            <th style="padding:10px; border-bottom:1px solid #cbd5e1;">Métrica</th>
            <th style="padding:10px; border-bottom:1px solid #cbd5e1;">Quantidade</th>
          </tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">Total de Posts</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.total_posts || 0}</td></tr>
          <!-- Detalhamento por status poderia ir aqui -->
        </table>
      `
    } else if (module === 'web') {
      tableHtml = `
        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f1f5f9; text-align:left;">
            <th style="padding:10px; border-bottom:1px solid #cbd5e1;">Métrica</th>
            <th style="padding:10px; border-bottom:1px solid #cbd5e1;">Valor</th>
          </tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">Páginas Ativas</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.active_pages || 0}</td></tr>
          <tr><td style="padding:10px; border-bottom:1px solid #e2e8f0;">Score de SEO Médio</td><td style="padding:10px; border-bottom:1px solid #e2e8f0;">${reportData.avg_seo_score?.toFixed(0) || 0}</td></tr>
        </table>
      `
    }

    // Montar HTML do Relatório
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { max-height: 50px; }
          .title { margin: 0; font-size: 24px; color: #0f172a; }
          .subtitle { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
          .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${client?.name || 'Cliente'}</h1>
            <p class="subtitle">${report.title}</p>
            <p class="subtitle">Período: ${report.period_start} a ${report.period_end}</p>
          </div>
          ${client?.logo_url ? `<img src="${client.logo_url}" class="logo" />` : ''}
        </div>

        <h2>Visão Geral do Módulo de ${module.toUpperCase()}</h2>
        
        ${tableHtml}

        <div class="footer">
          Gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} pelo sistema CAEN.
        </div>
      </body>
      </html>
    `

    let fileUrl = ''
    let fileSize = 0
    let extension = 'html'
    let finalBuffer = new TextEncoder().encode(htmlContent)

    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN')

    if (browserlessToken) {
      try {
        const response = await fetch(`https://chrome.browserless.io/pdf?token=${browserlessToken}`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            html: htmlContent,
            options: {
              displayHeaderFooter: false,
              printBackground: true,
              format: 'A4'
            }
          })
        })

        if (response.ok) {
          const pdfData = await response.arrayBuffer()
          finalBuffer = new Uint8Array(pdfData)
          extension = 'pdf'
        }
      } catch (e) {
        console.error('PDF Generation failed, falling back to HTML', e)
        // Fallback para HTML já configurado pelo ext = 'html' e finalBuffer = htmlContent
      }
    }

    const filePath = `${client?.id || 'unknown'}/${module}/${report_id}.${extension}`

    // Upload to Storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('reports') // assume bucket reports exists
      .upload(filePath, finalBuffer, {
        contentType: extension === 'pdf' ? 'application/pdf' : 'text/html',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    fileSize = finalBuffer.length
    
    // Pegar URL Pública (se o bucket for público)
    const { data: publicUrlData } = supabaseAdmin.storage.from('reports').getPublicUrl(filePath)
    fileUrl = publicUrlData.publicUrl

    // Atualizar registro no banco
    await supabaseAdmin
      .from(tableName)
      .update({ file_url: fileUrl })
      .eq('id', report_id)

    return new Response(JSON.stringify({
      success: true,
      data: {
        file_url: fileUrl,
        file_size: fileSize
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
