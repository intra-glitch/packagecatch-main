-- =========================================================
-- Users and Auth Schema (from schema-users.sql)
-- =========================================================

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'USER'::text,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  landmark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public profiles are viewable by everyone.') THEN
        CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own profile.') THEN
        CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile.') THEN
        CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Create a trigger to automatically insert a user row when someone registers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, phone, address, landmark)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'fullName', 
    COALESCE(new.raw_user_meta_data->>'role', 'USER'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'landmark'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create the Avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Avatar images are publicly accessible.') THEN
        CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload avatars') THEN
        CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update avatars') THEN
        CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    END IF;
END $$;

-- =========================================================
-- Products and Orders Schema (from schema.sql)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category VARCHAR(100),
    tag VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    bg_color VARCHAR(20),
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    price_at_time_of_purchase DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Product Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Products are viewable by everyone') THEN
        CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Products are insertable by admins') THEN
        CREATE POLICY "Products are insertable by admins" ON public.products FOR INSERT WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Products are updateable by admins') THEN
        CREATE POLICY "Products are updateable by admins" ON public.products FOR UPDATE USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN');
    END IF;
END $$;

-- Order Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can insert their own orders') THEN
        CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
        CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can view all orders') THEN
        CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN');
    END IF;
END $$;

-- Order Items Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can view their own order items') THEN
        CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can insert order items to their orders') THEN
        CREATE POLICY "Users can insert order items to their orders" ON public.order_items FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
        );
    END IF;
END $$;

-- Reviews Policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews are viewable by everyone') THEN
        CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Authenticated users can insert reviews') THEN
        CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Insert Mock Data
INSERT INTO public.products (id, name, description, price, original_price, category, tag, stock_quantity, bg_color, image_url)
VALUES 
(1, 'Oversized Hoodie', 'Premium cotton blend oversized hoodie for maximum comfort and streetwear styling.', 299.00, 399.00, 'Tops', 'NEW', 15, '#f5f5f5', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop'),
(2, 'Floral Midi Dress', 'Elegant summer floral dress with a flattering midi length and lightweight fabric.', 459.00, 599.00, 'Dresses', 'BEST SELLER', 3, '#fff0f3', 'https://images.unsplash.com/photo-1572804013309-8c98e10f1309?w=600&h=600&fit=crop'),
(3, 'Cargo Pants', 'Durable utility cargo pants featuring multiple pockets and an adjustable waistband.', 389.00, 489.00, 'Bottoms', 'FLASH SALE', 8, '#f0f4ff', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop'),
(4, 'Bucket Hat', 'Classic canvas bucket hat perfect for sunny days and outdoor activities.', 149.00, 199.00, 'Accessories', 'NEW', 0, '#f5fff0', 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=600&h=600&fit=crop'),
(5, 'Crop Tank Top', 'Essential ribbed crop top ideal for layering or warm weather wear.', 199.00, 249.00, 'Tops', 'FLASH SALE', 2, '#fff8f0', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=600&fit=crop'),
(6, 'Pleated Skirt', 'Classic A-line pleated skirt made with wrinkle-resistant fabric.', 329.00, 399.00, 'Bottoms', 'NEW', 12, '#f8f0ff', 'https://images.unsplash.com/photo-1582142407894-ec85a1260a46?w=600&h=600&fit=crop'),
(7, 'Mini Sling Bag', 'Compact faux-leather sling bag designed to hold all your daily essentials.', 249.00, 299.00, 'Accessories', 'BEST SELLER', 5, '#f0fff8', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&h=600&fit=crop'),
(8, 'Wrap Dress', 'Versatile wrap dress that ties at the waist for a custom, figure-flattering fit.', 499.00, 599.00, 'Dresses', 'NEW', 1, '#fff0f8', 'https://images.unsplash.com/photo-1618932260643-eee4a2f65ca2?w=600&h=600&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to prevent insert errors later
SELECT setval('public.products_id_seq', (SELECT MAX(id) FROM public.products));
