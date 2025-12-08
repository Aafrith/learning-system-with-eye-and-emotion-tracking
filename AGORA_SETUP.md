# Agora Video Calling Setup Guide

## 🎥 Overview

Your learning system now includes **real-time video calling** powered by Agora.io. Teachers and students can have face-to-face video meetings during sessions.

## 🚀 Quick Setup

### Step 1: Get Agora Credentials (5 minutes)

1. **Sign up for Agora**: https://console.agora.io/
2. **Create a new project**:
   - Click "Create Project"
   - Enter project name: "Learning System"
   - Choose "Secured mode: APP ID + Token"
3. **Get your credentials**:
   - Copy the **App ID**
   - Enable **App Certificate** and copy it

### Step 2: Configure Backend (2 minutes)

Update `backend/.env`:

```env
# Agora Configuration
AGORA_APP_ID=your_actual_app_id_here
AGORA_APP_CERTIFICATE=your_actual_certificate_here
```

### Step 3: Install Dependencies (3 minutes)

**Backend:**
```powershell
cd backend
pip install agora-token-builder
```

**Frontend:**
```powershell
cd frontend
npm install agora-rtc-sdk-ng
```

### Step 4: Start the System

```powershell
# Backend
cd backend
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm run dev
```

### Step 5: Test It!

1. Login as teacher
2. Create a session
3. Join the session
4. Video call automatically starts! 🎉

## 📋 Features

✅ **HD Video Calling** - Up to 1080p quality
✅ **Multi-party Support** - Multiple students can join
✅ **Audio/Video Controls** - Mute/unmute, video on/off
✅ **Grid Layout** - Automatic layout for participants
✅ **Fullscreen Mode** - Immersive video experience
✅ **Token-based Security** - Secure authentication
✅ **Low Latency** - <400ms global latency

## 🎯 Usage

### For Teachers

Video call component is integrated into the teacher dashboard:

```tsx
import AgoraVideoCall from '@/components/AgoraVideoCall'

function TeacherDashboard() {
  return (
    <AgoraVideoCall
      sessionId={session._id}
      userId={teacherId}
      userName={teacherName}
      isTeacher={true}
    />
  )
}
```

### For Students

Similarly integrated into student dashboard:

```tsx
<AgoraVideoCall
  sessionId={session._id}
  userId={studentId}
  userName={studentName}
  isTeacher={false}
/>
```

## 🔧 API Endpoints

### Get Agora Token
```bash
POST /api/agora/token
Content-Type: application/json
Authorization: Bearer {token}

{
  "channel_name": "session_id",
  "uid": 0,
  "role": 1
}

Response:
{
  "token": "agora_rtc_token...",
  "app_id": "your_app_id",
  "channel_name": "session_id",
  "uid": 0,
  "expires_in": 3600
}
```

### Check Configuration
```bash
GET /api/agora/config
Authorization: Bearer {token}

Response:
{
  "available": true,
  "app_id": "your_app_id",
  "status": "configured"
}
```

### Health Check
```bash
GET /api/agora/health

Response:
{
  "status": "healthy",
  "configured": true,
  "message": "Agora video service is ready"
}
```

## 🎨 Integration Example

### Complete Teacher Dashboard with Video

```tsx
'use client'

import { useState } from 'react'
import AgoraVideoCall from '@/components/AgoraVideoCall'

export default function TeacherDashboard() {
  const [showVideo, setShowVideo] = useState(false)
  const sessionId = "current_session_id"
  const teacherId = "teacher_123"
  const teacherName = "Dr. Smith"

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>
      
      {/* Start Video Call Button */}
      {!showVideo && (
        <button
          onClick={() => setShowVideo(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start Video Call
        </button>
      )}

      {/* Video Call Component */}
      {showVideo && (
        <div className="mb-6">
          <AgoraVideoCall
            sessionId={sessionId}
            userId={teacherId}
            userName={teacherName}
            isTeacher={true}
            onCallEnd={() => setShowVideo(false)}
          />
        </div>
      )}

      {/* Rest of dashboard... */}
    </div>
  )
}
```

