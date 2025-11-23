import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  notificationId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  body: z.string().min(1, 'Body is required').max(500, 'Body must be less than 500 characters'),
  tokens: z.array(z.string().min(1)).min(1, 'At least one token is required').max(1000, 'Maximum 1000 tokens allowed'),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { notificationId, title, body: messageBody, tokens } = requestSchema.parse(body);

    const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
    if (!firebaseServerKey) {
      console.error('FIREBASE_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Firebase not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending notification to ${tokens.length} devices`);

    // Send to FCM in batches (FCM allows up to 1000 tokens per request)
    const batchSize = 500;
    const results = [];
    
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);
      
      const fcmPayload = {
        registration_ids: batchTokens,
        notification: {
          title,
          body: messageBody,
          icon: '/icon-512x512.png',
          badge: '/favicon.png',
          click_action: '/',
        },
        data: {
          notificationId: notificationId || '',
          url: '/',
        },
        priority: 'high',
      };

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${firebaseServerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload),
      });

      // Check if response is OK and content-type is JSON
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`FCM API error (${response.status}):`, responseText);
        throw new Error(`FCM API returned ${response.status}: ${responseText.substring(0, 200)}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('FCM returned non-JSON response:', responseText.substring(0, 500));
        throw new Error('Firebase configuration error. Please check FIREBASE_SERVER_KEY.');
      }

      const result = await response.json();
      console.log(`Batch ${Math.floor(i / batchSize) + 1} result:`, result);
      results.push(result);

      // Check for invalid tokens and log them
      if (result.results) {
        result.results.forEach((res: any, index: number) => {
          if (res.error) {
            console.log(`Token ${batchTokens[index]} failed: ${res.error}`);
          }
        });
      }
    }

    const successCount = results.reduce((sum, r) => sum + (r.success || 0), 0);
    const failureCount = results.reduce((sum, r) => sum + (r.failure || 0), 0);

    console.log(`Notification sent - Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        successCount,
        failureCount,
        totalSent: tokens.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: error instanceof z.ZodError ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});