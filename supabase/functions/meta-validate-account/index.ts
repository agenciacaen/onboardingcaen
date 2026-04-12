import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  ad_account_id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: ValidateRequest;
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('[meta-validate-account] Falha ao parsear JSON:', e);
      throw new Error("Corpo da requisição inválido.");
    }

    const { ad_account_id } = body;

    if (!ad_account_id) {
      throw new Error("ad_account_id é obrigatório");
    }

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    if (!token) {
      console.error('[meta-validate-account] META_SYSTEM_USER_TOKEN não configurado');
      throw new Error("Token de acesso do Meta não configurado. Contate o administrador.");
    }

    const formattedAccountId = ad_account_id.startsWith('act_') ? ad_account_id : `act_${ad_account_id}`;
    console.log(`[meta-validate-account] Validando conta: ${formattedAccountId}`);

    const url = `https://graph.facebook.com/v21.0/${formattedAccountId}?fields=name,account_status&access_token=${token}`;
    console.log(`[meta-validate-account] Chamando Meta API...`);
    
    const fbRes = await fetch(url);
    const fbData = await fbRes.json();

    console.log(`[meta-validate-account] Resposta Meta API (${fbRes.status})`);

    if (fbData.error) {
       console.error('[meta-validate-account] Erro detalhado da Meta:', JSON.stringify(fbData.error));
       return new Response(JSON.stringify({ 
         success: false,
         error: fbData.error.message,
         meta_error_code: fbData.error.code 
       }), {
        status: 200, // Retornamos 200 para que o frontend receba o JSON e trate a mensagem
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[meta-validate-account] Conta encontrada: ${fbData.name}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        id: fbData.id,
        name: fbData.name,
        account_status: fbData.account_status
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error('[meta-validate-account] Erro capturado no catch:', err.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: err.message,
      stack: err.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retornamos 200 para evitar o erro genérico do Supabase Client
    });
  }
});
