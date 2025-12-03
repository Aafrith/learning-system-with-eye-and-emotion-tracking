# Frontend Integration Complete! 🎉

The frontend has been successfully integrated with the FastAPI backend for real-time functionality.

## ✅ What's Been Updated

### 1. API Service Layer (`/src/lib/api.ts`)
Complete API service with all endpoints:
- **Authentication**: login, signup, profile updates, password change
- **Sessions**: create, join, leave, start, end sessions  
- **Admin**: user management, session management, statistics
- **Notifications**: get, mark as read, unread count

### 2. Authentication Context (`/src/contexts/AuthContext.tsx`)
- ✅ Replaced mock authentication with real API calls
- ✅ JWT token management (stored in localStorage)
- ✅ Automatic token validation on page load
- ✅ Proper user data transformation from backend format

### 3. WebSocket Manager (`/src/lib/websocket.ts`)
- ✅ Real-time bidirectional communication
- ✅ Automatic reconnection with exponential backoff
- ✅ Ping/pong keepalive mechanism
- ✅ Event-based message handling
- ✅ Separate connections for teachers and students

### 4. Custom Hooks
#### `useTeacherSession` (`/src/hooks/useTeacherSession.ts`)
- Create, start, and end sessions
- Real-time student updates via WebSocket
- Load past and active sessions
- Session refresh functionality

#### `useStudentSession` (`/src/hooks/useStudentSession.ts`)
- Join and leave sessions
- Real-time engagement updates
- Send emotion and focus data via WebSocket
- Load session history

### 5. Environment Configuration
- `.env.local` - Local environment variables
- `.env.example` - Example configuration template

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 6. Updated Pages
- ✅ Change Password - Now uses real API
- ✅ All authentication flows - Real JWT-based auth
- ✅ Dashboard pages ready for real-time updates

## 🚀 How to Use

### 1. Start the Backend Server
```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# or
source venv/bin/activate      # Linux/Mac

python main.py
# or
uvicorn main:app --reload
```

Backend will run on: http://localhost:8000

### 2. Start the Frontend Server
```bash
cd frontend
npm run dev
```

Frontend will run on: http://localhost:3000

### 3. Test the Integration

#### Login with Default Accounts
```
Teacher:
  Email: teacher@example.com
  Password: teacher123

Student:
  Email: student@example.com
  Password: student123

Admin:
  Email: admin@example.com
  Password: admin123
```

#### Test Teacher Flow
1. Login as teacher
2. Create a new session
3. Start the session
4. Share the session code
5. WebSocket automatically connects
6. See real-time student updates

#### Test Student Flow
1. Login as student
2. Join session with code
3. WebSocket automatically connects
4. Engagement data sent in real-time

## 📡 Real-Time Features

### Teacher Dashboard
- **Real-time student list updates** when students join/leave
- **Live engagement tracking** for each student
- **Instant emotion detection updates**
- **Focus level monitoring**
- **Session analytics** updated live

### Student Dashboard
- **Real-time session updates** from teacher
- **Automatic engagement tracking**
- **Live emotion detection**
- **Focus alerts** from system

## 🔐 Authentication Flow

```javascript
// 1. User logs in
const response = await authApi.login(email, password)

// 2. Token stored automatically
localStorage.setItem('access_token', response.access_token)
localStorage.setItem('user', JSON.stringify(response.user))

// 3. Token sent with all API requests
headers: {
  'Authorization': `Bearer ${token}`
}

// 4. WebSocket authenticated by user ID in URL
ws://localhost:8000/ws/session/{sessionId}/teacher/{teacherId}
```

## 🔄 WebSocket Communication

### Teacher Connection
```typescript
const ws = createTeacherWebSocket(sessionId, teacherId)

// Listen for student updates
ws.on('student_update', (data) => {
  console.log('Student updated:', data)
  // {
  //   student_id: '...',
  //   student_name: '...',
  //   emotion: 'happy',
  //   engagement: 'active',
  //   focus_level: 85
  // }
})

await ws.connect()
```