## 🔄 How It Works

```
1. User clicks "Start Video Call"
   ↓
2. Frontend requests token from backend
   ↓
3. Backend generates Agora token
   ↓
4. Frontend initializes Agora client
   ↓
5. User joins video channel
   ↓
6. Camera/microphone activated
   ↓
7. Video streams to other participants
   ↓
8. Real-time communication established!
```

## ⚙️ Customization

### Change Video Quality

In `frontend/src/lib/agora.ts`:

```typescript
async createLocalTracks(): Promise<void> {
  const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
    {}, // Audio config
    {
      encoderConfig: {
        width: 1280,  // Change resolution
        height: 720,
        frameRate: 30, // Change frame rate
        bitrateMax: 2000, // Change bitrate
      }
    }
  )
  
  this.localAudioTrack = audioTrack
  this.localVideoTrack = videoTrack
}
```

### Change Token Expiration

In `backend/routers/agora_router.py`:

```python
token = generate_agora_token(
    channel_name=request.channel_name,
    uid=request.uid,
    role=request.role,
    expiration_time_in_seconds=7200  # 2 hours instead of 1
)
```

### Grid Layout Options

In `frontend/src/components/AgoraVideoCall.tsx`:

```tsx
// Modify grid classes for different layouts
<div className={`grid gap-2 p-4 ${
  remoteUsers.length === 0 ? 'grid-cols-1' :
  remoteUsers.length === 1 ? 'grid-cols-2' :
  remoteUsers.length <= 4 ? 'grid-cols-2 grid-rows-2' :
  'grid-cols-3 grid-rows-3'  // Support more users
}`}>
```

## 🐛 Troubleshooting

### "Agora not configured" Error
**Solution**: Set `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` in `backend/.env`

### Camera/Microphone Permission Denied
**Solution**: Grant browser permissions, check browser settings

### No Video Showing
**Solution**: 
- Check if camera is in use by another app
- Verify Agora credentials are correct
- Check browser console for errors

### Poor Video Quality
**Solution**:
- Check internet connection (min 2 Mbps recommended)
- Reduce video resolution in config
- Close bandwidth-heavy applications

### Token Expired
**Solution**: Tokens expire after 1 hour. The system automatically refreshes, but you can increase expiration time in backend.

## 📊 Agora Pricing

- **Free Tier**: 10,000 minutes/month
- **Pay-as-you-go**: $0.99 per 1,000 minutes
- **Enterprise**: Custom pricing

For this learning system with ~30 students:
- 1 hour session = ~30 hours of minutes consumed
- Free tier = ~333 hours of sessions per month

## 🔒 Security

✅ Token-based authentication
✅ 1-hour token expiration
✅ Channel-based isolation (each session = separate channel)
✅ User authentication required
✅ No storage of video data

## 🎓 Next Steps

1. **✅ Complete Agora setup** (Steps 1-4 above)
2. **🧪 Test with 2+ users** (Use different browsers/devices)
3. **🎨 Customize UI** (Colors, layout, controls)
4. **📱 Test on mobile** (Responsive design included)
5. **🚀 Deploy to production** (Update CORS settings)

## 📚 Resources

- **Agora Docs**: https://docs.agora.io/
- **SDK Reference**: https://api-ref.agora.io/en/video-sdk/web/4.x/
- **Console**: https://console.agora.io/
- **Support**: https://agora.io/support/

## ✅ Integration Complete!

Your video calling is now fully integrated with:
- ✅ Emotion detection (runs simultaneously)
- ✅ Session management
- ✅ Teacher/student roles
- ✅ Real-time updates
- ✅ MongoDB storage

Enjoy seamless video communication in your learning system! 🎉
