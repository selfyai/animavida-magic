-- Create scheduled_notifications table
CREATE TABLE public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  is_sent BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage scheduled notifications
CREATE POLICY "Admins can manage scheduled notifications"
ON public.scheduled_notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for efficient queries
CREATE INDEX idx_scheduled_notifications_pending 
ON public.scheduled_notifications(scheduled_at, is_sent)
WHERE is_sent = FALSE;