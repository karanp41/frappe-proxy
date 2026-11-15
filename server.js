import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 8081;
const FRAPPE_TARGET = process.env.FRAPPE_TARGET;
// const FRAPPE_TARGET = process.env.FRAPPE_TARGET || 'https://sobha-bt-sandbox.xstack.ae';

// Enable CORS for all routes - allows ALL origins with credentials
app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins (including undefined for same-origin requests)
        callback(null, origin || '*');
    },
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        target: FRAPPE_TARGET
    });
});

// Proxy middleware for Frappe API
const frappeProxy = createProxyMiddleware({
    target: FRAPPE_TARGET,
    changeOrigin: true,
    secure: true,
    // Strip '/frappe' prefix when forwarding to target
    pathRewrite: {
        '^/frappe': '', // Remove /frappe prefix
    },
    // Handle cookies to avoid CORS issues
    onProxyRes: (proxyRes, req, res) => {
        // IMPORTANT: Remove Frappe's CORS headers and replace with ours
        delete proxyRes.headers['access-control-allow-origin'];
        delete proxyRes.headers['access-control-allow-credentials'];
        delete proxyRes.headers['access-control-allow-methods'];
        delete proxyRes.headers['access-control-allow-headers'];
        delete proxyRes.headers['access-control-expose-headers'];

        // Set correct CORS headers for the requesting origin
        const origin = req.headers.origin || req.headers.referer;
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin.replace(/\/$/, ''));
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
        }

        const setCookie = proxyRes.headers['set-cookie'];

        if (Array.isArray(setCookie)) {
            // Modify cookies to work with localhost/development
            proxyRes.headers['set-cookie'] = setCookie.map((cookie) => {
                let modifiedCookie = cookie
                    // Remove Domain to default to current host
                    .replace(/;\s*Domain=[^;]+/i, '')
                    // Remove existing SameSite
                    .replace(/;\s*SameSite=[^;]+/i, '')
                    // Remove existing Secure flag
                    .replace(/;\s*Secure/i, '');

                // For HTTP (non-HTTPS), use SameSite=Lax instead of None
                // SameSite=None requires Secure flag, which only works over HTTPS
                const isHttps = req.headers['x-forwarded-proto'] === 'https' || req.secure;

                if (isHttps) {
                    // HTTPS: Use SameSite=None with Secure
                    modifiedCookie += '; SameSite=None; Secure';
                } else {
                    // HTTP: Use SameSite=Lax without Secure (more permissive for local dev)
                    modifiedCookie += '; SameSite=Lax';
                }

                return modifiedCookie;
            });

            // console.log(`[${new Date().toISOString()}] Modified cookies:`, proxyRes.headers['set-cookie']);
            console.log(`[${new Date().toISOString()}] Proxied with cookies: ${req.method} ${req.url}`);
        }
    },
    // Log proxy requests (optional, useful for debugging)
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[${new Date().toISOString()}] Proxying: ${req.method} ${req.url} -> ${FRAPPE_TARGET}${proxyReq.path}`);
        console.log(`[${new Date().toISOString()}] Request cookies:`, req.headers.cookie || 'None');
    },
    // Log errors
    onError: (err, req, res) => {
        console.error(`[${new Date().toISOString()}] Proxy Error:`, err.message);
        res.status(500).json({
            error: 'Proxy error',
            message: err.message
        });
    },
});

// Apply proxy to /frappe/* routes
app.use('/frappe', frappeProxy);

// Catch-all for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found. Use /frappe/* to proxy to Frappe API.`
    });
});

// Start server
app.listen(PORT, '::', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  Frappe Proxy Server Running                               ║
╠════════════════════════════════════════════════════════════╣
║  Port:      ${PORT}                                            ║
║  Target:    ${FRAPPE_TARGET}              ║
║  Health:    http://localhost:${PORT}/health                    ║
║  Proxy:     http://localhost:${PORT}/frappe/*                  ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
