-- Create payment settings history table for audit trail
CREATE TABLE public.payment_settings_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID NOT NULL,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_provider TEXT,
  metadata JSONB,
  CONSTRAINT fk_changed_by FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.payment_settings_history ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view history
CREATE POLICY "Admins can view payment settings history" 
ON public.payment_settings_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  )
);

-- Policy for admins to insert history records
CREATE POLICY "Admins can insert payment settings history" 
ON public.payment_settings_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  )
);

-- Create index for better performance
CREATE INDEX idx_payment_settings_history_created_at ON public.payment_settings_history(created_at DESC);
CREATE INDEX idx_payment_settings_history_changed_by ON public.payment_settings_history(changed_by);