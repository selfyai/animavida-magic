import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const requestSchema = z.object({
  success: z.boolean(),
});

// Rate limiting em memória (por instância)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 10; // máx 10 requests por IP por minuto

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

  // Verificar método
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const { success } = requestSchema.parse(body);
    
    if (!ip || ip === 'unknown') {
      console.warn('Could not determine IP address from headers, using unknown');
    }

    console.log('Logging signup attempt for IP:', ip, 'Success:', success);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting adicional no banco - verificar tentativas recentes
    const { data: recentAttempts } = await supabase
      .from('signup_attempts')
      .select('id')
      .eq('ip_address', ip)
      .gte('attempted_at', new Date(Date.now() - 60000).toISOString());

    if (recentAttempts && recentAttempts.length >= 10) {
      console.warn('Database rate limit exceeded for IP:', ip);
      return new Response(
        JSON.stringify({ error: 'Too many signup attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: logError } = await supabase
      .rpc('log_signup_attempt', { attempt_ip: ip, was_success: success });

    if (logError) {
      console.error('Error logging signup attempt:', logError);
      return new Response(
        JSON.stringify({ error: logError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: error instanceof z.ZodError ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
