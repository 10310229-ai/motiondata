const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

// Import database functions
const {
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
} = require('./database');

// Initialize database
initDatabase();

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnv();

// Ports: HTTP defaults to 3000 (or PORT), HTTPS defaults to 8443 (or HTTPS_PORT)
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;

if (!PAYSTACK_SECRET) {
  console.warn('Warning: PAYSTACK_SECRET_KEY not set. Verification will fail until you set it in .env');
}

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf'
};

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Parse raw body
function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Send JSON response
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Serve static files
function serveStatic(req, res, filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
}

// HTTP fetch implementation using built-in https module
function httpsFetch(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlString);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Request handler
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers for all requests
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    try {
      // GET /api/stats
      if (pathname === '/api/stats' && method === 'GET') {
        const stats = getStats();
        return sendJSON(res, stats);
      }

      // GET /api/orders
      if (pathname === '/api/orders' && method === 'GET') {
        const filters = {
          status: parsedUrl.query.status,
          network: parsedUrl.query.network,
          search: parsedUrl.query.search,
          page: parseInt(parsedUrl.query.page) || 1,
          limit: parseInt(parsedUrl.query.limit) || 10
        };
        
        const orders = getOrders(filters);
        const total = getOrdersCount(filters);
        
        return sendJSON(res, {
          orders: orders,
          total: total,
          page: filters.page,
          totalPages: Math.ceil(total / filters.limit)
        });
      }

      // POST /api/orders
      if (pathname === '/api/orders' && method === 'POST') {
        const body = await parseBody(req);
        const newOrder = {
          id: body.id || `ORD-${Date.now()}`,
          reference: body.reference || body.id || `ORD-${Date.now()}`,
          date: body.date || new Date().toISOString(),
          timestamp: body.timestamp || Date.now(),
          email: body.email,
          phone: body.phone || body.mobile,
          network: body.network || body.operator,
          package: body.package,
          amount: parseFloat(body.amount),
          status: body.status || 'completed',
          customer: body.customer || body.email.split('@')[0]
        };
        
        const order = addOrder(newOrder);
        return sendJSON(res, order, 201);
      }

      // GET /api/orders/:id
      if (pathname.startsWith('/api/orders/') && method === 'GET') {
        const id = pathname.split('/')[3];
        const order = getOrderById(id);
        if (order) {
          return sendJSON(res, order);
        } else {
          return sendJSON(res, { error: 'Order not found' }, 404);
        }
      }

      // PUT /api/orders/:id
      if (pathname.startsWith('/api/orders/') && method === 'PUT') {
        const id = pathname.split('/')[3];
        const body = await parseBody(req);
        const order = updateOrder(id, body);
        return sendJSON(res, order);
      }

      // DELETE /api/orders/:id
      if (pathname.startsWith('/api/orders/') && method === 'DELETE') {
        const id = pathname.split('/')[3];
        const result = deleteOrder(id);
        if (result.deleted) {
          return sendJSON(res, { message: 'Order deleted' });
        } else {
          return sendJSON(res, { error: 'Order not found' }, 404);
        }
      }

      // GET /api/customers
      if (pathname === '/api/customers' && method === 'GET') {
        const customers = getCustomers();
        return sendJSON(res, customers);
      }

      // GET /api/packages
      if (pathname === '/api/packages' && method === 'GET') {
        // Packages are now managed through Supabase
        return sendJSON(res, []);
      }

      // GET /api/packages/top
      if (pathname === '/api/packages/top' && method === 'GET') {
        const topPackages = getTopPackages();
        return sendJSON(res, topPackages);
      }

      // Not found
      return sendJSON(res, { error: 'API endpoint not found' }, 404);

    } catch (error) {
      console.error('API Error:', error);
      return sendJSON(res, { error: 'Internal server error' }, 500);
    }
  }

  // GET /verify - Paystack verification
  if (pathname === '/verify' && method === 'GET') {
    const reference = parsedUrl.query.reference;
    if (!reference) {
      return sendJSON(res, { error: 'Missing reference' }, 400);
    }
    if (!PAYSTACK_SECRET) {
      return sendJSON(res, { error: 'Server not configured with Paystack secret' }, 500);
    }

    try {
      const verifyUrl = 'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference);
      const response = await httpsFetch(verifyUrl, {
        headers: { Authorization: 'Bearer ' + PAYSTACK_SECRET }
      });
      const data = await response.json();
      
      if (!response.ok) {
        return sendJSON(res, { error: data }, response.status);
      }
      return sendJSON(res, data);
    } catch (err) {
      console.error('Error verifying reference', err);
      return sendJSON(res, { error: 'Verification failed', detail: err.message }, 500);
    }
  }

  // POST /webhook - Paystack webhook
  if (pathname === '/webhook' && method === 'POST') {
    const sig = req.headers['x-paystack-signature'] || req.headers['paystack-signature'];
    if (!PAYSTACK_SECRET) {
      console.warn('Webhook received but PAYSTACK_SECRET_KEY not set');
      res.writeHead(400);
      res.end();
      return;
    }

    const body = await parseRawBody(req);
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
    
    if (hash !== sig) {
      console.warn('Invalid webhook signature');
      res.writeHead(400);
      res.end();
      return;
    }

    try {
      const event = JSON.parse(body);
      console.log('Received Paystack webhook event:', event?.event);
    } catch (e) {
      console.error('Failed to parse webhook body');
    }

    res.writeHead(200);
    res.end();
    return;
  }

  // Static file serving
  let filePath;
  
  // Redirect root to /index.html
  if (pathname === '/') {
    res.writeHead(301, { Location: '/index.html' });
    res.end();
    return;
  }
  
  // Serve static files from parent directory
  filePath = path.join(__dirname, '..', pathname);
  
  // Security: prevent directory traversal
  const rootDir = path.join(__dirname, '..');
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveStatic(req, res, filePath);
}
// Start HTTP server
function startHttpServer(redirectToHttps) {
  const server = http.createServer(async (req, res) => {
    if (redirectToHttps) {
      // Build host without port and redirect to HTTPS port
      const hostHeader = req.headers.host || 'localhost';
      const host = hostHeader.split(':')[0];
      const location = `https://${host}:${HTTPS_PORT}${req.url}`;
      res.writeHead(301, { Location: location });
      res.end();
      return;
    }

    // Handle request
    await handleRequest(req, res);
  });

  server.listen(PORT, () => {
    console.log(`Motion Data server running on http://localhost:${PORT}`);
  });
}

