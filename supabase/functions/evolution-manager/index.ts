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

    if (action === "create-global-instance") {
      const technicalName = `agency-${Math.random().toString(36).substring(2, 10)}`
      
      // Lista de possíveis nomes de integração para tentar (v2 usa variações)
      const possibleIntegrations = ["WHATSAPP-BAILEYS", "BAILEYS", "whatsapp-baileys"];
      let lastError = "";
      let successData = null;

      for (const integration of possibleIntegrations) {
        console.log(`[Trial] Tentando integração: ${integration}`);
        
        const response = await fetch(`${evoServerUrl}/instance/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evoAuthKey
          },
          body: JSON.stringify({
            instanceName: technicalName,
            token: "caen-token-secure",
            integration: integration,
            qrcode: true
          })
        });

        const responseText = await response.text();
        if (response.ok) {
          successData = JSON.parse(responseText);
          console.log(`[Success] Integração aceita: ${integration}`);
          break;
        } else {
          lastError = responseText;
          console.warn(`[Fail] ${integration} rejeitada: ${responseText}`);
        }
      }

      if (!successData) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Todas as tentativas de integração falharam. Último erro: ${lastError}` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }

      // Se chegamos aqui, successData tem o retorno da Evolution
      const { data: newInst, error: dbError } = await adminSupabase
        .from("whatsapp_instances")
        .insert({
          name: name || "WhatsApp Agencia",
          instance_name: technicalName,
          status: "connecting"
        })
        .select()
        .single();

      if (dbError) throw new Error(`DB Error: ${dbError.message}`);

      return new Response(JSON.stringify({ ...successData, instanceId: newInst.id, success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Outros casos...
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
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })
  }
})
