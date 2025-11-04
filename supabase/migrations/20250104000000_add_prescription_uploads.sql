-- Create prescription_uploads table
CREATE TABLE IF NOT EXISTS public.prescription_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  file_type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_user ON public.prescription_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_order ON public.prescription_uploads(order_id);
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_status ON public.prescription_uploads(status);

-- Enable RLS
ALTER TABLE public.prescription_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescription_uploads
CREATE POLICY "Users can view own prescriptions" ON public.prescription_uploads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload prescriptions" ON public.prescription_uploads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all prescriptions" ON public.prescription_uploads
  FOR ALL TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- Trigger for updated_at
CREATE TRIGGER update_prescription_uploads_updated_at
  BEFORE UPDATE ON public.prescription_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
