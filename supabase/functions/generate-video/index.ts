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

    if (!imageData || !voiceId || !text) {
      throw new Error("Missing required parameters: imageData, voiceId, or text");
    }

    const LEMONSLICE_API_KEY = Deno.env.get("LEMONSLICE_API_KEY");
    if (!LEMONSLICE_API_KEY) {
      throw new Error("LEMONSLICE_API_KEY not configured");
    }

    // Initialize Supabase client for storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const generateResponse = await fetch("https://lemonslice.com/api/v2/generate", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${LEMONSLICE_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        img_url: publicUrl,
        voice_id: voiceId,
        text: text,
        model: "V2.5",
        resolution: "512",
        animation_style: "entire_image",
        expressiveness: 1,
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("LemonSlice generate error:", errorText);
      throw new Error(`LemonSlice API error: ${generateResponse.status} - ${errorText}`);
    }

    const generateData = await generateResponse.json();
    const jobId = generateData.job_id;
    console.log("Video generation started, job_id:", jobId);

    // Poll for video completion
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 3 seconds = 3 minutes max

    while (attempts < maxAttempts) {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts}...`);
      
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

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
        console.error("Status check error:", errorText);
        throw new Error(`Failed to check status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log("Status:", statusData.status);

      if (statusData.status === "done") {
        videoUrl = statusData.video_url;
        console.log("Video ready:", videoUrl);
        break;
      } else if (statusData.status === "failed") {
        throw new Error("Video generation failed");
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error("Video generation timed out after 3 minutes");
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
