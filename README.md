# Frappe Node API Proxy Server

A lightweight Express.js proxy server that mirrors the functionality of the Vite dev server proxy configuration for Frappe API.

## Features

- ✅ Proxies requests from `/frappe/*` to the Frappe backend
- ✅ Handles CORS issues automatically
- ✅ Manages cookies for localhost development
- ✅ Strips `/frappe` prefix when forwarding requests
- ✅ Request/response logging
- ✅ Health check endpoint

## Installation

```bash
cd frappe_node_api
npm install
```

## Configuration

Create a `.env` file (optional, defaults are provided):

```bash
PORT=8080
FRAPPE_TARGET=https://sobha.u.frappe.cloud
```

## Usage

### Start the server

```bash
npm start
```

### Development mode (with auto-reload)

```bash
npm run dev
```

### Production mode (with PM2)

```bash
# Install dependencies (including PM2)
npm install

# Start in production mode (uses default env vars from config)
npm run prod

# Or set custom environment variables before starting
PORT=8080 FRAPPE_TARGET=https://your-target.com npm run prod

# Check status
pm2 status

# View logs
pm2 logs frappe-proxy

# Stop the application
npm run prod:stop

# Restart the application
npm run prod:restart
```

## Endpoints

- **Health Check**: `GET http://localhost:8080/health`
- **Proxy**: `GET/POST http://localhost:8080/frappe/*`

## How it works

The server mirrors the Vite proxy configuration:

1. **Port**: Listens on port 8080 (configurable via `PORT` env var)
2. **Target**: Forwards to `https://sobha.u.frappe.cloud` (configurable via `FRAPPE_TARGET`)
3. **Path Rewrite**: Strips `/frappe` prefix before forwarding
4. **Cookie Handling**: Modifies cookies to work with localhost:
   - Removes `Domain` attribute
   - Sets `SameSite=None` for third-party contexts
5. **CORS**: Enables CORS with credentials support

## Example Requests

```bash
# Health check
curl http://localhost:8080/health

# Proxy to Frappe API
curl http://localhost:8080/frappe/api/method/frappe.auth.get_logged_user

# The above request is forwarded as:
# https://sobha.u.frappe.cloud/api/method/frappe.auth.get_logged_user
```

## Comparison with Vite Config

| Feature | Vite Config | Express Server |
|---------|-------------|----------------|
| Port | 8080 | 8080 (configurable) |
| Host | :: (IPv6) | :: (IPv6) |
| Proxy Path | /frappe | /frappe |
| Target | sobha.u.frappe.cloud | sobha.u.frappe.cloud |
| Cookie Modification | ✅ | ✅ |
| Path Rewrite | ✅ | ✅ |
| CORS Handling | ✅ | ✅ |

## Production Considerations

For production deployment:

1. Set appropriate CORS origin (not `true`)
2. Add rate limiting
3. Add authentication/authorization
4. Use environment variables for sensitive data
5. Enable HTTPS
6. Add request validation
7. Implement proper logging (Winston, Pino, etc.)
