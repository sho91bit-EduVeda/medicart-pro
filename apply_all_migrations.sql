-- ============================================================
-- CONSOLIDATED MIGRATION SCRIPT
-- Run this entire script in your PostgreSQL database
-- ============================================================

-- First, create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MIGRATION 1: E-Commerce Tables
-- ============================================================

-- Add new columns to products table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') THEN
    ALTER TABLE public.products ADD COLUMN brand text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'medicine_type') THEN
    ALTER TABLE public.products ADD COLUMN medicine_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'requires_prescription') THEN
    ALTER TABLE public.products ADD COLUMN requires_prescription boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiry_date') THEN
    ALTER TABLE public.products ADD COLUMN expiry_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
    ALTER TABLE public.products ADD COLUMN sku text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'manufacturer') THEN
    ALTER TABLE public.products ADD COLUMN manufacturer text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'average_rating') THEN
    ALTER TABLE public.products ADD COLUMN average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'review_count') THEN
    ALTER TABLE public.products ADD COLUMN review_count integer DEFAULT 0 CHECK (review_count >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
    ALTER TABLE public.products ADD COLUMN tags text[];
  END IF;
END $$;

-- Create shopping_cart table
CREATE TABLE IF NOT EXISTS public.shopping_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  discount_applied numeric DEFAULT 0 CHECK (discount_applied >= 0 AND discount_applied <= 100),
  delivery_address jsonb NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  subtotal numeric NOT NULL CHECK (subtotal >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user ON public.shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_product ON public.shopping_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- Enable RLS
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_cart
DROP POLICY IF EXISTS "Users can view own cart" ON public.shopping_cart;
CREATE POLICY "Users can view own cart" ON public.shopping_cart
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cart" ON public.shopping_cart;
CREATE POLICY "Users can manage own cart" ON public.shopping_cart
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for order_items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to generate order number
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- MIGRATION 2: Search Tracking Tables
-- ============================================================

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

-- Create whatsapp_settings table
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
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

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view search logs" ON public.search_logs;
CREATE POLICY "Anyone can view search logs"
  ON public.search_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert search logs" ON public.search_logs;
CREATE POLICY "Anyone can insert search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view unavailable medicines" ON public.unavailable_medicines;
CREATE POLICY "Anyone can view unavailable medicines"
  ON public.unavailable_medicines FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert unavailable medicines" ON public.unavailable_medicines;
CREATE POLICY "Anyone can insert unavailable medicines"
  ON public.unavailable_medicines FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update unavailable medicines" ON public.unavailable_medicines;
CREATE POLICY "Anyone can update unavailable medicines"
  ON public.unavailable_medicines FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can view whatsapp settings" ON public.whatsapp_settings;
CREATE POLICY "Anyone can view whatsapp settings"
  ON public.whatsapp_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert whatsapp settings" ON public.whatsapp_settings;
CREATE POLICY "Anyone can insert whatsapp settings"
  ON public.whatsapp_settings FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update whatsapp settings" ON public.whatsapp_settings;
CREATE POLICY "Anyone can update whatsapp settings"
  ON public.whatsapp_settings FOR UPDATE
  USING (true);

-- Insert default whatsapp settings
INSERT INTO public.whatsapp_settings (phone_number, api_key, webhook_url) 
VALUES ('+1234567890', 'your_api_key_here', 'https://your-webhook-url.com')
ON CONFLICT DO NOTHING;

-- Function to update unavailable medicine timestamp
CREATE OR REPLACE FUNCTION update_unavailable_medicine_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_searched_at = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_unavailable_medicine_timestamp_trigger ON public.unavailable_medicines;
CREATE TRIGGER update_unavailable_medicine_timestamp_trigger
  BEFORE UPDATE ON public.unavailable_medicines
  FOR EACH ROW
  EXECUTE FUNCTION update_unavailable_medicine_timestamp();

-- ============================================================
-- MIGRATION 3: Prescription Uploads
-- ============================================================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_user ON public.prescription_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_order ON public.prescription_uploads(order_id);
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_status ON public.prescription_uploads(status);

-- Enable RLS
ALTER TABLE public.prescription_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own prescriptions" ON public.prescription_uploads;
CREATE POLICY "Users can view own prescriptions" ON public.prescription_uploads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upload prescriptions" ON public.prescription_uploads;
CREATE POLICY "Users can upload prescriptions" ON public.prescription_uploads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger
DROP TRIGGER IF EXISTS update_prescription_uploads_updated_at ON public.prescription_uploads;
CREATE TRIGGER update_prescription_uploads_updated_at
  BEFORE UPDATE ON public.prescription_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- DONE! All migrations applied successfully
-- ============================================================