// Try to load SSL cert + key from env or default `server/ssl/` directory.
const sslKeyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'ssl', 'key.pem');
const sslCertPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'ssl', 'cert.pem');
const sslPfxPath = process.env.SSL_PFX_PATH || path.join(__dirname, 'ssl', 'cert.pfx');
const sslPfxPass = process.env.SSL_PFX_PASS || '';

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  try {
    const key = fs.readFileSync(sslKeyPath);
    const cert = fs.readFileSync(sslCertPath);
    const httpsServer = https.createServer({ key, cert }, async (req, res) => {
      await handleRequest(req, res);
    });

    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`Motion Data HTTPS server running on https://localhost:${HTTPS_PORT}`);
    });

    // Also start HTTP that redirects to HTTPS
    startHttpServer(true);
    console.log(`HTTP -> HTTPS redirect enabled on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Failed to start HTTPS server with key/cert, falling back to HTTP. Error:', err);
    startHttpServer(false);
  }
} else if (fs.existsSync(sslPfxPath)) {
  try {
    const pfx = fs.readFileSync(sslPfxPath);
    const opts = { pfx };
    if (sslPfxPass) opts.passphrase = sslPfxPass;

    const httpsServer = https.createServer(opts, async (req, res) => {
      await handleRequest(req, res);
    });
    
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`Motion Data HTTPS server running (PFX) on https://localhost:${HTTPS_PORT}`);
    });

    // Also start HTTP that redirects to HTTPS
    startHttpServer(true);
    console.log(`HTTP -> HTTPS redirect enabled on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Failed to start HTTPS server with PFX, falling back to HTTP. Error:', err);
    startHttpServer(false);
  }
} else {
  console.warn('SSL key/cert not found. To enable HTTPS place `key.pem` and `cert.pem` in `server/ssl/`, place a PFX as `server/ssl/cert.pfx`, or set SSL_KEY_PATH / SSL_CERT_PATH / SSL_PFX_PATH env vars.');
  console.warn(`Looking for key: ${sslKeyPath}`);
  console.warn(`Looking for cert: ${sslCertPath}`);
  console.warn(`Looking for pfx: ${sslPfxPath}`);
  startHttpServer(false);
}
