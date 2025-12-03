# FastAPI Backend - Complete Setup Guide

## ✅ Setup Complete!

The FastAPI backend with MongoDB integration has been successfully created and is now running!

## 📁 Project Structure

```
backend/
├── main.py                    # Main FastAPI application
├── config.py                  # Configuration settings
├── database.py                # MongoDB connection
├── models.py                  # Pydantic models
├── auth.py                    # Authentication utilities
├── utils.py                   # Helper functions
├── init_db.py                 # Database initialization script
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
├── .env.example              # Environment template
├── .gitignore                # Git ignore file
├── README.md                 # Documentation
├── setup.ps1                 # Windows setup script
├── setup.sh                  # Linux/Mac setup script
├── start.bat                 # Windows start script
├── start.sh                  # Linux/Mac start script
└── routers/
    ├── __init__.py           # Router package init
    ├── auth_router.py        # Authentication endpoints
    ├── sessions_router.py    # Session management endpoints
    ├── admin_router.py       # Admin endpoints
    ├── notifications_router.py # Notification endpoints
    └── websocket_router.py   # WebSocket endpoints
```

## 🚀 Server Status

**The backend server is currently running on:**
- **URL:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🗄️ Database Connection

- **MongoDB URL:** mongodb://localhost:27017/
- **Database Name:** learning_system
- **Status:** ✅ Connected and initialized

## 👥 Default Users Created

| Role    | Email                 | Password    |
|---------|----------------------|-------------|
| Admin   | admin@example.com    | admin123    |
| Teacher | teacher@example.com  | teacher123  |
| Student | student@example.com  | student123  |

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Sessions (`/api/sessions`)

**Teacher Endpoints:**
- `POST /api/sessions/create` - Create a new session
- `POST /api/sessions/{session_id}/start` - Start a session
- `POST /api/sessions/{session_id}/end` - End a session
- `GET /api/sessions/teacher` - Get all teacher's sessions
- `GET /api/sessions/teacher/active` - Get active session

**Student Endpoints:**
- `POST /api/sessions/join` - Join a session with code
- `POST /api/sessions/{session_id}/leave` - Leave a session
- `GET /api/sessions/student` - Get all student's sessions
- `GET /api/sessions/student/active` - Get active session

**Common Endpoints:**
- `GET /api/sessions/{session_id}` - Get session details
- `POST /api/sessions/{session_id}/engagement` - Update engagement data

### Admin (`/api/admin`)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/role/{role}` - Get users by role
- `GET /api/admin/users/{user_id}` - Get specific user
- `DELETE /api/admin/users/{user_id}` - Delete user
- `PUT /api/admin/users/{user_id}/role` - Update user role
- `GET /api/admin/sessions` - Get all sessions
- `GET /api/admin/sessions/active` - Get active sessions
- `DELETE /api/admin/sessions/{session_id}` - Delete session
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/engagement/{session_id}` - Get session engagement data

### Notifications (`/api/notifications`)
- `GET /api/notifications/` - Get user notifications
- `POST /api/notifications/` - Create notification
- `PUT /api/notifications/{notification_id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/{notification_id}` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

### WebSocket
- `ws://localhost:8000/ws/session/{session_id}/teacher/{teacher_id}` - Teacher session WebSocket
- `ws://localhost:8000/ws/session/{session_id}/student/{student_id}` - Student session WebSocket

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. **Login** to get an access token:
```bash
POST /api/auth/login
{
  "email": "student@example.com",
  "password": "student123"
}
```

2. **Include the token** in subsequent requests:
```
Authorization: Bearer <your_access_token>
```

## 🧪 Testing the API

### Using Swagger UI
Visit http://localhost:8000/docs and try the endpoints interactively.

### Using curl (Example)
```bash
# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123"}'

# Create Session (with token)
curl -X POST "http://localhost:8000/api/sessions/create" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Mathematics","max_students":30}'
```

## 🔄 WebSocket Usage

### Teacher Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session/{session_id}/teacher/{teacher_id}');

ws.onopen = () => {
  console.log('Teacher connected to session');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Student Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session/{session_id}/student/{student_id}');

ws.onopen = () => {
  console.log('Student connected to session');
};

// Send engagement update
ws.send(JSON.stringify({
  type: 'engagement_update',
  data: {
    emotion: 'happy',
    engagement: 'active',
    focus_level: 85
  }
}));
```

## 📊 Database Collections

- **users** - User accounts (admin, teacher, student)
- **sessions** - Learning sessions
- **engagement_data** - Student engagement history
- **notifications** - User notifications

## 🛠️ Development Commands

### Start the server
```bash
# Windows
cd backend
.\venv\Scripts\Activate.ps1
python main.py
# or
uvicorn main:app --reload

# Linux/Mac
cd backend
source venv/bin/activate
python main.py
# or
uvicorn main:app --reload
```

### Initialize/Reset Database
```bash
python init_db.py
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

## 🔧 Configuration

Edit `.env` file to configure:
- MongoDB connection string
- JWT secret key
- Token expiration time
- CORS allowed origins

## 📝 Next Steps for Frontend Integration

1. **Update frontend API calls** to point to `http://localhost:8000`
2. **Use the authentication endpoints** for login/signup
3. **Store JWT tokens** in localStorage or cookies
4. **Connect WebSockets** for real-time session updates
5. **Update the AuthContext** to use real API calls instead of mock data

### Example Frontend API Service
```typescript
// src/lib/api.ts
const API_URL = 'http://localhost:8000';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

export async function createSession(subject: string, maxStudents: number, token: string) {
  const response = await fetch(`${API_URL}/api/sessions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ subject, max_students: maxStudents })
  });
  return response.json();
}
```

## ⚠️ Important Notes

1. **MongoDB must be running** on localhost:27017
2. **Change the SECRET_KEY** in `.env` for production
3. **CORS is configured** for localhost:3000 (frontend)
4. **Default users** are created automatically on first run
5. **WebSocket connections** require valid session and user IDs

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Start MongoDB (Windows - if installed as service)
net start MongoDB

# Start MongoDB (Linux/Mac)
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Change port in uvicorn command
uvicorn main:app --reload --port 8001
```

### Module Not Found
```bash
# Ensure virtual environment is activated
# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

## ✅ Features Implemented

- ✅ User authentication (JWT)
- ✅ Role-based access control (Admin, Teacher, Student)
- ✅ Session management (create, join, start, end)
- ✅ Real-time WebSocket communication
- ✅ Student engagement tracking
- ✅ Admin dashboard APIs
- ✅ Notification system
- ✅ MongoDB integration
- ✅ CORS middleware
- ✅ API documentation (Swagger/ReDoc)
- ✅ Database initialization script

## 🎉 Success!

Your FastAPI backend is fully functional and ready to integrate with your Next.js frontend!
