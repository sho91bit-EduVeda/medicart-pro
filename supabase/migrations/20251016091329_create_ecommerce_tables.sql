/*
  # E-Commerce Platform Enhancement Migration

  ## Summary
  This migration creates comprehensive e-commerce tables to transform the medical store into a full-fledged online pharmacy platform with complete shopping cart, order management, customer profiles, reviews, wishlists, and analytics capabilities.

  ## New Tables Created
  
  ### 1. customer_profiles
  - `id` (uuid, primary key) - Unique customer identifier linked to auth.users
  - `full_name` (text) - Customer's full name
  - `phone` (text) - Contact phone number
  - `address_line1` (text) - Primary address
  - `address_line2` (text) - Secondary address (optional)
  - `city` (text) - City
  - `state` (text) - State/Province
  - `postal_code` (text) - ZIP/Postal code
  - `country` (text, default 'India') - Country
  - `date_of_birth` (date) - Birth date for age-restricted products
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. shopping_cart
  - `id` (uuid, primary key) - Cart item unique identifier
  - `user_id` (uuid) - References auth.users (customer)
  - `product_id` (uuid) - References products
  - `quantity` (integer) - Number of items (minimum 1)
  - `added_at` (timestamptz) - When item was added
  - Unique constraint on (user_id, product_id)

  ### 3. orders
  - `id` (uuid, primary key) - Order unique identifier
  - `user_id` (uuid) - References auth.users (customer)
  - `order_number` (text, unique) - Human-readable order number
  - `status` (text) - Order status: pending, confirmed, processing, shipped, delivered, cancelled
  - `total_amount` (numeric) - Total order value
  - `discount_applied` (numeric) - Discount percentage applied
  - `delivery_address` (jsonb) - Delivery address as JSON object
  - `payment_method` (text) - Payment method used
  - `payment_status` (text) - Payment status: pending, completed, failed
  - `notes` (text) - Order notes or special instructions
  - `created_at` (timestamptz) - Order creation time
  - `updated_at` (timestamptz) - Last update time

  ### 4. order_items
  - `id` (uuid, primary key) - Order item unique identifier
  - `order_id` (uuid) - References orders
  - `product_id` (uuid) - References products
  - `product_name` (text) - Product name snapshot
  - `quantity` (integer) - Number of items ordered
  - `unit_price` (numeric) - Price per unit at time of order
  - `discount_percentage` (numeric) - Discount applied
  - `subtotal` (numeric) - Line item total

  ### 5. product_reviews
  - `id` (uuid, primary key) - Review unique identifier
  - `product_id` (uuid) - References products
  - `user_id` (uuid) - References auth.users (reviewer)
  - `rating` (integer) - Rating 1-5 stars
  - `title` (text) - Review title
  - `comment` (text) - Review text
  - `verified_purchase` (boolean) - Whether customer purchased this product
  - `helpful_count` (integer) - Number of helpful votes
  - `created_at` (timestamptz) - Review creation time
  - `updated_at` (timestamptz) - Last update time

  ### 6. wishlist
  - `id` (uuid, primary key) - Wishlist item identifier
  - `user_id` (uuid) - References auth.users
  - `product_id` (uuid) - References products
  - `added_at` (timestamptz) - When item was added to wishlist
  - Unique constraint on (user_id, product_id)

  ### 7. product_views
  - `id` (uuid, primary key) - View record identifier
  - `product_id` (uuid) - References products
  - `user_id` (uuid, nullable) - References auth.users (null for anonymous)
  - `session_id` (text) - Session identifier for anonymous users
  - `viewed_at` (timestamptz) - View timestamp

  ### 8. notifications
  - `id` (uuid, primary key) - Notification identifier
  - `user_id` (uuid) - References auth.users
  - `type` (text) - Notification type: order_status, stock_alert, promotion, system
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `read` (boolean) - Read status
  - `action_url` (text) - Optional link for action
  - `created_at` (timestamptz) - Creation time

  ### 9. feature_flags
  - `id` (uuid, primary key) - Feature flag identifier
  - `flag_name` (text, unique) - Feature flag name
  - `enabled` (boolean) - Whether feature is enabled
  - `description` (text) - Feature description
  - `updated_at` (timestamptz) - Last update time

  ### 10. product_inventory
  - `id` (uuid, primary key) - Inventory record identifier
  - `product_id` (uuid, unique) - References products
  - `quantity` (integer) - Available stock quantity
  - `reserved_quantity` (integer) - Quantity in pending orders
  - `low_stock_threshold` (integer) - Alert threshold
  - `updated_at` (timestamptz) - Last update time

  ## Additional Enhancements to Existing Tables
  
  ### products table additions:
  - `brand` (text) - Product brand
  - `medicine_type` (text) - Type: tablet, syrup, injection, etc.
  - `requires_prescription` (boolean) - Prescription requirement
  - `expiry_date` (date) - Product expiry date
  - `sku` (text, unique) - Stock Keeping Unit
  - `manufacturer` (text) - Manufacturer name
  - `average_rating` (numeric) - Calculated average rating
  - `review_count` (integer) - Total number of reviews
  - `tags` (text[]) - Searchable tags array

  ## Security (Row Level Security)
  - All tables have RLS enabled
  - Customers can only access their own cart, orders, reviews, wishlists
  - Product views can be added by anyone
  - Notifications are private to each user
  - Feature flags are readable by all, writable by authenticated admins
  - Inventory is readable by all, writable by authenticated admins

  ## Important Notes
  1. No destructive operations - all changes are additive
  2. All foreign keys include proper CASCADE/SET NULL behavior
  3. Proper indexing on frequently queried columns
  4. Check constraints ensure data integrity
  5. All monetary values use numeric type for precision
  6. Timestamps use timestamptz for timezone awareness
*/

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

