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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { paymentId, userId, credits } = await req.json();

    if (!paymentId || !userId || !credits) {
      throw new Error('Dados incompletos');
    }

    console.log('Verificando pagamento:', paymentId);

    const abacatePayResponse = await fetch(
      `https://api.abacatepay.com/v1/pixQrCode/check?id=${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('ABACATEPAY_API_KEY')}`,
        },
      }
    );

    const responseData = await abacatePayResponse.json();

    if (!abacatePayResponse.ok) {
      console.error('Erro ao verificar pagamento:', responseData);
      throw new Error('Erro ao verificar pagamento');
    }

    console.log('Status do pagamento:', responseData.data.status);

    // Se o pagamento foi confirmado, adicionar créditos
    if (responseData.data.status === 'PAID') {
      console.log('Pagamento confirmado! Adicionando créditos...');

      // Adicionar créditos ao usuário
      const { data: currentProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar perfil:', fetchError);
        throw new Error('Erro ao buscar perfil');
      }

      const newCredits = currentProfile.credits + credits;

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ 
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar créditos:', updateError);
        throw new Error('Erro ao adicionar créditos');
      }

      // Registrar transação
      const { error: transactionError } = await supabaseClient
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: credits,
          type: 'purchase',
          description: `Compra de ${credits} créditos via PIX - ID: ${paymentId}`,
        });

      if (transactionError) {
        console.error('Erro ao registrar transação:', transactionError);
      }

      console.log('Créditos adicionados com sucesso!');
    }

    return new Response(
      JSON.stringify({
        status: responseData.data.status,
        expiresAt: responseData.data.expiresAt,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro em check-pix-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
