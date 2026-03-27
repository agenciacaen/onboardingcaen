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

    const { client_id, step, completed } = await req.json()

    if (!client_id || typeof step !== 'number' || typeof completed !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Missing req parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    // Buscar flow progress
    const { data: progress } = await supabaseAdmin
      .from('flow_progress')
      .select('*, flow:flows(id, steps)')
      .eq('client_id', client_id)
      .is('completed_at', null) // Flow ativo
      .limit(1)
      .single()

    if (!progress) {
      return new Response(JSON.stringify({ error: 'No active onboarding flow found for this client.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const flowObj = (Array.isArray(progress.flow) ? progress.flow[0] : progress.flow) as { id: string, steps: { title: string }[] } | null;

    let { current_step, completed_steps } = progress

    let onboarding_completed = false
    let next_step_title = ''

    if (completed) {
      // Adicionar step ao array se não estiver
      if (!completed_steps) completed_steps = []
      if (!completed_steps.includes(step)) {
        completed_steps.push(step)
      }

      current_step = step + 1

      // Buscar total de steps da definição do flow
      const stepsDefinitions = flowObj?.steps || []
      const totalSteps = stepsDefinitions.length

      if (current_step >= totalSteps || completed_steps.length >= totalSteps) {
        // Completou tudo
        onboarding_completed = true
        
        await supabaseAdmin
          .from('flow_progress')
          .update({ 
            completed_steps,
            current_step: totalSteps,
            completed_at: new Date().toISOString()
          })
          .eq('id', progress.id)

        await supabaseAdmin
          .from('clients')
          .update({ 
            onboarding_completed: true,
            status: 'active',
            onboarding_step: totalSteps
          })
          .eq('id', client_id)

        // Chamar notify_client
        await supabaseAdmin.functions.invoke('notify_client', {
          body: {
            client_id,
            type: 'task',
            title: 'Onboarding Concluído',
            body: 'O cliente completou todas as etapas do onboarding!',
            link: `/agency/clients/\${client_id}`
          }
        })

      } else {
        // Ainda não completou
        onboarding_completed = false
        if (stepsDefinitions[current_step]) {
           next_step_title = stepsDefinitions[current_step].title || ''
        }

        await supabaseAdmin
          .from('flow_progress')
          .update({ 
            completed_steps,
            current_step
          })
          .eq('id', progress.id)

        await supabaseAdmin
          .from('clients')
          .update({ onboarding_step: current_step })
          .eq('id', client_id)
      }
    } else {
       // Optional: logic for un-completing a step. Or ignore
       // we only increment according to backend logic spec
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        current_step,
        completed_steps,
        onboarding_completed,
        next_step_title
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
