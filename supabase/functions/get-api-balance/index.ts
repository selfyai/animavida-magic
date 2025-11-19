import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Invalid authentication token");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    console.log("Admin user authenticated:", user.id);

    // Get API key
    const LEMONSLICE_API_KEY = Deno.env.get("LEMONSLICE_API_KEY");
    if (!LEMONSLICE_API_KEY) {
      throw new Error("LEMONSLICE_API_KEY not configured");
    }

    // Call LemonSlice API to get balance
    console.log("Fetching API balance...");
    const balanceResponse = await fetch("https://api.lemonslice.ai/v1/balance", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${LEMONSLICE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      console.error("Balance API error:", errorText);
      throw new Error(`Failed to fetch balance: ${balanceResponse.status}`);
    }

    const balanceData = await balanceResponse.json();
    console.log("Balance data received:", balanceData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        balance: balanceData.balance || 0,
        currency: "USD"
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in get-api-balance:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
