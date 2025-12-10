import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

// Domínios permitidos - apenas seu app
const allowedOrigins = [
  'https://uphlmknketudkycsfkah.lovable.app',
  'https://id-preview--b718a54d-f082-466b-b80f-bd96c612eaad.lovable.app',
  'https://b718a54d-f082-466b-b80f-bd96c612eaad.lovableproject.com',
  'https://selfyai.fun',
  'http://localhost:5173', // desenvolvimento local
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.lovable.app'));
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}

// Rate limiting em memória (por instância)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 15; // máx 15 requests por IP por minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP from request headers (server-side detection)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';
    
    // Rate limiting em memória
    if (!checkRateLimit(ip)) {
      console.warn('Rate limit exceeded for IP:', ip);
      return new Response(
        JSON.stringify({ allowed: false, error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!ip || ip === 'unknown') {
      console.warn('Could not determine IP address from headers, using unknown');
    }

    console.log('Checking signup rate limit for IP:', ip);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if IP is allowed to sign up
    const { data: isAllowed, error: checkError } = await supabase
      .rpc('check_signup_rate_limit', { check_ip: ip });

    if (checkError) {
      console.error('Error checking rate limit:', checkError);
      return new Response(
        JSON.stringify({ allowed: false, error: checkError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('IP allowed to sign up:', isAllowed);

    return new Response(
      JSON.stringify({ allowed: isAllowed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ allowed: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
