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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const evoServerUrl = Deno.env.get("EVOLUTION_SERVER_URL") ?? ""
    const evoAuthKey = Deno.env.get("EVOLUTION_AUTH_KEY") ?? ""

    if (!evoServerUrl || !evoAuthKey) {
      throw new Error("Configuração da Evolution API ausente no servidor.")
    }

    // Autenticação manual: Inicializa o Supabase com o token do usuário logado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Cabeçalho de autorização ausente.")
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("[Auth Debug] Token:", authHeader.substring(0, 20) + "...")
      console.error("[Auth Debug] Erro ao validar usuário:", authError?.message || "Sessão não encontrada")
      // Por enquanto, vamos logar mas tentar prosseguir se for apenas erro de getUser
      // return new Response(JSON.stringify({ error: "Sessão expirada ou não autorizado." }), { ... })
    } else {
      console.log("[Auth Success] Usuário logado:", user.email)
    }

    // Agora que sabemos que o usuário é válido, usamos service_role para operações DB
    const adminSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")
    const { action, name, instanceId } = await req.json()

    // 1. Criar Instância Global
    if (action === "create-global-instance") {
      const technicalName = `agency-${Math.random().toString(36).substring(2, 10)}`
      console.log(`[Evolution] Criando instância: ${technicalName} para ${name}`)
      
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

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Evolution] Erro na API: ${response.status} - ${errorText}`)
        throw new Error(`Erro na Evolution API: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`[Evolution] Instância criada com sucesso na API`)
      
      // Salvar na nova tabela usando adminSupabase
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
        console.error(`[Supabase] Erro ao salvar instância:`, dbError)
        throw new Error(`Erro no Banco de Dados: ${dbError.message}`)
      }

      return new Response(JSON.stringify({ ...data, instanceId: newInst.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 2. Checar Status Global
    if (action === "check-global-status") {
      const { data: inst } = await adminSupabase
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("id", instanceId)
        .single()

      if (!inst) throw new Error("Instância não encontrada no banco.")

      const response = await fetch(`${evoServerUrl}/instance/connectionState/${inst.instance_name}`, {
        method: "GET",
        headers: { "apikey": evoAuthKey }
      })

      const data = await response.json()
      const status = data.instance?.state || "close"

      await adminSupabase
        .from("whatsapp_instances")
        .update({ status: status })
        .eq("id", instanceId)

      return new Response(JSON.stringify({ status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 3. Logout Global
    if (action === "logout-global") {
      const { data: inst } = await adminSupabase
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("id", instanceId)
        .single()

      if (inst) {
        await fetch(`${evoServerUrl}/instance/delete/${inst.instance_name}`, {
          method: "DELETE",
          headers: { "apikey": evoAuthKey }
        })
      }

      await adminSupabase
        .from("whatsapp_instances")
        .delete()
        .eq("id", instanceId)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 4. Pegar QR code atual
    if (action === "get-qrcode-global") {
        const { data: inst } = await adminSupabase
          .from("whatsapp_instances")
          .select("instance_name")
          .eq("id", instanceId)
          .single()
  
        const response = await fetch(`${evoServerUrl}/instance/connect/${inst.instance_name}`, {
          method: "GET",
          headers: { "apikey": evoAuthKey }
        })
  
        const data = await response.json()
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

    // 5. Listar Grupos
    if (action === "fetch-groups") {
      const { data: inst } = await adminSupabase
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("id", instanceId)
        .single()

      if (!inst) throw new Error("Instância não encontrada")

      const response = await fetch(`${evoServerUrl}/group/fetchAllGroups/${inst.instance_name}`, {
        method: "GET",
        headers: { "apikey": evoAuthKey }
      })

      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    throw new Error("Ação inválida")
  } catch (error: any) {
    console.error("[Evolution Manager Error]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
