import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  videoId: z.string().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { jobId, videoId } = requestSchema.parse(body);
    
    console.log("Checking status for job:", jobId);

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

    // First, check if video is already completed in database
    if (videoId) {
      const { data: existingVideo } = await supabase
        .from("generated_videos")
        .select("*")
        .eq("id", videoId)
        .eq("user_id", user.id)
        .single();

      if (existingVideo && existingVideo.status === "completed" && existingVideo.video_url) {
        console.log("Video already completed in database:", existingVideo.video_url);
        return new Response(
          JSON.stringify({
            success: true,
            status: "completed",
            videoUrl: existingVideo.video_url,
            videoId: existingVideo.id
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LEMONSLICE_API_KEY = Deno.env.get("LEMONSLICE_API_KEY");
    if (!LEMONSLICE_API_KEY) {
      throw new Error("LEMONSLICE_API_KEY not configured");
    }

    // Check status on LemonSlice API
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
      
      if (statusResponse.status === 404) {
        return new Response(
          JSON.stringify({
            success: true,
            status: "processing",
            message: "Vídeo ainda em processamento..."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Failed to check status: ${statusResponse.status} - ${errorText}`);
    }

    const statusData = await statusResponse.json();
    console.log("Status response:", JSON.stringify(statusData));

    if (statusData.status === "done" || statusData.status === "completed") {
      const videoUrl = statusData.video_url;
      
      if (!videoUrl) {
        console.error("Status is completed but no video_url found:", statusData);
        throw new Error("Video completed but no URL returned");
      }

      console.log("Video ready! URL:", videoUrl);

      // Update video record in database
      if (videoId) {
        const { error: updateError } = await supabase
          .from("generated_videos")
          .update({
            video_url: videoUrl,
            status: "completed"
          })
          .eq("id", videoId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Failed to update video record:", updateError);
        } else {
          console.log("Video record updated successfully");
        }

        // Update idea_clicks if from template
        const { data: videoRecord } = await supabase
          .from("generated_videos")
          .select("idea_source, idea_category")
          .eq("id", videoId)
          .single();

        if (videoRecord?.idea_source === "template" && videoRecord?.idea_category) {
          await supabase
            .from("idea_clicks")
            .update({ generated_video: true })
            .eq("user_id", user.id)
            .eq("idea_category", videoRecord.idea_category)
            .eq("generated_video", false)
            .order("clicked_at", { ascending: false })
            .limit(1);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "completed",
          videoUrl,
          videoId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (statusData.status === "failed" || statusData.status === "error") {
      const errorMsg = statusData.error || statusData.message || "Video generation failed";
      console.error("Generation failed:", errorMsg);
      
      // Update video record to failed status
      if (videoId) {
        await supabase
          .from("generated_videos")
          .update({ status: "failed" })
          .eq("id", videoId)
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          error: errorMsg
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Still processing
    return new Response(
      JSON.stringify({
        success: true,
        status: "processing",
        message: "Vídeo ainda em processamento..."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-video-status function:", error);
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