### Student Connection
```typescript
const ws = createStudentWebSocket(sessionId, studentId)

// Send engagement update
ws.send({
  type: 'engagement_update',
  data: {
    emotion: 'focused',
    engagement: 'active',
    focus_level: 90
  }
})

await ws.connect()
```

## 📊 Data Flow

```
Frontend                    Backend                     Database
--------                    -------                     --------

1. User Action
   └─> API Call          ─> FastAPI Endpoint       ─> MongoDB
                             └─> Process
                             └─> Validate
                             └─> Store             ─> Collection

2. Real-time Update
   ├─> WebSocket Send    ─> WebSocket Handler
   │                        └─> Update Session    ─> MongoDB
   │                        └─> Broadcast
   └─< WebSocket Receive <─ Push to Clients
       └─> Update UI
```

## 🛠️ Component Integration Examples

### Using the Teacher Session Hook
```typescript
import { useTeacherSession } from '@/hooks/useTeacherSession'
import { useAuth } from '@/contexts/AuthContext'

function TeacherComponent() {
  const { user } = useAuth()
  const { 
    currentSession, 
    createSession, 
    startSession, 
    endSession 
  } = useTeacherSession(user!.id)

  const handleCreate = async () => {
    await createSession('Mathematics', 30)
  }

  const handleStart = async () => {
    if (currentSession) {
      await startSession(currentSession._id)
    }
  }

  return (
    // Your UI
  )
}
```

### Using the Student Session Hook
```typescript
import { useStudentSession } from '@/hooks/useStudentSession'
import { useAuth } from '@/contexts/AuthContext'

function StudentComponent() {
  const { user } = useAuth()
  const { 
    currentSession, 
    joinSession, 
    updateEngagement 
  } = useStudentSession(user!.id)

  const handleJoin = async (code: string) => {
    await joinSession(code)
  }

  const handleEngagement = async () => {
    await updateEngagement('happy', 'active', 85)
  }

  return (
    // Your UI
  )
}
```

## 🔍 Debugging

### Check API Connection
```typescript
// In browser console
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
```

### Check WebSocket Connection
```typescript
// In browser console
const ws = new WebSocket('ws://localhost:8000/ws/session/test/test')
ws.onopen = () => console.log('Connected')
ws.onmessage = (e) => console.log('Message:', e.data)
```

### Check Local Storage
```typescript
// In browser console
console.log('Token:', localStorage.getItem('access_token'))
console.log('User:', localStorage.getItem('user'))
```

## 🐛 Troubleshooting

### Issue: "Failed to fetch"
**Solution**: Ensure backend server is running on port 8000

### Issue: WebSocket connection fails
**Solution**: 
1. Check backend is running
2. Check session ID and user ID are valid
3. Check WebSocket URL in .env.local

### Issue: "No authentication token"
**Solution**: Login again to get a fresh token

### Issue: CORS errors
**Solution**: Backend CORS is configured for localhost:3000. If using different port, update backend's CORS settings in `main.py`

## 📝 Next Steps

1. **Add Video Feed Integration** - Connect camera for emotion detection
2. **Add Gaze Tracking** - Implement eye tracking features
3. **Enhance UI** - Add more visual feedback for real-time data
4. **Add Notifications** - Real-time notification system
5. **Add Analytics** - Detailed session analytics and reports

## ✨ Features Now Working

- ✅ Real user authentication with JWT
- ✅ Session creation and management
- ✅ Real-time student-teacher communication
- ✅ Live engagement tracking
- ✅ Session joining with codes
- ✅ Profile updates
- ✅ Password changes
- ✅ Role-based access control
- ✅ Automatic token refresh
- ✅ WebSocket reconnection
- ✅ Error handling

## 🎯 Ready for Production

To prepare for production:

1. **Update Environment Variables**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com
```

2. **Secure Backend**
- Change SECRET_KEY in backend/.env
- Enable HTTPS
- Configure proper CORS origins
- Add rate limiting

3. **Deploy**
- Frontend: Vercel/Netlify
- Backend: AWS/DigitalOcean/Heroku
- Database: MongoDB Atlas

## 🎉 Success!

Your learning system is now **fully integrated** with real-time capabilities! Students and teachers can interact in real-time with automatic WebSocket connections and live data updates.
