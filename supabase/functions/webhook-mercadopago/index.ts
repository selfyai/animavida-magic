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
    const body = await req.json();
    
    console.log('Webhook Mercado Pago recebido:', JSON.stringify(body));

    // Mercado Pago envia notificações com diferentes tipos
    // Estamos interessados apenas em notificações de pagamento
    if (body.type !== 'payment') {
      console.log('Tipo de notificação ignorado:', body.type);
      return new Response(null, { status: 200 });
    }

    const paymentId = body.data?.id;
    
    if (!paymentId) {
      console.error('ID de pagamento não encontrado na notificação');
      return new Response(null, { status: 200 });
    }

    // Buscar configurações de pagamento
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: paymentSettings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_settings')
      .single();

    if (settingsError || !paymentSettings) {
      console.error('Erro ao buscar configurações de pagamento:', settingsError);
      return new Response(null, { status: 200 });
    }

    const settings = paymentSettings.value as any;
    const accessToken = settings.providers?.mercadopago?.apiKey;

    if (!accessToken) {
      console.error('Token de acesso do Mercado Pago não configurado');
      return new Response(null, { status: 200 });
    }

    // Buscar detalhes do pagamento
    const mercadoPagoResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!mercadoPagoResponse.ok) {
      console.error('Erro ao buscar pagamento no Mercado Pago');
      return new Response(null, { status: 200 });
    }

    const payment = await mercadoPagoResponse.json();

    console.log('Detalhes do pagamento:', {
      id: payment.id,
      status: payment.status,
      metadata: payment.metadata,
    });

    // Processar apenas pagamentos aprovados
    if (payment.status === 'approved') {
      const userId = payment.metadata?.user_id;
      const credits = parseInt(payment.metadata?.credits || '0');

      if (!userId || credits <= 0) {
        console.error('Metadados de pagamento inválidos:', payment.metadata);
        return new Response(null, { status: 200 });
      }

      console.log('Pagamento aprovado! Adicionando créditos...', { credits, userId });

      // Verificar se já processamos este pagamento
      const { data: existingTransaction } = await supabaseAdmin
        .from('credit_transactions')
        .select('id')
        .eq('description', `Compra de ${credits} créditos via PIX - ID: ${paymentId}`)
        .maybeSingle();

      if (existingTransaction) {
        console.log('Pagamento já processado anteriormente');
        return new Response(null, { status: 200 });
      }

      // Adicionar créditos ao usuário
      const { data: currentProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar perfil:', fetchError);
        return new Response(null, { status: 200 });
      }

      const newCredits = currentProfile.credits + credits;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar créditos:', updateError);
        return new Response(null, { status: 200 });
      }

      // Registrar transação com status 'paid'
      const { error: transactionError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: credits,
          type: 'purchase',
          description: `Compra de ${credits} créditos via PIX - ID: ${paymentId}`,
          payment_provider: 'mercadopago',
          payment_method: 'pix',
          status: 'paid',
        });

      if (transactionError) {
        console.error('Erro ao registrar transação:', transactionError);
        return new Response(null, { status: 200 });
      }

      console.log('Créditos adicionados com sucesso via webhook!');
    } else {
      console.log(`Pagamento com status ${payment.status} - não processado`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    // Sempre retornar 200 para não reprocessar o webhook
    return new Response(null, { status: 200 });
  }
});
