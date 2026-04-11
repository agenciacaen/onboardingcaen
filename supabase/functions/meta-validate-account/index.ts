import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ad_account_id } = await req.json();

    if (!ad_account_id) {
      throw new Error("ad_account_id is required");
    }

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    if (!token) {
      throw new Error("META_SYSTEM_USER_TOKEN secret is not set");
    }

    const formattedAccountId = ad_account_id.startsWith('act_') ? ad_account_id : `act_${ad_account_id}`;

    const url = `https://graph.facebook.com/v19.0/${formattedAccountId}?fields=name,account_status&access_token=${token}`;
    const fbRes = await fetch(url);
    const fbData = await fbRes.json();

    if (fbData.error) {
       console.error("Meta API error:", fbData.error);
       return new Response(JSON.stringify({ error: fbData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: fbData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
