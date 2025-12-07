# Quick Start Guide - Database Integration

## ✅ Database System Created Successfully!

I've created a complete database system for your Motion Data Solutions website that will automatically store all customer purchases.

## What Was Done

### 1. Database Module (`server/database.js`)
- SQLite database with Orders and Customers tables
- Complete CRUD operations for orders
- Customer tracking and statistics
- Automatic order counting and revenue calculation

### 2. Server Integration (`server/index.js`)
- Updated all API endpoints to use the database
- Orders are now saved to SQLite instead of JSON file
- Real-time statistics from database

### 3. Order Forms Updated
All three order forms now save to database:
- `js/order-mtn.js` - MTN orders
- `js/order-airtel.js` - AirtelTigo orders
- `js/order-telecel.js` - Telecel orders

### 4. Admin Dashboard
The admin page (`admin.html`) automatically displays orders from the database.

## Installation Steps

### Step 1: Install Node.js
If you don't have Node.js installed:
1. Download from: https://nodejs.org/
2. Install the LTS version (recommended)
3. Restart your terminal/PowerShell after installation

### Step 2: Install Dependencies
Open PowerShell in the project folder and run:
```powershell
cd server
npm install
```

This installs:
- express (web server)
- sqlite3 (database)
- cors (API access)
- node-fetch (HTTP requests)
- dotenv (environment variables)

### Step 3: Test Database
```powershell
node test-db.js
```

This will:
- Create the database file (`orders.db`)
- Add a test order
- Display statistics

### Step 4: Start Server
```powershell
npm start
```

The server will start on `http://localhost:3000`

## How It Works

### When a Customer Makes a Purchase:

1. **Customer fills order form** (MTN/AirtelTigo/Telecel page)
2. **Paystack processes payment**
3. **On success:**
   - Order data is sent to `/api/orders` endpoint
   - Server saves to SQLite database
   - Customer record is created/updated
   - Order appears in admin dashboard

### What Gets Stored:

**For Each Order:**
- Order ID (e.g., MTN-1701234567890)
- Customer email and phone
- Network operator
- Data package purchased
- Amount paid
- Payment reference
- Date and time
- Status (completed/pending/failed)

**For Each Customer:**
- Email address
- Total number of orders
- Total amount spent
- First and last purchase dates

## Admin Dashboard Features

Visit `admin.html` to see:
- **Total Orders** - Count of all purchases
- **Total Revenue** - Sum of all completed orders
- **Total Customers** - Unique customer count
- **Success Rate** - Percentage of successful orders
- **Orders List** - All orders with filtering and search
- **Customer List** - All customers and their stats

### Filtering Orders:
- By status (completed/pending/failed)
- By network (MTN/AirtelTigo/Telecel)
- By search term (order ID, customer, phone, package)
- Pagination (10 orders per page)

## Database File Location

`server/orders.db` - SQLite database file

You can:
- **View it** with DB Browser for SQLite (https://sqlitebrowser.org/)
- **Backup it** by copying the file
- **Export data** to CSV using SQLite commands

## API Endpoints

### Orders
```
GET  /api/orders        - Get all orders (with filters)
GET  /api/orders/:id    - Get single order
POST /api/orders        - Create new order
PUT  /api/orders/:id    - Update order
DELETE /api/orders/:id  - Delete order
```

### Statistics
```
GET /api/stats          - Get dashboard statistics
```

### Customers
```
GET /api/customers      - Get all customers
```

### Packages
```
GET /api/packages       - Get all packages
GET /api/packages/top   - Get top selling packages
```

## Testing the System

### 1. Start the server:
```powershell
cd server
npm start
```

### 2. Make a test purchase:
- Visit one of your order pages (order-mtn.html, etc.)
- Fill in the form with test data
- Complete payment via Paystack

### 3. View in admin:
- Visit admin.html
- Login with your credentials
- See the order in the dashboard

## Backup & Export

### Backup Database:
```powershell
# Copy the database file
Copy-Item server/orders.db server/orders-backup.db
```

### Export to CSV:
```powershell
cd server
sqlite3 orders.db
.mode csv
.output orders.csv
SELECT * FROM orders;
.quit
```

## Troubleshooting

### "npm is not recognized"
- Install Node.js from nodejs.org
- Restart your terminal after installation

### "Cannot find module 'sqlite3'"
```powershell
cd server
npm install
```

### "Database is locked"
- Close any SQLite browser tools
- Restart the server

### Orders not appearing
- Check server console for errors
- Verify server is running
- Check browser console (F12)

## Security Recommendations

For production use:
1. Add authentication to admin endpoints
2. Use environment variables for sensitive data
3. Add rate limiting to prevent abuse
4. Regular database backups
5. Use HTTPS in production

## Files Created/Modified

### New Files:
- `server/database.js` - Database module
- `server/package.json` - Node.js dependencies
- `server/test-db.js` - Database test script
- `server/setup-database.ps1` - Setup script
- `server/DATABASE.md` - Detailed documentation

### Modified Files:
- `server/index.js` - Updated to use database
- `js/order-mtn.js` - Save to database
- `js/order-airtel.js` - Save to database
- `js/order-telecel.js` - Save to database

## Next Steps

1. **Install Node.js** if not already installed
2. **Run setup script**:
   ```powershell
   cd server
   powershell -ExecutionPolicy Bypass -File setup-database.ps1
   ```
3. **Start the server**: `npm start`
4. **Make a test purchase** to verify everything works
5. **Check admin dashboard** to see the order

## Support

For detailed information, see:
- `server/DATABASE.md` - Complete database documentation
- `server/package.json` - Dependencies list
- Server console logs for debugging

---

Your database is ready! Just install Node.js and run the setup script to get started.
