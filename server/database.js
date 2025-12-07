const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'orders.json');

// Initialize database file
function initDatabase() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      orders: [],
      customers: {}
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
}

// Read database
function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { orders: [], customers: {} };
  }
}

// Write database
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Add a new order
function addOrder(orderData) {
  const db = readDB();
  const {
    id,
    reference,
    date,
    timestamp,
    email,
    phone,
    network,
    package: pkg,
    amount,
    status = 'completed',
    customer = email.split('@')[0]
  } = orderData;

  const order = {
    id,
    reference,
    date,
    timestamp,
    customer,
    email,
    phone,
    network,
    package: pkg,
    amount,
    status,
    created_at: new Date().toISOString()
  };

  db.orders.unshift(order);
  
  // Update customer stats
  if (!db.customers[email]) {
    db.customers[email] = {
      email,
      name: customer,
      phone,
      total_orders: 0,
      total_spent: 0,
      first_order_date: date,
      last_order_date: date
    };
  }
  
  db.customers[email].total_orders++;
  db.customers[email].total_spent += amount;
  db.customers[email].last_order_date = date;
  db.customers[email].phone = phone;
  
  writeDB(db);
  return order;
}

// Get all orders with optional filters
function getOrders(filters = {}) {
  const db = readDB();
  let orders = db.orders;

  if (filters.status && filters.status !== 'All Status') {
    orders = orders.filter(o => o.status.toLowerCase() === filters.status.toLowerCase());
  }

  if (filters.network && filters.network !== 'All Networks') {
    orders = orders.filter(o => o.network === filters.network);
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    orders = orders.filter(o => 
      o.id.toLowerCase().includes(search) ||
      o.customer.toLowerCase().includes(search) ||
      o.phone.includes(search) ||
      o.package.toLowerCase().includes(search)
    );
  }

  // Pagination
  if (filters.limit) {
    const offset = ((filters.page || 1) - 1) * filters.limit;
    orders = orders.slice(offset, offset + filters.limit);
  }

  return orders;
}

// Get total count of orders
function getOrdersCount(filters = {}) {
  const db = readDB();
  let orders = db.orders;

  if (filters.status && filters.status !== 'All Status') {
    orders = orders.filter(o => o.status.toLowerCase() === filters.status.toLowerCase());
  }

  if (filters.network && filters.network !== 'All Networks') {
    orders = orders.filter(o => o.network === filters.network);
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    orders = orders.filter(o => 
      o.id.toLowerCase().includes(search) ||
      o.customer.toLowerCase().includes(search) ||
      o.phone.includes(search) ||
      o.package.toLowerCase().includes(search)
    );
  }

  return orders.length;
}

// Get a single order by ID
function getOrderById(orderId) {
  const db = readDB();
  return db.orders.find(o => o.id === orderId);
}

// Update an order
function updateOrder(orderId, updateData) {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === orderId);
  
  if (index !== -1) {
    db.orders[index] = { ...db.orders[index], ...updateData };
    writeDB(db);
    return db.orders[index];
  }
  
  return null;
}

// Delete an order
function deleteOrder(orderId) {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === orderId);
  
  if (index !== -1) {
    db.orders.splice(index, 1);
    writeDB(db);
    return { deleted: true };
  }
  
  return { deleted: false };
}

// Get dashboard statistics
function getStats() {
  const db = readDB();
  const stats = {};

  stats.totalOrders = db.orders.length;
  stats.totalRevenue = db.orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);
  stats.totalCustomers = Object.keys(db.customers).length;

  const completedOrders = db.orders.filter(o => o.status === 'completed').length;
  stats.successRate = db.orders.length > 0 
    ? ((completedOrders / db.orders.length) * 100).toFixed(1)
    : 100;

  // Calculate growth (last 30 days vs previous 30)
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const recent = db.orders.filter(o => now - o.timestamp < thirtyDays);
  const previous = db.orders.filter(o => {
    const age = now - o.timestamp;
    return age >= thirtyDays && age < thirtyDays * 2;
  });

  stats.ordersGrowth = previous.length > 0
    ? (((recent.length - previous.length) / previous.length) * 100).toFixed(1)
    : 0;

  const recentRevenue = recent.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0);
  const previousRevenue = previous.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0);
  
  stats.revenueGrowth = previousRevenue > 0
    ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
    : 0;

  return stats;
}

// Get all customers
function getCustomers() {
  const db = readDB();
  return Object.values(db.customers).sort((a, b) => b.total_spent - a.total_spent);
}

// Get top packages
function getTopPackages() {
  const db = readDB();
  const packageSales = {};

  db.orders
    .filter(o => o.status === 'completed')
    .forEach(order => {
      const key = `${order.network}-${order.package}`;
      if (!packageSales[key]) {
        packageSales[key] = {
          name: order.package,
          network: order.network,
          sales: 0,
          revenue: 0
        };
      }
      packageSales[key].sales++;
      packageSales[key].revenue += order.amount;
    });

  return Object.values(packageSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
}

module.exports = {
  initDatabase,
  addOrder,
  getOrders,
  getOrdersCount,
  getOrderById,
  updateOrder,
  deleteOrder,
  getStats,
  getCustomers,
  getTopPackages
};
