import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  credits: z.number().int('Credits must be an integer').min(5, 'Minimum 5 credits').max(1000, 'Maximum 1000 credits per purchase'),
});

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

    const body = await req.json();
    const { credits } = requestSchema.parse(body);

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

    // Buscar dados do perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name, cellphone, tax_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao buscar perfil do usuário');
    }

    const amount = credits * 100; // R$ 1,00 por crédito, em centavos
    const expiresIn = 3600; // 1 hora

    // Processar de acordo com o provedor ativo
    if (activeProvider === 'abacatepay') {
      return await createAbacatePayPayment(settings.providers.abacatepay.apiKey, amount, credits, expiresIn, profile, user.id);
    } else if (activeProvider === 'stripe') {
      throw new Error('Stripe ainda não implementado. Em breve!');
    } else if (activeProvider === 'mercadopago') {
      throw new Error('Mercado Pago ainda não implementado. Em breve!');
    } else {
      throw new Error(`Provedor ${activeProvider} não suportado`);
    }
  } catch (error) {
    console.error('Erro em create-pix-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: error instanceof z.ZodError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createAbacatePayPayment(
  apiKey: string,
  amount: number,
  credits: number,
  expiresIn: number,
  profile: any,
  userId: string
) {
    // Se não tiver telefone ou CPF, usar valores padrão válidos
    const cellphone = profile.cellphone || '(11) 91234-5678';
    const taxId = profile.tax_id || '111.444.777-35'; // CPF de teste válido

    console.log('Criando pagamento PIX:', { amount, credits, userId, hasPhone: !!profile.cellphone, hasTaxId: !!profile.tax_id });

    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        expiresIn,
        description: `Compra de ${credits} créditos`,
        customer: {
          name: profile.full_name || profile.email,
          email: profile.email,
          cellphone: cellphone,
          taxId: taxId,
        },
        metadata: {
          userId: userId,
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
}