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

    console.log(`[Action]: ${action}`)

    // 1. Criar Instância Global
    if (action === "create-global-instance") {
      const technicalName = `agency-${Math.random().toString(36).substring(2, 10)}`
      
      const response = await fetch(`${evoServerUrl}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evoAuthKey
        },
        body: JSON.stringify({
          instanceName: technicalName,
          token: "caen-token-secure",
          qrcode: true
        })
      })

      const responseBody = await response.text()
      if (!response.ok) {
        throw new Error(`Evolution API Error: ${response.status} - ${responseBody}`)
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

      if (dbError) throw new Error(`DB Error: ${dbError.message}`)

      return new Response(JSON.stringify({ ...data, instanceId: newInst.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Outras ações... (simplificadas para teste)
    if (action === "check-global-status") {
      const { data: inst } = await adminSupabase.from("whatsapp_instances").select("instance_name").eq("id", instanceId).single()
      const response = await fetch(`${evoServerUrl}/instance/connectionState/${inst.instance_name}`, { headers: { "apikey": evoAuthKey } })
      const data = await response.json()
      const status = data.instance?.state || "close"
      await adminSupabase.from("whatsapp_instances").update({ status }).eq("id", instanceId)
      return new Response(JSON.stringify({ status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "fetch-groups") {
      const { data: inst } = await adminSupabase.from("whatsapp_instances").select("instance_name").eq("id", instanceId).single()
      const response = await fetch(`${evoServerUrl}/group/fetchAllGroups/${inst.instance_name}`, { headers: { "apikey": evoAuthKey } })
      const data = await response.json()
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === "logout-global") {
      const { data: inst } = await adminSupabase.from("whatsapp_instances").select("instance_name").eq("id", instanceId).single()
      if (inst) await fetch(`${evoServerUrl}/instance/delete/${inst.instance_name}`, { method: "DELETE", headers: { "apikey": evoAuthKey } })
      await adminSupabase.from("whatsapp_instances").delete().eq("id", instanceId)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    throw new Error("Ação inválida")
  } catch (error: any) {
    console.error("[Fatal]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
