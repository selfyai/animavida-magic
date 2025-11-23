import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized - invalid authentication');
    }

    // Validate request body
    const body = await requestSchema.parse(await req.json());

    console.log('Verificando pagamento:', body.paymentId, 'para usuário:', user.id);

    // Buscar configurações de pagamento
    const { data: paymentSettings, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_settings')
      .single();

    if (settingsError || !paymentSettings) {
      throw new Error('Configurações de pagamento não encontradas. Configure um provedor no painel admin.');
    }

    const settings = paymentSettings.value as any;
    const activeProvider = settings.activeProvider;
    
    if (!settings.providers[activeProvider]?.apiKey) {
      throw new Error(`Provedor ${activeProvider} não está configurado. Configure as credenciais no painel admin.`);
    }

    let responseData: any;

    // Processar de acordo com o provedor ativo
    if (activeProvider === 'abacatepay') {
      const abacatePayResponse = await fetch(
        `https://api.abacatepay.com/v1/pixQrCode/check?id=${body.paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${settings.providers.abacatepay.apiKey}`,
          },
        }
      );

      responseData = await abacatePayResponse.json();

      if (!abacatePayResponse.ok) {
        console.error('Erro ao verificar pagamento:', responseData);
        throw new Error('Erro ao verificar pagamento');
      }
    } else if (activeProvider === 'stripe') {
      throw new Error('Stripe ainda não implementado. Em breve!');
    } else if (activeProvider === 'mercadopago') {
      throw new Error('Mercado Pago ainda não implementado. Em breve!');
    } else {
      throw new Error(`Provedor ${activeProvider} não suportado`);
    }

    console.log('Status do pagamento:', responseData.data.status);

    // Se o pagamento foi confirmado, adicionar créditos
    if (responseData.data.status === 'PAID') {
      // Verify payment metadata matches authenticated user
      const paymentUserId = responseData.data.metadata?.userId;
      if (!paymentUserId || paymentUserId !== user.id) {
        console.error('Payment user mismatch:', { paymentUserId, authenticatedUserId: user.id });
        throw new Error('Este pagamento não pertence à sua conta');
      }

      const credits = parseInt(responseData.data.metadata?.credits || '0');
      
      if (credits <= 0) {
        throw new Error('Quantidade de créditos inválida no pagamento');
      }

      console.log('Pagamento confirmado! Adicionando créditos...', { credits, userId: user.id });

      // Use service role for database operations
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      // Adicionar créditos ao usuário
      const { data: currentProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar perfil:', fetchError);
        throw new Error('Erro ao buscar perfil');
      }

      const newCredits = currentProfile.credits + credits;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erro ao atualizar créditos:', updateError);
        throw new Error('Erro ao adicionar créditos');
      }

      // Registrar transação
      const { error: transactionError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: credits,
          type: 'purchase',
          description: `Compra de ${credits} créditos via PIX - ID: ${body.paymentId}`,
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
        status: error instanceof z.ZodError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});