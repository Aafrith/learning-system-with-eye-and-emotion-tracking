# 🚀 Quick Start Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- MongoDB running on localhost:27017

## Step 1: Start MongoDB
```bash
# Windows (if installed as service)
net start MongoDB

# Linux/Mac
sudo systemctl start mongod

# Or use MongoDB Compass
```

## Step 2: Start Backend

### Option A: Using PowerShell Script (Windows)
```powershell
cd backend
.\setup.ps1
```

### Option B: Manual Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\Activate.ps1

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Step 3: Start Frontend
```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

## Step 4: Open Browser
Navigate to: **http://localhost:3000**

## Default Login Credentials

### Teacher Account
- **Email**: teacher@example.com
- **Password**: teacher123

### Student Account
- **Email**: student@example.com
- **Password**: student123

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123

## Testing the System

### As a Teacher:
1. Login with teacher credentials
2. Click "Create New Session"
3. Enter subject name (e.g., "Mathematics 101")
4. Click "Create Session"
5. Click "Start Session"
6. Share the generated session code with students
7. Watch real-time updates as students join!

### As a Student:
1. Login with student credentials
2. Enter the session code provided by teacher
3. Click "Join Session"
4. Your engagement data is sent in real-time!

## Verify Everything Works

### ✅ Backend Health Check
Open: http://localhost:8000/health

Should return:
```json
{
  "status": "healthy"
}
```

### ✅ API Documentation
Open: http://localhost:8000/docs

You should see interactive API documentation!

### ✅ Frontend Running
Open: http://localhost:3000

You should see the login page!

### ✅ WebSocket Test
In browser console (F12):
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session/test/test')
ws.onopen = () => console.log('✅ WebSocket Connected!')
ws.onmessage = (e) => console.log('Message:', e.data)
```

## Common Issues

### ❌ Backend won't start
**Error**: "No module named 'fastapi'"
**Fix**: Make sure virtual environment is activated and dependencies are installed

### ❌ MongoDB connection failed
**Error**: "Connection refused"
**Fix**: Start MongoDB service

### ❌ Frontend won't start  
**Error**: "Cannot find module"
**Fix**: Run `npm install` in frontend directory

### ❌ API calls fail
**Error**: "Failed to fetch"
**Fix**: Make sure backend is running on port 8000

## Ports Used
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017
- **WebSocket**: ws://localhost:8000

## Stop Services

### Stop Backend
Press `Ctrl+C` in the backend terminal

### Stop Frontend
Press `Ctrl+C` in the frontend terminal

### Stop MongoDB (if needed)
```bash
# Windows
net stop MongoDB

# Linux/Mac
sudo systemctl stop mongod
```

## 🎉 You're Ready!

Your learning system is now fully operational with:
- ✅ Real user authentication
- ✅ Live session management
- ✅ Real-time WebSocket communication
- ✅ MongoDB data persistence
- ✅ Role-based access control

## Next: Add Camera & Eye Tracking

To complete the system, you'll need to integrate:
1. Camera feed for emotion detection
2. Eye tracking for gaze detection
3. ML models for emotion recognition

These features can be added to the existing WebSocket streams for real-time processing!

---

## Need Help?

- Check **FRONTEND_INTEGRATION.md** for detailed integration docs
- Check **backend/SETUP_COMPLETE.md** for backend API docs
- Check **backend/API_TESTING.md** for API testing examples

Happy coding! 🚀
