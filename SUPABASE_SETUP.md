# Supabase Integration Guide

## Overview
Motion Data Solutions now uses Supabase for storing orders, customers, and transactions. This guide explains how to set up and use the Supabase integration.

## Setup Instructions

### 1. Run the SQL Schema

1. Go to your Supabase project: https://njsjihfpggbpfdpdgzzx.supabase.co
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `server/supabase-schema.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the SQL commands

This will create:
- `customers` table - stores customer information
- `orders` table - stores order details
- `transactions` table - stores payment transactions
- Indexes for better query performance
- Row Level Security (RLS) policies
- Auto-update triggers for `updated_at` fields

### 2. Verify Tables Created

After running the SQL:
1. Go to **Table Editor** in Supabase
2. You should see three new tables:
   - customers
   - orders
   - transactions

### 3. Test the Integration

The integration is already configured with your Supabase credentials. To test:

1. **Place a Test Order:**
   - Go to your website
   - Navigate to any order page (MTN, AirtelTigo, or Telecel)
   - Fill out the form and complete a test payment
   - The order will be automatically saved to Supabase

2. **View in Admin Dashboard:**
   - Go to `admin.html`
   - Login with: kwakumotion55@gmail.com / Motion@55
   - You should see your orders, customers, and transactions

## How It Works

### Order Flow

1. **Customer Places Order:**
   - User fills out order form
   - Paystack payment is processed
   - On success:
     - Customer data saved to `customers` table
     - Order saved to `orders` table
     - Transaction saved to `transactions` table
     - Backup saved to localStorage

2. **Admin Views Data:**
   - Admin dashboard loads data from Supabase
   - Falls back to localStorage if Supabase unavailable
   - Displays orders, customers, and transactions

### Files Involved

- `assets/js/supabase.js` - Core Supabase integration functions
- `assets/js/admin-supabase.js` - Admin dashboard Supabase integration
- `js/order-mtn.js` - MTN order with Supabase save
- `js/order-airtel.js` - AirtelTigo order with Supabase save
- `js/order-telecel.js` - Telecel order with Supabase save
- `server/supabase-schema.sql` - Database schema

## Database Schema

### Customers Table
```sql
- id: BIGSERIAL PRIMARY KEY
- full_name: TEXT NOT NULL
- email: TEXT NOT NULL UNIQUE
- phone: TEXT NOT NULL
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Orders Table
```sql
- id: BIGSERIAL PRIMARY KEY
- customer_id: BIGINT (references customers)
- network: TEXT NOT NULL (MTN, AirtelTigo, Telecel)
- package_name: TEXT NOT NULL
- phone_number: TEXT NOT NULL
- email: TEXT NOT NULL
- amount: NUMERIC(10,2) NOT NULL
- status: TEXT DEFAULT 'pending'
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Transactions Table
```sql
- id: BIGSERIAL PRIMARY KEY
- order_id: BIGINT (references orders)
- reference: TEXT NOT NULL UNIQUE (Paystack reference)
- amount: NUMERIC(10,2) NOT NULL
- status: TEXT NOT NULL
- payment_method: TEXT DEFAULT 'paystack'
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## API Functions

### Available Functions (in supabase.js)

- `saveCustomer(customerData)` - Save customer to database
- `saveOrder(orderData)` - Save order to database
- `saveTransaction(transactionData)` - Save transaction to database
- `updateOrderStatus(orderId, status)` - Update order status
- `getAllOrders()` - Fetch all orders
- `getAllCustomers()` - Fetch all customers
- `getAllTransactions()` - Fetch all transactions
- `getUserOrders(email)` - Fetch orders for specific user

## Fallback Mechanism

The system uses a dual-storage approach:
1. **Primary:** Supabase database (persistent, centralized)
2. **Backup:** localStorage (browser-based, local)

If Supabase is unavailable:
- Orders still save to localStorage
- Admin dashboard shows localStorage data
- No data is lost

When Supabase comes back online:
- New orders automatically save to both
- Admin dashboard switches back to Supabase

## Security Notes

### Row Level Security (RLS)
All tables have RLS enabled with policies that:
- Allow all users to SELECT (read)
- Allow all users to INSERT (create)
- Allow all users to UPDATE (modify)

**Note:** For production, you should restrict these policies to only allow:
- Authenticated users to create orders
- Admin users to read/update/delete

### Environment Variables
Supabase credentials are currently in:
- `server/.env` (not exposed to browser)
- Hardcoded in `assets/js/supabase.js` (exposed to browser)

**For production**, move sensitive credentials to server-side code only.

## Troubleshooting

### Orders Not Showing in Admin
1. Check browser console for errors
2. Verify SQL schema was run successfully
3. Check Supabase Table Editor to see if data exists
4. Try clearing localStorage and placing new order

### 401 Unauthorized Errors
1. Verify SUPABASE_ANON_KEY is correct in `assets/js/supabase.js`
2. Check Supabase project URL is correct
3. Ensure RLS policies are created

### Data Not Saving
1. Check browser console for JavaScript errors
2. Verify internet connection
3. Check Supabase project is active
4. Data should still save to localStorage as backup

## Monitoring

### View Data in Supabase
1. Go to Supabase **Table Editor**
2. Select table (customers, orders, transactions)
3. View all records in real-time

### Query Data
Use the SQL Editor to run custom queries:
```sql
-- Get all orders with customer info
SELECT o.*, c.full_name, c.email 
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY o.created_at DESC;

-- Get revenue by network
SELECT network, SUM(amount) as total_revenue, COUNT(*) as total_orders
FROM orders
GROUP BY network;

-- Get successful transactions
SELECT * FROM transactions
WHERE status = 'success'
ORDER BY created_at DESC;
```

## Next Steps

1. **Run the SQL schema** in Supabase SQL Editor
2. **Test an order** on your website
3. **Check admin dashboard** to see the data
4. **Monitor Supabase** Table Editor to verify data is saving

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase project is active
3. Ensure SQL schema was run successfully
4. Check that credentials match your Supabase project
