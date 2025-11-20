import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing scheduled notifications...');

    // Get notifications that should be sent now
    const now = new Date();
    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('is_sent', false)
      .lte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError);
      throw fetchError;
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('No scheduled notifications to send');
      return new Response(
        JSON.stringify({ message: 'No notifications to send', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledNotifications.length} notifications to send`);
    let processed = 0;
    let failed = 0;

    for (const notification of scheduledNotifications) {
      try {
        // Get target users based on platform
        let query = supabase
          .from('profiles')
          .select('id, push_token, platform');
        
        if (notification.target === 'android') {
          query = query.eq('platform', 'android');
        } else if (notification.target === 'ios') {
          query = query.eq('platform', 'ios');
        }
        
        const { data: targetUsers } = await query.not('push_token', 'is', null);
        
        if (!targetUsers || targetUsers.length === 0) {
          console.log(`No users found for notification ${notification.id}`);
          
          // Mark as sent anyway if no recurrence
          if (notification.recurrence === 'none') {
            await supabase
              .from('scheduled_notifications')
              .update({ is_sent: true, last_sent_at: now.toISOString() })
              .eq('id', notification.id);
          }
          continue;
        }

        const tokens = targetUsers.map(user => user.push_token).filter(Boolean) as string[];

        // Log in push_notifications table
        const { data: loggedNotification } = await supabase
          .from('push_notifications')
          .insert({
            title: notification.title,
            body: notification.body,
            target: notification.target,
            sent_count: tokens.length,
            created_by: notification.created_by,
          })
          .select()
          .single();

        // Send notification
        const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            notificationId: loggedNotification?.id,
            title: notification.title,
            body: notification.body,
            tokens,
          },
        });

        if (sendError) {
          console.error(`Error sending notification ${notification.id}:`, sendError);
          failed++;
          continue;
        }

        console.log(`Successfully sent notification ${notification.id} to ${tokens.length} users`);

        // Handle recurrence or mark as sent
        if (notification.recurrence === 'none') {
          await supabase
            .from('scheduled_notifications')
            .update({ is_sent: true, last_sent_at: now.toISOString() })
            .eq('id', notification.id);
        } else {
          // Calculate next scheduled time based on recurrence
          const nextScheduledAt = calculateNextScheduledTime(
            new Date(notification.scheduled_at),
            notification.recurrence
          );

          await supabase
            .from('scheduled_notifications')
            .update({ 
              scheduled_at: nextScheduledAt.toISOString(),
              last_sent_at: now.toISOString()
            })
            .eq('id', notification.id);
        }

        processed++;
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        failed++;
      }
    }

    console.log(`Processed ${processed} notifications, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Processing complete',
        processed,
        failed,
        total: scheduledNotifications.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in process-scheduled-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function calculateNextScheduledTime(currentTime: Date, recurrence: string): Date {
  const next = new Date(currentTime);
  
  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  return next;
}
