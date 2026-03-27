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

    const { client_id, type, title, body, link, send_email = false } = await req.json()

    if (!client_id || !type || !title) {
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, client_id')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.client_id !== client_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all client profiles
    const { data: clientProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('client_id', client_id)
      .eq('role', 'client')

    if (!clientProfiles || clientProfiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: { users_notified: 0, email_sent: false }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const notificationIds: string[] = []
    let emailsSent = 0
    let emailStatus = false

    for (const p of clientProfiles) {
      const { data: notif } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: p.id,
          client_id,
          type,
          title,
          body,
          link
        })
        .select('id')
        .single()

      if (notif) notificationIds.push(notif.id)

      if (send_email && Deno.env.get('RESEND_API_KEY')) {
        try {
          // Find email from Auth API if not in profiles
          // O perfil espelha o email de auth.users conforme backend.md
          const toEmail = p.email

          if (toEmail) {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              },
              body: JSON.stringify({
                from: 'Agency <onboarding@resend.dev>', // default resend test
                to: [toEmail],
                subject: title,
                html: `
                  <div style="font-family: sans-serif; padding: 20px;">
                    <h2>${title}</h2>
                    ${body ? `<p>${body}</p>` : ''}
                    ${link ? `<a href="${link}" style="display:inline-block; margin-top:10px; padding:10px 15px; background:#000; color:#fff; text-decoration:none; border-radius:5px;">Acessar</a>` : ''}
                  </div>
                `
              })
            })
            
            if (res.ok) {
              emailsSent++
            }
          }
        } catch (e) {
          console.error('Failed to send email:', e)
        }
      }
    }

    if (emailsSent > 0) emailStatus = true

    return new Response(JSON.stringify({
      success: true,
      data: {
        notification_id: notificationIds[0], // returning first or adjust as needed
        users_notified: notificationIds.length,
        email_sent: emailStatus
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
