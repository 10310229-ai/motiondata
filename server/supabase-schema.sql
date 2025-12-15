-- Supabase Database Schema for Motion Data Solutions
-- Run this SQL in your Supabase SQL Editor

-- IMPORTANT: If you have existing tables with different structure, uncomment the DROP statements below
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (for authentication and user management)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'customer', -- 'customer', 'admin', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table (extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Ghana',
    postal_code TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT,
    preferred_network TEXT, -- MTN, AirtelTigo, Telecel
    metadata JSONB, -- For additional custom fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT,
    network TEXT NOT NULL,
    package_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT DEFAULT 'paystack',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints and indexes in single DO block
DO $$ 
BEGIN
    -- Add foreign key for user_profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'user_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_profiles_user'
        ) THEN
            ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key constraints only if columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_customer'
        ) THEN
            ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'order_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_order'
        ) THEN
            ALTER TABLE transactions ADD CONSTRAINT fk_transactions_order 
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Create indexes only if columns exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
            CREATE INDEX idx_users_email ON users(email);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_user_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id') THEN
            CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_email') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email') THEN
            CREATE INDEX idx_customers_email ON customers(email);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_customer_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
            CREATE INDEX idx_orders_customer_id ON orders(customer_id);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_email') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'email') THEN
            CREATE INDEX idx_orders_email ON orders(email);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
            CREATE INDEX idx_orders_status ON orders(status);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_order_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'order_id') THEN
            CREATE INDEX idx_transactions_order_id ON transactions(order_id);
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_reference') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'reference') THEN
            CREATE INDEX idx_transactions_reference ON transactions(reference);
        END IF;
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for all users" ON users;
    DROP POLICY IF EXISTS "Enable insert for all users" ON users;
    DROP POLICY IF EXISTS "Enable update for own user only" ON users;
END $$;

CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for own user only" ON users
    FOR UPDATE USING (true);

-- Create RLS policies for user_profiles
CREATE POLICY "Enable read access for all user_profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all user_profiles" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all user_profiles" ON user_profiles
    FOR UPDATE USING (true);

-- Create RLS policies for customers
CREATE POLICY "Enable read access for all users" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON customers
    FOR UPDATE USING (true);

-- Create RLS policies for orders
CREATE POLICY "Enable read access for all users" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON orders
    FOR UPDATE USING (true);

-- Create RLS policies for transactions
CREATE POLICY "Enable read access for all users" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON transactions
    FOR UPDATE USING (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
