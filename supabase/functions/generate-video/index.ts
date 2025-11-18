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
    const { imageData, voiceId, text } = await req.json();
    console.log("Starting video generation with voice:", voiceId);
    console.log("Text length:", text?.length, "characters");

    if (!imageData) {
      throw new Error("Missing required parameter: imageData");
    }
    if (!voiceId) {
      throw new Error("Missing required parameter: voiceId");
    }
    if (!text || text.trim().length === 0) {
      throw new Error("Missing required parameter: text (or text is empty)");
    }

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

    // Call LemonSlice API to generate video - seguindo documentação oficial
    console.log("Calling LemonSlice API to generate video...");
    const requestPayload = {
      img_url: publicUrl,
      voice_id: voiceId,
      text: text,
      model: "V2.5",
      resolution: "512",
      animation_style: "autoselect", // Mudado para autoselect conforme docs
      expressiveness: 1.0, // Garantir que é float
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
      console.error("Response headers:", JSON.stringify([...generateResponse.headers.entries()]));
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

    // Poll for video completion
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 180; // 180 attempts * 5 seconds = 15 minutes max
    const pollInterval = 5000; // 5 seconds between attempts

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}...`);
      
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `https://lemonslice.com/api/v2/generations/${jobId}`,
        {
          method: "GET",
          headers: {
            "authorization": `Bearer ${LEMONSLICE_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Status check error:", statusResponse.status, errorText);
        
        // Don't fail immediately on status check errors, just log and continue
        if (statusResponse.status === 404) {
          console.warn("Job not found yet, continuing to poll...");
          continue;
        }
        
        throw new Error(`Failed to check status: ${statusResponse.status} - ${errorText}`);
      }

      const statusData = await statusResponse.json();
      console.log("Full status response:", JSON.stringify(statusData));
      console.log("Status:", statusData.status);
      
      // Log qualquer erro ou mensagem da API
      if (statusData.error || statusData.message) {
        console.error("API Error or Message:", statusData.error || statusData.message);
      }

      // LemonSlice usa "done" ou "completed" como status de sucesso
      if (statusData.status === "done" || statusData.status === "completed") {
        videoUrl = statusData.video_url;
        console.log("Video ready! URL:", videoUrl);
        
        if (!videoUrl) {
          console.error("Status is completed but no video_url found:", statusData);
          throw new Error("Video completed but no URL returned");
        }
        break;
      } else if (statusData.status === "failed" || statusData.status === "error") {
        const errorMsg = statusData.error || statusData.message || "Video generation failed";
        console.error("Generation failed:", errorMsg);
        console.error("Full error data:", JSON.stringify(statusData));
        throw new Error(errorMsg);
      } else if (statusData.status === "pending" || statusData.status === "processing") {
        // Continua polling
        console.log("Video still processing, continuing to poll...");
      } else {
        // Status desconhecido
        console.warn("Unknown status:", statusData.status, "- continuing to poll");
      }
    }

    if (!videoUrl) {
      const timeoutMsg = `Video generation timed out after ${Math.floor((maxAttempts * pollInterval) / 60000)} minutes. Job ID: ${jobId}. This may indicate an issue with the LemonSlice API. Please check your API key and try again.`;
      console.error(timeoutMsg);
      throw new Error(timeoutMsg);
    }

    // Save video record to database
    const { error: videoError } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        video_url: videoUrl,
        text: text,
        voice_id: voiceId,
        job_id: jobId,
        status: "completed"
      });

    if (videoError) {
      console.error("Failed to save video record:", videoError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoUrl,
        jobId 
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
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
