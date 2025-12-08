const https = require('https');

// Load Supabase configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Warning: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
}

// Supabase REST API request helper
function supabaseRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const urlObj = new URL(url.toString());
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Supabase error: ${res.statusCode} - ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Initialize database (create tables if needed)
function initDatabase() {
  console.log('Using Supabase database');
  return true;
}

// Add a new order
function addOrder(orderData) {
  return (async () => {
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

    try {
      const result = await supabaseRequest('/rest/v1/orders', {
        method: 'POST',
        body: order
      });

      // Update or create customer
      await supabaseRequest('/rest/v1/customers', {
        method: 'POST',
        body: {
          email,
          name: customer,
          phone
        },
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        }
      });

      console.log('Order saved to Supabase:', id);
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('Error adding order to Supabase:', error);
      throw error;
    }
  })();
}

// Get all orders with optional filters
function getOrders(filters = {}) {
  return (async () => {
    try {
      let endpoint = '/rest/v1/orders?select=*&order=created_at.desc';

      if (filters.status && filters.status !== 'All Status') {
        endpoint += `&status=eq.${filters.status.toLowerCase()}`;
      }

      if (filters.network && filters.network !== 'All Networks') {
        endpoint += `&network=eq.${filters.network}`;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        endpoint += `&or=(id.ilike.*${search}*,customer.ilike.*${search}*,phone.ilike.*${search}*,package.ilike.*${search}*)`;
      }

      // Pagination
      if (filters.limit) {
        const offset = ((filters.page || 1) - 1) * filters.limit;
        endpoint += `&limit=${filters.limit}&offset=${offset}`;
      }

      const orders = await supabaseRequest(endpoint);
      return orders || [];
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  })();
}

// Get total count of orders
function getOrdersCount(filters = {}) {
  return (async () => {
    try {
      let endpoint = '/rest/v1/orders?select=*&count=exact';

      if (filters.status && filters.status !== 'All Status') {
        endpoint += `&status=eq.${filters.status.toLowerCase()}`;
      }

      if (filters.network && filters.network !== 'All Networks') {
        endpoint += `&network=eq.${filters.network}`;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        endpoint += `&or=(id.ilike.*${search}*,customer.ilike.*${search}*,phone.ilike.*${search}*,package.ilike.*${search}*)`;
      }

      const result = await supabaseRequest(endpoint, {
        headers: { 'Prefer': 'count=exact' }
      });
      
      return Array.isArray(result) ? result.length : 0;
    } catch (error) {
      console.error('Error getting orders count:', error);
      return 0;
    }
  })();
}

// Get a single order by ID
function getOrderById(orderId) {
  return (async () => {
    try {
      const result = await supabaseRequest(`/rest/v1/orders?id=eq.${orderId}`);
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  })();
}

// Update an order
function updateOrder(orderId, updateData) {
  return (async () => {
    try {
      const result = await supabaseRequest(`/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        body: updateData
      });
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error updating order:', error);
      return null;
    }
  })();
}

// Delete an order
function deleteOrder(orderId) {
  return (async () => {
    try {
      await supabaseRequest(`/rest/v1/orders?id=eq.${orderId}`, {
        method: 'DELETE'
      });
      return { deleted: true };
    } catch (error) {
      console.error('Error deleting order:', error);
      return { deleted: false };
    }
  })();
}

// Get dashboard statistics
function getStats() {
  return (async () => {
    try {
      const stats = {};

      // Total orders
      const allOrders = await supabaseRequest('/rest/v1/orders?select=*');
      stats.totalOrders = allOrders.length;

      // Total revenue
      const completedOrders = allOrders.filter(o => o.status === 'completed');
      stats.totalRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      // Total customers
      const customers = await supabaseRequest('/rest/v1/customers?select=email');
      stats.totalCustomers = customers.length;

      // Success rate
      stats.successRate = allOrders.length > 0 
        ? ((completedOrders.length / allOrders.length) * 100).toFixed(1)
        : 100;

      // Calculate growth (last 30 days vs previous 30)
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const recent = allOrders.filter(o => now - o.timestamp < thirtyDays);
      const previous = allOrders.filter(o => {
        const age = now - o.timestamp;
        return age >= thirtyDays && age < thirtyDays * 2;
      });

      stats.ordersGrowth = previous.length > 0
        ? (((recent.length - previous.length) / previous.length) * 100).toFixed(1)
        : 0;

      const recentRevenue = recent.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || 0), 0);
      const previousRevenue = previous.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || 0), 0);
      
      stats.revenueGrowth = previousRevenue > 0
        ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        successRate: 100,
        ordersGrowth: 0,
        revenueGrowth: 0
      };
    }
  })();
}

// Get all customers
function getCustomers() {
  return (async () => {
    try {
      const customers = await supabaseRequest('/rest/v1/customers?select=*&order=total_spent.desc');
      return customers || [];
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  })();
}

// Get top packages
function getTopPackages() {
  return (async () => {
    try {
      const orders = await supabaseRequest('/rest/v1/orders?select=*&status=eq.completed');
      const packageSales = {};

      orders.forEach(order => {
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
        packageSales[key].revenue += order.amount || 0;
      });

      return Object.values(packageSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting top packages:', error);
      return [];
    }
  })();
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
