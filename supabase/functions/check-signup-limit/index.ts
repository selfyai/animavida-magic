import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get IP from request headers (server-side detection)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';
    
    if (!ip || ip === 'unknown') {
      console.warn('Could not determine IP address from headers, using unknown');
      // Allow signup anyway but log the issue
    }

    console.log('Checking signup rate limit for IP:', ip)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if IP is allowed to sign up
    const { data: isAllowed, error: checkError } = await supabase
      .rpc('check_signup_rate_limit', { check_ip: ip })

    if (checkError) {
      console.error('Error checking rate limit:', checkError)
      return new Response(
        JSON.stringify({ allowed: false, error: checkError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('IP allowed to sign up:', isAllowed)

    return new Response(
      JSON.stringify({ allowed: isAllowed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ allowed: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})