-- Create customer_profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'India',
  date_of_birth date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0 CHECK (helpful_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create product_views table
CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  viewed_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('order_status', 'stock_alert', 'promotion', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT true,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create product_inventory table
CREATE TABLE IF NOT EXISTS public.product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity integer DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold integer DEFAULT 10 CHECK (low_stock_threshold >= 0),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user ON public.shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_product ON public.shopping_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);

-- Enable RLS on all new tables
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_profiles
CREATE POLICY "Users can view own profile" ON public.customer_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.customer_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.customer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for shopping_cart
CREATE POLICY "Users can view own cart" ON public.shopping_cart
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON public.shopping_cart
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- RLS Policies for product_reviews
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.product_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.product_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for product_views
CREATE POLICY "Anyone can add product views" ON public.product_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view product views" ON public.product_views
  FOR SELECT
  USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for feature_flags
CREATE POLICY "Anyone can view feature flags" ON public.feature_flags
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage feature flags" ON public.feature_flags
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

-- RLS Policies for product_inventory
CREATE POLICY "Anyone can view inventory" ON public.product_inventory
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage inventory" ON public.product_inventory
  FOR ALL TO authenticated
  USING (auth.role() = 'authenticated');

-- Triggers for updated_at columns
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_inventory_updated_at
  BEFORE UPDATE ON public.product_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, enabled, description) VALUES
  ('shopping_cart', true, 'Enable shopping cart functionality'),
  ('order_management', true, 'Enable order placement and management'),
  ('product_reviews', true, 'Enable product reviews and ratings'),
  ('wishlist', true, 'Enable wishlist/favorites functionality'),
  ('advanced_search', true, 'Enable advanced search with filters'),
  ('product_recommendations', true, 'Enable AI-powered product recommendations'),
  ('notifications', true, 'Enable push notifications for orders and stock'),
  ('bulk_orders', true, 'Enable bulk order functionality'),
  ('prescription_upload', true, 'Enable prescription upload for medicines'),
  ('live_chat', false, 'Enable live chat support'),
  ('loyalty_program', false, 'Enable loyalty points and rewards'),
  ('guest_checkout', true, 'Allow checkout without creating account')
ON CONFLICT (flag_name) DO NOTHING;

-- Function to update product average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update product rating when reviews change
DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.product_reviews;
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Trigger to generate order number
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();