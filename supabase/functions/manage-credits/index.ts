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

    // Verificar se o usuário é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se é admin
    const { data: adminCheck } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminCheck) {
      throw new Error('Acesso negado. Apenas administradores podem gerenciar créditos.');
    }

    const { targetUserId, amount, type, description } = await req.json();

    if (!targetUserId || !amount || !type) {
      throw new Error('Dados incompletos');
    }

    console.log('Admin gerenciando créditos:', { targetUserId, amount, type });

    // Buscar créditos atuais
    const { data: currentProfile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', targetUserId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar perfil:', fetchError);
      throw new Error('Erro ao buscar perfil');
    }

    // Calcular novos créditos
    const newCredits = type === 'add' 
      ? currentProfile.credits + amount 
      : Math.max(0, currentProfile.credits - amount);

    // Atualizar créditos
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Erro ao atualizar créditos:', updateError);
      throw new Error('Erro ao atualizar créditos');
    }

    // Registrar transação
    const transactionType = type === 'add' ? 'admin_add' : 'admin_remove';
    const { error: transactionError } = await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: targetUserId,
        amount: type === 'add' ? amount : -amount,
        type: transactionType,
        description: description || `${type === 'add' ? 'Adição' : 'Remoção'} manual de créditos por admin`,
      });

    if (transactionError) {
      console.error('Erro ao registrar transação:', transactionError);
    }

    // Buscar saldo atualizado
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', targetUserId)
      .single();

    console.log('Créditos atualizados com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        newBalance: profile?.credits || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro em manage-credits:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
