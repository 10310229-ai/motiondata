# User Profile & Data Storage Setup Guide

## Overview
Motion Data Solutions now stores users, transaction orders, and user profiles in Supabase. This comprehensive guide explains the complete data structure and how to deploy it.

## Database Schema

### Tables Created

#### 1. **users** - Main user authentication and management
```sql
- id: BIGSERIAL PRIMARY KEY
- name: TEXT NOT NULL
- email: TEXT NOT NULL UNIQUE (indexed)
- phone: TEXT
- password_hash: TEXT NOT NULL
- role: TEXT DEFAULT 'customer' ('customer', 'admin', etc.)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### 2. **user_profiles** - Extended user information
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: BIGINT NOT NULL UNIQUE (foreign key to users.id)
- full_name: TEXT
- address: TEXT
- city: TEXT
- country: TEXT DEFAULT 'Ghana'
- postal_code: TEXT
- avatar_url: TEXT
- date_of_birth: DATE
- gender: TEXT
- preferred_network: TEXT (MTN, AirtelTigo, Telecel)
- metadata: JSONB (for additional custom fields)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### 3. **customers** - Customer information
```sql
- id: BIGSERIAL PRIMARY KEY
- full_name: TEXT NOT NULL
- email: TEXT NOT NULL UNIQUE (indexed)
- phone: TEXT NOT NULL
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### 4. **orders** - Order details
```sql
- id: BIGSERIAL PRIMARY KEY
- customer_id: BIGINT (foreign key to customers.id)
- network: TEXT NOT NULL (MTN, AirtelTigo, Telecel)
- package_name: TEXT NOT NULL
- phone_number: TEXT NOT NULL
- email: TEXT NOT NULL (indexed)
- amount: NUMERIC(10,2) NOT NULL
- status: TEXT DEFAULT 'pending' (indexed)
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

#### 5. **transactions** - Payment transactions
```sql
- id: BIGSERIAL PRIMARY KEY
- order_id: BIGINT (foreign key to orders.id)
- reference: TEXT NOT NULL UNIQUE (indexed)
- amount: NUMERIC(10,2) NOT NULL
- status: TEXT NOT NULL
- payment_method: TEXT DEFAULT 'paystack'
- metadata: JSONB
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```

## Deployment Steps

### Step 1: Run the SQL Schema in Supabase

1. **Access Supabase SQL Editor:**
   - Go to https://njsjihfpggbpfdpdgzzx.supabase.co
   - Navigate to **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Execute the Schema:**
   - Copy the entire contents of `server/supabase-schema.sql`
   - Paste into the SQL Editor
   - Click **Run** to execute

3. **Verify Tables Created:**
   - Go to **Table Editor** in Supabase
   - You should see 5 tables:
     - users
     - user_profiles
     - customers
     - orders
     - transactions

### Step 2: Verify Row Level Security (RLS)

The schema automatically enables RLS on all tables with policies that allow:
- Read access for all users
- Insert access for all users
- Update access for all users

These policies are suitable for development. For production, you may want to restrict access based on authenticated users.

### Step 3: Test the Integration

#### Test Order Flow:
1. Go to any order page (order-mtn.html, order-airtel.html, or order-telecel.html)
2. Fill out the form with test data:
   - Phone: 0241234567
   - Email: test@example.com
   - Package: Select any package
3. Complete the payment
4. Check Supabase Table Editor:
   - **users table**: Should have a new user entry
   - **customers table**: Should have a new customer entry
   - **orders table**: Should have the order details
   - **transactions table**: Should have the transaction record

## How Data is Saved

### Order Flow
When a customer places an order, the system:

1. **User Creation/Lookup:**
   - Checks if user exists by email using `getUserByEmail()`
   - If not exists, creates new user with `saveUser()`
   - For guest users, temporary password hash is created

2. **Customer Record:**
   - Saves/updates customer information with `saveCustomer()`

3. **Order Record:**
   - Creates order linked to customer with `saveOrder()`

4. **Transaction Record:**
   - Saves payment transaction with `saveTransaction()`

### JavaScript Functions Available

#### User Management
```javascript
// Save a new user
await saveUser({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '233241234567',
  password_hash: 'hashed_password',
  role: 'customer'
});

