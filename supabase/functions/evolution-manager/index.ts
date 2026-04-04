import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const evoServerUrl = Deno.env.get("EVOLUTION_SERVER_URL") ?? ""
    const evoAuthKey = Deno.env.get("EVOLUTION_AUTH_KEY") ?? ""
    const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    const adminSupabase = createClient(supabaseUrl, adminKey)
    const { action, name, instanceId } = await req.json()

    console.log(`[Debug Action]: ${action}`)

    if (action === "create-global-instance") {
      const technicalName = `agency-${Math.random().toString(36).substring(2, 10)}`
      
      console.log(`[Connecting to Evolution]: ${evoServerUrl}/instance/create`)
      
      const response = await fetch(`${evoServerUrl}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evoAuthKey
        },
        body: JSON.stringify({
          instanceName: technicalName,
          token: "caen-token-secure",
          integration: "WHATSAPP-BAILEYS",
          qrcode: true
        })
      })

      const responseBody = await response.text()
      if (!response.ok) {
        console.error(`[Evolution Error]: ${responseBody}`)
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Evolution API Error: ${response.status} - ${responseBody}` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 // Retornamos 200 para o Supabase não travar
        })
      }

      const data = JSON.parse(responseBody)
      
      const { data: newInst, error: dbError } = await adminSupabase
        .from("whatsapp_instances")
        .insert({
          name: name || "WhatsApp Agencia",
          instance_name: technicalName,
          status: "connecting"
        })
        .select()
        .single()

      if (dbError) {
        console.error(`[DB Error]: ${dbError.message}`)
        return new Response(JSON.stringify({ 
          success: false, 
          error: `DB Error: ${dbError.message}` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        })
      }

      return new Response(JSON.stringify({ ...data, instanceId: newInst.id, success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Outros casos...
    return new Response(JSON.stringify({ error: "Ação não implementada no debug" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error("[Fatal Debug]:", error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 // Forçamos 200 para ver o erro no frontend
    })
  }
})
