-- Motion Data Solutions Pre-Launch Setup
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security on auth.users (should already be enabled)
-- This ensures user data is properly protected

-- Create a public profile table for additional user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE,
    is_waitlist_member BOOLEAN DEFAULT TRUE,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.user_profiles(id)
);

-- Enable Row Level Security on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create policy: New users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, phone, email_verified)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone',
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a waitlist_notifications table for tracking launch notifications
CREATE TABLE IF NOT EXISTS public.waitlist_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on waitlist_notifications
ALTER TABLE public.waitlist_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.waitlist_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_joined_at ON public.user_profiles(joined_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_notifications_user_id ON public.waitlist_notifications(user_id);

-- Update existing orders table RLS policies if it exists
-- This will allow authenticated users to view their own orders

-- First, check if orders table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
        DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
        DROP POLICY IF EXISTS "Allow anonymous read access" ON public.orders;
        
        -- Create policy: Allow anonymous read access (for now, until we add user authentication to orders)
        CREATE POLICY "Allow anonymous read access"
        ON public.orders
        FOR SELECT
        USING (true);
        
        -- Create policy: Allow authenticated users to view orders with their email
        CREATE POLICY "Users can view own orders"
        ON public.orders
        FOR SELECT
        USING (auth.jwt()->>'email' = email);
        
        -- Create policy for admin (full access to all orders)
        CREATE POLICY "Admin can view all orders"
        ON public.orders
        FOR ALL
        USING (auth.jwt()->>'email' = 'kwakumotion55@gmail.com');
    END IF;
END $$;

-- Create a view for waitlist statistics (admin only)
CREATE OR REPLACE VIEW public.waitlist_stats AS
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN email_verified THEN 1 END) as verified_members,
    COUNT(CASE WHEN referred_by IS NOT NULL THEN 1 END) as referred_members,
    DATE_TRUNC('day', joined_at) as join_date,
    COUNT(*) as daily_signups
FROM public.user_profiles
GROUP BY DATE_TRUNC('day', joined_at)
ORDER BY join_date DESC;

-- Grant access to the view for authenticated users with admin email
CREATE POLICY "Admin can view waitlist stats"
ON public.user_profiles
FOR SELECT
USING (
    auth.jwt()->>'email' = 'kwakumotion55@gmail.com'
);

-- Insert a test notification function (optional)
CREATE OR REPLACE FUNCTION public.send_launch_notification()
RETURNS void AS $$
BEGIN
    INSERT INTO public.waitlist_notifications (user_id, notification_type)
    SELECT id, 'launch_announcement'
    FROM public.user_profiles
    WHERE is_waitlist_member = TRUE
    AND email_verified = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Motion Data Solutions pre-launch database setup completed successfully!';
    RAISE NOTICE 'Tables created: user_profiles, waitlist_notifications';
    RAISE NOTICE 'Row Level Security enabled and policies configured';
    RAISE NOTICE 'Automatic profile creation trigger installed';
END $$;