// Get user by email
const user = await getUserByEmail('john@example.com');

// Save user profile
await saveUserProfile({
  user_id: 123,
  full_name: 'John Doe',
  address: '123 Main St',
  city: 'Accra',
  country: 'Ghana',
  preferred_network: 'MTN'
});

// Update user profile
await updateUserProfile(userId, {
  full_name: 'John Updated',
  city: 'Kumasi'
});

// Get user profile
const profile = await getUserProfile(userId);
```

#### Customer Management
```javascript
// Save customer
await saveCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '233241234567'
});
```

#### Order Management
```javascript
// Save order
await saveOrder({
  customer_id: 123,
  network: 'MTN',
  package: '5GB',
  phone: '233241234567',
  email: 'john@example.com',
  amount: 26.00,
  status: 'completed'
});

// Update order status
await updateOrderStatus(orderId, 'completed');

// Get all orders
const orders = await getAllOrders();

// Get user's orders
const userOrders = await getUserOrders('john@example.com');
```

#### Transaction Management
```javascript
// Save transaction
await saveTransaction({
  order_id: 456,
  reference: 'MTN-1234567890',
  amount: 26.00,
  status: 'success',
  payment_method: 'paystack',
  metadata: { /* additional data */ }
});
```

## Files Modified

### Schema & Documentation
- `server/supabase-schema.sql` - Updated with users and user_profiles tables

### JavaScript Functions
- `assets/js/supabase.js` - Added user and profile management functions

### Order Forms
- `js/order-mtn.js` - Updated to save user data
- `js/order-airtel.js` - Updated to save user data
- `js/order-telecel.js` - Updated to save user data

## Features

### Automatic User Creation
- When a customer places an order, a user account is automatically created
- Email is used as the unique identifier
- Temporary password hash is created for guest users
- Users can later upgrade their account with proper authentication

### Data Relationships
- Users have one-to-one relationship with user_profiles
- Customers can have multiple orders
- Orders can have multiple transactions
- All relationships use foreign keys for data integrity

### Auto-Update Timestamps
- All tables have `created_at` and `updated_at` fields
- Triggers automatically update `updated_at` when records change

### Indexes for Performance
- Email fields are indexed on users and customers tables
- Foreign keys are indexed on user_profiles, orders, and transactions
- Status and reference fields are indexed for quick lookups

## Security Considerations

### Current Setup (Development)
- RLS is enabled on all tables
- Policies allow read/insert/update for all users
- Suitable for development and testing

### Production Recommendations
1. **Implement Proper Authentication:**
   - Use Supabase Auth for user authentication
   - Store hashed passwords securely (use bcrypt or similar)

2. **Update RLS Policies:**
   - Restrict reads to authenticated users only
   - Allow users to only update their own data
   - Add admin-only policies for sensitive operations

3. **Example Production RLS Policy:**
```sql
-- Only allow users to read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

## Next Steps

1. **Test the Integration:**
   - Place test orders on all three networks
   - Verify data appears in Supabase tables
   - Check data relationships are correct

2. **Admin Dashboard:**
   - The admin dashboard (`admin.html`) already pulls from Supabase
   - Test viewing users, orders, and transactions

3. **Implement User Authentication:**
   - Add login/registration forms
   - Implement proper password hashing
   - Use Supabase Auth or custom authentication

4. **Create User Profile Page:**
   - Allow users to view and edit their profiles
   - Show order history
   - Update preferred network and other preferences

## Troubleshooting

### Issue: Tables not created
- Verify you ran the SQL in the correct Supabase project
- Check for error messages in SQL Editor
- Ensure you have proper permissions

### Issue: Foreign key violations
- Make sure parent records exist before creating child records
- Check that IDs match correctly

### Issue: Data not saving
- Check browser console for JavaScript errors
- Verify Supabase credentials are correct
- Check network tab for API call failures

### Issue: RLS blocking inserts
- Verify RLS policies are created correctly
- Check if you need to authenticate first
- Temporarily disable RLS for testing (not recommended for production)

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Review Supabase logs in the dashboard
3. Verify all files are properly deployed
4. Contact support at kwakumotion55@gmail.com

---

**Last Updated:** December 15, 2025
**Version:** 1.0.0
