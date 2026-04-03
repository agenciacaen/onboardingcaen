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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? ""
    const evoServerUrl = Deno.env.get("EVOLUTION_SERVER_URL") ?? ""
    const evoAuthKey = Deno.env.get("EVOLUTION_AUTH_KEY") ?? ""

    if (!openaiKey || !evoServerUrl || !evoAuthKey) {
      throw new Error("Configuração da OpenAI ou Evolution API ausente")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Clientes que têm resumo ativado e uma instância global válida vinculada
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select(`
        id, 
        name, 
        whatsapp_group_id, 
        whatsapp_instance_id,
        whatsapp_instances (
          instance_name,
          status
        )
      `)
      .eq("ai_summary_enabled", true)
      .not("whatsapp_instance_id", "is", null)
      .not("whatsapp_group_id", "is", null)

    if (clientsError) throw clientsError

    const results = []
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const dateString = sevenDaysAgo.toISOString()

    for (const client of clients) {
      const instance = client.whatsapp_instances as any;
      if (!instance || instance.status !== "open") {
        results.push({ client: client.name, status: "Instância não conectada" })
        continue
      }

      const { data: tasks } = await supabase
        .from("tasks")
        .select("title, completed_at")
        .eq("client_id", client.id)
        .eq("status", "done")
        .gte("completed_at", dateString)

      const { data: docs } = await supabase
        .from("documents")
        .select("title, created_at")
        .eq("client_id", client.id)
        .gte("created_at", dateString)

      if ((!tasks || tasks.length === 0) && (!docs || docs.length === 0)) {
        results.push({ client: client.name, status: "Sem atualizações" })
        continue
      }

      const tasksText = tasks?.map(t => `- ${t.title}`).join("\n") || "Nenhuma tarefa finalizada."
      const docsText = docs?.map(d => `- ${d.title}`).join("\n") || "Nenhum documento novo."

      const prompt = `Você é o "Assistente Caen", um assistente profissional e amigável da Agência Caen.
Crie um resumo semanal de onboarding para o cliente "${client.name}".
Objetivo: informar o progresso de forma clara e profissional.

Tarefas concluídas (últimos 7 dias):
${tasksText}

Documentos recebidos (últimos 7 dias):
${docsText}

Gere apenas a mensagem para WhatsApp. Use emojis com moderação. Agradeça a parceria ao final.`

      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      })

      if (!openAiResponse.ok) {
        throw new Error(`Erro OpenAI: ${await openAiResponse.text()}`)
      }

      const openAiData = await openAiResponse.json()
      const messageContent = openAiData.choices[0].message.content

      // Enviar mensagem usando a instância global vinculada ao cliente
      const evoEndpoint = `${evoServerUrl}/message/sendText/${instance.instance_name}`
      const evoResponse = await fetch(evoEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evoAuthKey
        },
        body: JSON.stringify({
          number: client.whatsapp_group_id,
          text: messageContent
        })
      })

      if (!evoResponse.ok) {
        results.push({ client: client.name, status: "Erro envio WhatsApp", detail: await evoResponse.text() })
      } else {
        await supabase
          .from("clients")
          .update({ last_ai_summary_at: new Date().toISOString() })
          .eq("id", client.id)

        results.push({ client: client.name, status: "Sucesso" })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
