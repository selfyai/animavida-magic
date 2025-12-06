import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  imageData: z.string().min(100, 'Image data is required and must be valid'),
  voiceId: z.string().min(1, 'Voice ID is required'),
  text: z.string().min(1, 'Text is required').max(1000, 'Text must be less than 1000 characters'),
  ideaCategory: z.string().optional(),
  ideaSource: z.string().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageData, voiceId, text, ideaCategory, ideaSource } = requestSchema.parse(body);
    
    console.log("Starting video generation with voice:", voiceId);
    console.log("Text length:", text?.length, "characters");

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

    console.log("Authenticated user:", user.id);

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    if (!profile || profile.credits < 1) {
      throw new Error("Créditos insuficientes. Por favor, compre mais créditos para continuar.");
    }

    console.log("User has credits:", profile.credits);

    // Deduct credit BEFORE processing
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`Failed to deduct credit: ${updateError.message}`);
    }

    // Log transaction
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -1,
        type: "usage",
        description: "Geração de vídeo"
      });

    if (transactionError) {
      console.error("Failed to log transaction:", transactionError);
    }

    console.log("Credit deducted successfully. Remaining credits:", profile.credits - 1);

    const LEMONSLICE_API_KEY = Deno.env.get("LEMONSLICE_API_KEY");
    if (!LEMONSLICE_API_KEY) {
      throw new Error("LEMONSLICE_API_KEY not configured");
    }
    console.log("API Key configured:", LEMONSLICE_API_KEY.substring(0, 10) + "...");

    // Convert base64 to blob and upload to storage
    console.log("Uploading image to storage...");
    const base64Data = imageData.split(",")[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `${Date.now()}-${crypto.randomUUID()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("video-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from("video-images")
      .getPublicUrl(fileName);

    console.log("Image uploaded successfully:", publicUrl);

    // Call LemonSlice API to generate video
    console.log("Calling LemonSlice API to generate video...");
    const requestPayload = {
      img_url: publicUrl,
      voice_id: voiceId,
      text: text,
      model: "V2.5",
      resolution: "512",
      animation_style: "autoselect",
      expressiveness: 1.0,
    };
    console.log("Request payload:", JSON.stringify(requestPayload));
    
    const generateResponse = await fetch("https://lemonslice.com/api/v2/generate", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${LEMONSLICE_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("LemonSlice generate error:", errorText);
      console.error("Response status:", generateResponse.status);
      throw new Error(`LemonSlice API error: ${generateResponse.status} - ${errorText}`);
    }

    const generateData = await generateResponse.json();
    console.log("Generate response data:", JSON.stringify(generateData));
    const jobId = generateData.job_id;
    
    if (!jobId) {
      console.error("No job_id in response:", generateData);
      throw new Error("No job_id returned from LemonSlice API");
    }
    
    console.log("Video generation started, job_id:", jobId);

    // Create a pending video record in the database
    const { data: videoData, error: videoError } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        video_url: "", // Will be updated when video is ready
        text: text,
        voice_id: voiceId,
        job_id: jobId,
        status: "processing",
        idea_category: ideaCategory,
        idea_source: ideaSource
      })
      .select()
      .single();

    if (videoError) {
      console.error("Failed to create video record:", videoError);
    }

    console.log("Video record created with id:", videoData?.id);

    // Return immediately with job_id - no polling in edge function
    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId,
        videoId: videoData?.id,
        status: "processing",
        message: "Vídeo sendo gerado. Acompanhe o progresso."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-video function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: error instanceof z.ZodError ? 400 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
