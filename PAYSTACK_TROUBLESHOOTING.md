# Paystack "Unable to Process Transaction" Error - Troubleshooting Guide

## Error Message
"Unable to process transaction"

## Common Causes & Solutions

### 1. **Paystack Account Not Activated for Live Payments**
   - **Solution**: Log into your Paystack Dashboard at https://dashboard.paystack.com
   - Go to **Settings** → **Preferences** → **Go Live Checklist**
   - Complete all verification requirements:
     - Business Information
     - Bank Account Details
     - Director/Owner KYC
     - Business Documents
   - Wait for Paystack approval (usually 1-3 business days)

### 2. **Payment Channels Not Enabled**
   - **Solution**: In Paystack Dashboard:
   - Go to **Settings** → **Payment Channels**
   - Enable the following:
     - ✅ Mobile Money (MTN, AirtelTigo, Vodafone)
     - ✅ Card Payments (Visa, Mastercard)
     - ✅ Bank Transfer
   - Save changes

### 3. **Mobile Money Limits**
   - **Issue**: Some mobile money providers have transaction limits
   - **MTN Mobile Money**: Minimum GHS 1, Maximum varies by account type
   - **Solution**: Ensure package prices are within limits

### 4. **API Key Issues**
   - **Current Live Key**: `pk_live_91cfdef8bb6ab204ba3ec685224bbe3ff7aa0720`
   - **Verify**: Check if this key is still valid in your Paystack Dashboard
   - Go to **Settings** → **API Keys & Webhooks**
   - Confirm the public key matches

### 5. **Test Mode vs Live Mode**
   - **Test Key Format**: `pk_test_xxxxxxxxxx`
   - **Live Key Format**: `pk_live_xxxxxxxxxx`
   - You're currently using **LIVE mode**
   - For testing, you should use a **test key** first

## Testing Steps

### Step 1: Test with Paystack Test Mode
1. Get your test public key from: https://dashboard.paystack.com/settings/developer
2. Replace the live key with test key in the code temporarily
3. Use Paystack test cards:
   - **Card Number**: 5060666666666666666
   - **CVV**: 123
   - **Expiry**: Any future date
   - **PIN**: 1234
   - **OTP**: 123456

### Step 2: Check Paystack Dashboard
1. Go to https://dashboard.paystack.com/transactions
2. See if failed transactions are logged
3. Check the error details

### Step 3: Contact Paystack Support
If the issue persists:
- Email: support@paystack.com
- Live Chat: Available in dashboard
- Provide:
  - Your business name
  - Transaction reference numbers
  - Error message screenshots

## Current Configuration
- **Live Public Key**: pk_live_91cfdef8bb6ab204ba3ec685224bbe3ff7aa0720
- **Currency**: GHS (Ghana Cedis)
- **Payment Methods**: Mobile Money, Cards
- **Networks**: MTN, AirtelTigo, Telecel

## Quick Fix: Switch to Test Mode Temporarily

To test if the integration code works, temporarily use test mode:
1. Login to Paystack Dashboard
2. Copy your TEST public key
3. Replace in code: `const publicKey = 'pk_test_YOUR_TEST_KEY_HERE';`
4. Test with dummy payment details
5. Once working, complete live account verification
6. Switch back to live key
