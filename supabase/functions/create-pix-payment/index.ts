import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { credits } = await req.json();

    if (!credits || credits < 1) {
      throw new Error('Quantidade de créditos inválida');
    }

    // Buscar dados do perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao buscar perfil do usuário');
    }

    const amount = credits * 100; // R$ 1,00 por crédito, em centavos
    const expiresIn = 3600; // 1 hora

    console.log('Criando pagamento PIX:', { amount, credits, userId: user.id });

    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ABACATEPAY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        expiresIn,
        description: `Compra de ${credits} créditos`,
        customer: {
          name: profile.full_name || profile.email,
          email: profile.email,
        },
        metadata: {
          userId: user.id,
          credits: credits.toString(),
        },
      }),
    });

    const responseData = await abacatePayResponse.json();

    if (!abacatePayResponse.ok) {
      console.error('Erro na API do AbacatePay:', responseData);
      throw new Error(responseData.error?.message || 'Erro ao criar pagamento PIX');
    }

    console.log('Pagamento PIX criado com sucesso:', responseData.data.id);

    return new Response(
      JSON.stringify({
        id: responseData.data.id,
        brCode: responseData.data.brCode,
        brCodeBase64: responseData.data.brCodeBase64,
        amount: responseData.data.amount,
        expiresAt: responseData.data.expiresAt,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro em create-pix-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
