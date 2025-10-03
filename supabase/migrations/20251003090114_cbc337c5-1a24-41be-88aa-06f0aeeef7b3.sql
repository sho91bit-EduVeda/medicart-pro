-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create products table for medicines
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  uses text,
  side_effects text,
  composition text,
  original_price numeric NOT NULL CHECK (original_price >= 0),
  image_url text,
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create store settings table for discount configuration
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  updated_at timestamptz DEFAULT now()
);

-- Insert default store settings
INSERT INTO public.store_settings (discount_percentage) VALUES (10);

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Baby Products', 'Essential products for baby care and health'),
  ('Allergy', 'Medicines and products for allergy relief'),
  ('Cold & Flu', 'Treatment for cold, cough, and flu symptoms'),
  ('Antibiotics', 'Prescription antibiotics for bacterial infections'),
  ('Pain Relief', 'Pain management and relief medications'),
  ('Vitamins & Supplements', 'Daily vitamins and nutritional supplements'),
  ('Skin Care', 'Dermatological and skin care products'),
  ('Digestive Health', 'Products for digestive system health');

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for customers
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- Owner-only write access (will be restricted by auth in the app)
CREATE POLICY "Authenticated users can manage categories"
  ON public.categories FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage store settings"
  ON public.store_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();