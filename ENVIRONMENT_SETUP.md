# Environment Configuration Guide

This guide explains how to configure environment variables for both backend and frontend.

## Backend Configuration

### Location: `backend/.env`

```env
# MongoDB Configuration
MONGODB_URL=mongodb+srv://learning_system:password@cluster0.mongodb.net/
DATABASE_NAME=learning_system

# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration
BACKEND_URL=http://localhost:8000
BACKEND_PORT=8000

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017/` | Yes |
| `DATABASE_NAME` | Database name | `learning_system` | Yes |
| `SECRET_KEY` | JWT secret key for authentication | - | Yes |
| `ALGORITHM` | JWT algorithm | `HS256` | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` | No |
| `BACKEND_URL` | Backend server URL | `http://localhost:8000` | No |
| `BACKEND_PORT` | Backend server port | `8000` | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` | Yes |

## Frontend Configuration

### Location: `frontend/.env.local`

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id_here
NEXT_PUBLIC_AGORA_TOKEN=
```

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` | Yes |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL | `ws://localhost:8000` | Yes |
| `NEXT_PUBLIC_AGORA_APP_ID` | Agora App ID for video calling | - | Yes |
| `NEXT_PUBLIC_AGORA_TOKEN` | Agora token (optional for dev) | - | No |

## Setup Instructions

### 1. Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Copy the example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and configure your values:
   - Set your MongoDB connection string
   - Generate a secure `SECRET_KEY` (use: `openssl rand -hex 32`)
   - Update `FRONTEND_URL` if using a different port or domain

### 2. Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

3. Edit `.env.local` and configure your values:
   - Set `NEXT_PUBLIC_AGORA_APP_ID` from [Agora Console](https://console.agora.io)
   - Update API URLs if backend is on a different port/domain

## Production Configuration

### Backend (Production)

```env
# Use production MongoDB
MONGODB_URL=mongodb+srv://user:password@production-cluster.mongodb.net/

# Strong secret key
SECRET_KEY=use-a-very-strong-random-secret-key-here

# Production URLs
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Frontend (Production)

```env
# Production API URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Production Agora settings
NEXT_PUBLIC_AGORA_APP_ID=your_production_app_id
NEXT_PUBLIC_AGORA_TOKEN=your_production_token
```

## Using Dev Tunnels (for remote testing)

### Backend with Dev Tunnels

1. Start a dev tunnel:
   ```bash
   devtunnel create --allow-anonymous
   devtunnel port create 8000
   devtunnel host
   ```

2. Update backend `.env`:
   ```env
   FRONTEND_URL=https://your-tunnel-url.devtunnels.ms
   ```

### Frontend with Dev Tunnels

Update frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://backend-tunnel.devtunnels.ms
NEXT_PUBLIC_WS_URL=wss://backend-tunnel.devtunnels.ms
```

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that backend is using the correct CORS settings

### WebSocket Connection Failed
- Verify `NEXT_PUBLIC_WS_URL` is correct
- Use `ws://` for HTTP and `wss://` for HTTPS
- Check firewall/network settings

### API Connection Failed
- Verify `NEXT_PUBLIC_API_URL` is correct and reachable
- Check backend is running on the specified port
- Ensure no port conflicts

### Environment Variables Not Loading
- **Frontend**: Restart Next.js dev server after changing `.env.local`
- **Backend**: Restart FastAPI server after changing `.env`
- **Note**: Frontend env vars must start with `NEXT_PUBLIC_` to be accessible

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` by default
2. **Use strong secret keys** - Generate with: `openssl rand -hex 32`
3. **Rotate secrets regularly** in production
4. **Use environment-specific configs** - Different values for dev/staging/prod
5. **Restrict CORS origins** in production to only your frontend domain
6. **Use HTTPS/WSS** in production
7. **Keep Agora credentials secure** - Never expose in client-side code (tokens only)

## Quick Reference

### Start Development Servers

**Backend:**
```bash
cd backend
python main.py
# Runs on http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Check Configuration

**Backend:**
```python
from backend.config import settings
print(f"API URL: {settings.BACKEND_URL}")
print(f"Frontend: {settings.FRONTEND_URL}")
```

**Frontend (in browser console):**
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL)
```

## Migration from Hardcoded URLs

All hardcoded URLs have been replaced with environment variables:

### Backend Changes
- ✅ CORS origins now use `settings.FRONTEND_URL`
- ✅ All URLs configurable via `.env`

### Frontend Changes
- ✅ All API calls use `process.env.NEXT_PUBLIC_API_URL`
- ✅ All WebSocket connections use `process.env.NEXT_PUBLIC_WS_URL`
- ✅ Components: StudentDashboard, TeacherDashboard, LearningSession
- ✅ Libraries: api.ts, websocket.ts, agora.ts

### Files Updated
**Backend:**
- `config.py` - Added BACKEND_URL, BACKEND_PORT
- `main.py` - CORS uses settings
- `.env` - Added server configuration
- `.env.example` - Updated with all variables

**Frontend:**
- `src/components/StudentDashboard.tsx` - All endpoints
- `src/components/TeacherDashboard.tsx` - WebSocket endpoint
- `src/components/LearningSession.tsx` - API endpoint
- `src/lib/websocket.ts` - WebSocket manager
- `.env.local` - Added WS_URL
- `.env.example` - Updated with all variables
- `.env.local.example` - Updated with all variables
