-- Create search_logs table to track customer searches
CREATE TABLE public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text NOT NULL,
  search_timestamp timestamptz DEFAULT now(),
  results_count integer DEFAULT 0,
  user_ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create unavailable_medicines table to track medicines not found
CREATE TABLE public.unavailable_medicines (
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

-- Create whatsapp_settings table for notification configuration
CREATE TABLE public.whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  api_key text NOT NULL,
  webhook_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unavailable_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for search logs (for analytics)
CREATE POLICY "Anyone can view search logs"
  ON public.search_logs FOR SELECT
  USING (true);

-- Public insert access for search logs
CREATE POLICY "Anyone can insert search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (true);

-- Owner access for unavailable medicines
CREATE POLICY "Anyone can view unavailable medicines"
  ON public.unavailable_medicines FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert unavailable medicines"
  ON public.unavailable_medicines FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update unavailable medicines"
  ON public.unavailable_medicines FOR UPDATE
  USING (true);

-- Owner access for whatsapp settings
CREATE POLICY "Anyone can view whatsapp settings"
  ON public.whatsapp_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert whatsapp settings"
  ON public.whatsapp_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update whatsapp settings"
  ON public.whatsapp_settings FOR UPDATE
  USING (true);

-- Insert default whatsapp settings (placeholder values)
INSERT INTO public.whatsapp_settings (phone_number, api_key, webhook_url) 
VALUES ('+1234567890', 'your_api_key_here', 'https://your-webhook-url.com');

-- Create function to update last_searched_at timestamp
CREATE OR REPLACE FUNCTION update_unavailable_medicine_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_searched_at = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
CREATE TRIGGER update_unavailable_medicine_timestamp_trigger
  BEFORE UPDATE ON public.unavailable_medicines
  FOR EACH ROW
  EXECUTE FUNCTION update_unavailable_medicine_timestamp();
