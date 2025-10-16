/*
  # Initialize Base Database Schema

  ## Summary
  Creates the foundational tables for the medical e-commerce platform including categories, products, and store settings.

  ## Tables Created
  
  ### 1. categories
  - `id` (uuid, primary key)
  - `name` (text, unique) - Category name
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. products
  - `id` (uuid, primary key)
  - `name` (text) - Product name
  - `category_id` (uuid) - References categories
  - `description` (text) - Product description
  - `uses` (text) - Medical uses
  - `side_effects` (text) - Side effects information
  - `composition` (text) - Chemical composition
  - `original_price` (numeric) - Base price
  - `image_url` (text) - Product image URL
  - `in_stock` (boolean) - Stock availability
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. store_settings
  - `id` (uuid, primary key)
  - `discount_percentage` (numeric) - Global discount percentage
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Public read access for products, categories, and settings
  - Authenticated users can manage data
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
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

-- Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  updated_at timestamptz DEFAULT now()
);

-- Insert default store settings if not exists
INSERT INTO public.store_settings (discount_percentage)
SELECT 10
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- Insert default categories if not exists
INSERT INTO public.categories (name, description)
SELECT * FROM (VALUES
  ('Baby Products', 'Essential products for baby care and health'),
  ('Allergy', 'Medicines and products for allergy relief'),
  ('Cold & Flu', 'Treatment for cold, cough, and flu symptoms'),
  ('Antibiotics', 'Prescription antibiotics for bacterial infections'),
  ('Pain Relief', 'Pain management and relief medications'),
  ('Vitamins & Supplements', 'Daily vitamins and nutritional supplements'),
  ('Skin Care', 'Dermatological and skin care products'),
  ('Digestive Health', 'Products for digestive system health')
) AS new_categories(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE categories.name = new_categories.name
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view store settings" ON public.store_settings
  FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage store settings" ON public.store_settings
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();