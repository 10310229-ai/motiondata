# Database Setup Guide

## Overview
This system uses SQLite database to store all customer purchases and orders from the Motion Data Solutions website.

## Features
- **Automatic Order Capture**: All purchases are automatically saved to the database
- **Customer Tracking**: Tracks customer information and purchase history
- **Admin Dashboard Integration**: View all orders in the admin panel
- **Real-time Statistics**: Dashboard stats calculated from actual database data

## Database Structure

### Orders Table
Stores all purchase transactions:
- `id` - Unique order ID (e.g., MTN-1701234567890)
- `reference` - Payment reference from Paystack
- `date` - Order date and time
- `timestamp` - Unix timestamp
- `customer` - Customer name
- `email` - Customer email
- `phone` - Customer phone number
- `network` - Network operator (MTN, AirtelTigo, Telecel)
- `package` - Data package purchased (e.g., 10GB)
- `amount` - Purchase amount in GHS
- `status` - Order status (completed, pending, failed)
- `delivered` - Delivery status (0 or 1)
- `delivery_date` - When the order was delivered
- `notes` - Admin notes

### Customers Table
Tracks customer information and statistics:
- `id` - Auto-increment customer ID
- `email` - Unique customer email
- `name` - Customer name
- `phone` - Phone number
- `total_orders` - Total number of orders
- `total_spent` - Total amount spent
- `first_order_date` - Date of first purchase
- `last_order_date` - Date of most recent purchase

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

This will install:
- express - Web server framework
- sqlite3 - SQLite database driver
- cors - Enable cross-origin requests
- dotenv - Environment variables
- node-fetch - HTTP requests

### 2. Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 3. Database File
The database file `orders.db` will be automatically created in the `server/` directory when you first start the server.

## API Endpoints

### Orders
- `GET /api/orders` - Get all orders (with pagination and filters)
  - Query params: `status`, `network`, `search`, `page`, `limit`
- `GET /api/orders/:id` - Get single order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Statistics
- `GET /api/stats` - Get dashboard statistics

### Customers
- `GET /api/customers` - Get all customers

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages/top` - Get top selling packages

## How It Works

### Order Flow
1. Customer completes purchase on order page (MTN/AirtelTigo/Telecel)
2. Paystack processes payment
3. On success, order is sent to `/api/orders` endpoint
4. Server saves order to SQLite database
5. Customer record is updated or created
6. Order appears in admin dashboard immediately

### Data Backup
Orders are saved to both:
- SQLite database (primary storage)
- Browser localStorage (backup/offline access)

## Admin Dashboard

The admin page automatically connects to the database and displays:
- Total orders count
- Total revenue
- Total customers
- Success rate
- Recent orders list
- Order filtering and search
- Customer management

## Database Management

### View Database
You can view the database using any SQLite browser tool:
- DB Browser for SQLite (https://sqlitebrowser.org/)
- SQLite Viewer VS Code extension
- Command line: `sqlite3 server/orders.db`

### Backup Database
Simply copy the `server/orders.db` file to create a backup.

### Export Data
```bash
cd server
sqlite3 orders.db
.mode csv
.output orders.csv
SELECT * FROM orders;
.quit
```

## Troubleshooting

### Database locked error
- Only one process can write to SQLite at a time
- Restart the server if you get this error

### Orders not appearing
- Check server console for errors
- Verify server is running on correct port
- Check browser console for API errors

### Missing dependencies
- Run `npm install` in the server directory
- Make sure Node.js version is 14 or higher

## Security Notes

- Database file is local to the server
- API endpoints should be protected with authentication in production
- Consider adding rate limiting for API endpoints
- Regularly backup the database file

## Migration from localStorage

If you have existing orders in localStorage, they can be migrated:
1. The new system saves to both database and localStorage
2. Old localStorage orders remain accessible
3. New orders are saved to database automatically
4. No manual migration needed - both systems work together
