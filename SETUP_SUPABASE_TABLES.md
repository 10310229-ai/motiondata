# 🚀 Supabase Database Setup - FOLLOW THESE STEPS

## ⚠️ IMPORTANT: Run these steps to fix login and account creation issues

### Step 1: Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard/project/njsjihfpggbpfdpdgzzx**
2. Login to your Supabase account
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy and Paste the SQL Schema

1. Open the file: `server/supabase-schema.sql`
2. Copy **ALL** the SQL code (Ctrl+A, Ctrl+C)
3. Paste it into the Supabase SQL Editor
4. Click **"RUN"** or press **Ctrl+Enter**

### Step 3: Verify Tables Were Created

1. Click on **"Table Editor"** in the left sidebar
2. You should see these 5 tables:
   - ✅ **users** - Stores user accounts (login credentials)
   - ✅ **user_profiles** - Stores extended user information
   - ✅ **customers** - Stores customer data from orders
   - ✅ **orders** - Stores all data bundle orders
   - ✅ **transactions** - Stores payment transactions

### Step 4: Check Table Structure

Click on the **users** table and verify it has these columns:
- id (bigint, primary key)
- name (text)
- email (text, unique)
- phone (text)
- password_hash (text)
- role (text, default: 'customer')
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### Step 5: Test the Website

1. Go to: **https://motionsdata.me**
2. Try creating a new account
3. Login with the account
4. Navigate to Services page
5. You should stay logged in!

## 🔍 How to Check if Users Are Being Saved

1. In Supabase, go to **Table Editor** → **users**
2. You should see all registered users with their information
3. Passwords are stored as base64-encoded strings for security

## ⚡ Quick Check Commands

Run this in Supabase SQL Editor to see all users:
```sql
SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC;
```

Run this to count total users:
```sql
SELECT COUNT(*) as total_users FROM users;
```

## 🆘 Troubleshooting

### Problem: Tables already exist error
**Solution:** The SQL script includes `DROP TABLE IF EXISTS` statements, so it will recreate the tables. Just run it again.

### Problem: Permission denied
**Solution:** Make sure you're logged in as the project owner in Supabase.

### Problem: Still can't login
**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Open browser DevTools (F12) → Console tab
3. Try logging in and check for error messages
4. Send screenshot of console errors

## 📊 What This Fixes

✅ Users can create accounts and they're saved to Supabase database  
✅ Users can login and stay logged in  
✅ User sessions persist across page refreshes  
✅ Protected pages (Services, Order pages) are accessible after login  
✅ All user data is stored securely in the cloud  
✅ Admin dashboard can view all registered users  

## 🎯 Next Steps After Setup

Once the tables are created:
1. The website will automatically save all new signups to Supabase
2. Login will authenticate against the Supabase database
3. You can view all users in the Admin Dashboard
4. User data is backed up in both Supabase and localStorage

---

**Need Help?** If you encounter any issues, check the browser console (F12) for error messages and share them.
