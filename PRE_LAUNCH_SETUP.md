# Pre-Launch Authentication System Setup

## Overview
This pre-launch system allows users to create accounts and join the waitlist before the website officially opens.

## Files Created

### 1. `auth.html` - Login & Signup Page
- Beautiful pre-launch authentication page
- Sign up and login forms with form validation
- Supabase authentication integration
- Email verification support
- Password reset functionality
- Responsive design

### 2. `dashboard.html` - User Welcome Page
- Personalized welcome page for waitlist members
- Launch countdown timer (set to 30 days by default)
- Information about upcoming features
- User account management (logout)
- Protected route (requires authentication)

### 3. `supabase-setup.sql` - Database Setup Script
- Creates `user_profiles` table for additional user data
- Automatically creates profiles when users sign up
- Row Level Security (RLS) policies for data protection
- Waitlist notifications system
- Admin policies for managing orders
- Indexes for performance optimization

## Setup Instructions

### Step 1: Run SQL Setup
1. Go to your Supabase dashboard: https://app.supabase.com
2. Open your project (njsjihfpggbpfdpdgzzx)
3. Navigate to **SQL Editor**
4. Create a new query
5. Copy and paste the contents of `supabase-setup.sql`
6. Click **Run** to execute the script

### Step 2: Configure Email Authentication
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should already be enabled)
3. Configure **Email Templates**:
   - Customize confirmation email
   - Customize password reset email
   - Add your branding

### Step 3: Configure Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your GitHub Pages URL: `https://10310229-ai.github.io/motiondata/`
3. Add **Redirect URLs**:
   - `https://10310229-ai.github.io/motiondata/dashboard.html`
   - `http://localhost:3000/dashboard.html` (for local testing)

### Step 4: Test Locally
1. Open `auth.html` in your browser
2. Try creating a test account
3. Check your email for verification
4. Test login functionality
5. Verify redirect to `dashboard.html`

### Step 5: Deploy to GitHub Pages
```powershell
# Switch to gh-pages branch
git checkout gh-pages

# Copy new files from main
git checkout main -- auth.html dashboard.html

# Commit and push
git add auth.html dashboard.html
git commit -m "Add pre-launch authentication system"
git push origin gh-pages
```

## Features

### Authentication Features
✅ User registration with email verification
✅ Secure login system
✅ Password reset functionality
✅ Form validation (password strength, phone format)
✅ Protected routes (dashboard requires login)
✅ Session management with localStorage

### User Experience
✅ Beautiful gradient design
✅ Smooth animations and transitions
✅ Loading states for async operations
✅ Error and success messages
✅ Responsive mobile design
✅ Launch countdown timer

### Security
✅ Row Level Security (RLS) enabled
✅ User data isolated by policies
✅ Email verification required
✅ Secure password requirements (min 6 characters)
✅ Protected API endpoints

### Database Tables
- **user_profiles**: Stores user information (name, phone, join date)
- **waitlist_notifications**: Tracks launch notifications
- **orders**: Updated with user-specific RLS policies

## Usage

### For Users
1. Visit `auth.html`
2. Click "Sign Up" tab
3. Fill in details:
   - Full Name
   - Email Address
   - Phone Number (Ghana format: 0240000000)
   - Password (min 6 characters)
4. Click "Create Account"
5. Check email for verification link
6. Return to login
7. Access personalized dashboard

### For Admin
- Admin email (`kwakumotion55@gmail.com`) has special privileges
- Can view all orders (when RLS is properly configured)
- Can access waitlist statistics
- Can send launch notifications using SQL function

## Customization

### Change Launch Date
In `dashboard.html`, modify line:
```javascript
launchDate.setDate(launchDate.getDate() + 30); // Change 30 to desired days
```

### Update Branding
- Modify gradient colors in CSS (currently purple/blue theme)
- Update company name in both files
- Add logo in navbar section

### Add More User Fields
1. Update signup form in `auth.html`
2. Add fields to user metadata in signup function
3. Update `user_profiles` table schema
4. Modify `handle_new_user()` function

## Troubleshooting

### 401 Unauthorized Errors
- Ensure SQL setup script was run successfully
- Check RLS policies are created
- Verify Supabase API key is correct
- Enable email provider in Supabase dashboard

### Email Not Sending
- Check email provider is enabled
- Verify site URL configuration
- Check spam folder
- Review email templates in Supabase

### Login Not Working
- Ensure email is verified (check email)
- Try password reset if forgotten
- Clear browser localStorage and try again
- Check browser console for errors

## Next Steps

1. **Run the SQL setup** in Supabase dashboard
2. **Configure email settings** in Supabase
3. **Test locally** before deploying
4. **Deploy to gh-pages** branch
5. **Monitor signups** in Supabase dashboard

## Database Functions

### Send Launch Notification (Admin)
Run this in SQL Editor when ready to launch:
```sql
SELECT public.send_launch_notification();
```

This will create notification records for all verified waitlist members.

## Notes

- The system uses Supabase Auth API directly (no JavaScript library needed)
- User sessions are stored in localStorage
- All user data is protected by Row Level Security
- Admin access is based on email address
- Phone validation enforces Ghana phone number format (0XXXXXXXXX)

---

**Created**: December 8, 2025  
**Status**: Ready for deployment  
**Next Action**: Run `supabase-setup.sql` in Supabase dashboard
