import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const requestSchema = z.object({
  success: z.boolean(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get IP from request headers (server-side detection)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';
    
    // Validate request body
    const body = await req.json();
    const { success } = requestSchema.parse(body);
    
    if (!ip || ip === 'unknown') {
      console.warn('Could not determine IP address from headers, using unknown');
      // Log anyway but with unknown IP
    }

    console.log('Logging signup attempt for IP:', ip, 'Success:', success)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error: logError } = await supabase
      .rpc('log_signup_attempt', { attempt_ip: ip, was_success: success })

    if (logError) {
      console.error('Error logging signup attempt:', logError)
      return new Response(
        JSON.stringify({ error: logError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: error instanceof z.ZodError ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})