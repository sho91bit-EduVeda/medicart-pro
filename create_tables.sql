-- SQL to create WhatsApp settings table
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  api_key text NOT NULL,
  webhook_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create search_logs table
CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text NOT NULL,
  search_timestamp timestamptz DEFAULT now(),
  results_count integer DEFAULT 0,
  user_ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create unavailable_medicines table
CREATE TABLE IF NOT EXISTS public.unavailable_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name text NOT NULL,
  search_count integer DEFAULT 1,
  first_searched_at timestamptz DEFAULT now(),
  last_searched_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unavailable_medicines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Anyone can view whatsapp settings"
  ON public.whatsapp_settings FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert whatsapp settings"
  ON public.whatsapp_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can update whatsapp settings"
  ON public.whatsapp_settings FOR UPDATE
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can view search logs"
  ON public.search_logs FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can view unavailable medicines"
  ON public.unavailable_medicines FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert unavailable medicines"
  ON public.unavailable_medicines FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can update unavailable medicines"
  ON public.unavailable_medicines FOR UPDATE
  USING (true);

-- Insert default whatsapp settings
INSERT INTO public.whatsapp_settings (phone_number, api_key, webhook_url) 
VALUES ('+1234567890', 'test_api_key', 'https://your-webhook-url.com')
ON CONFLICT DO NOTHING;
