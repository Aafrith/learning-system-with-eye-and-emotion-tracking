# Agora React Hooks - Quick Start Guide

## ✅ What's Been Set Up

1. **Installed Packages:**
   - ✅ `agora-rtc-react` - React hooks for Agora
   - ✅ `agora-rtc-sdk-ng` - Agora Web SDK

2. **Created Components:**
   - ✅ `AgoraVideoCallReact.tsx` - Multi-party video calls (peer-to-peer)
   - ✅ `InteractiveLiveStreaming.tsx` - Teacher-student streaming (host/audience)
   - ✅ `TeacherDashboardWithAgora.tsx` - Teacher dashboard integration example
   - ✅ `StudentDashboardWithAgora.tsx` - Student dashboard integration example

3. **Configuration Files:**
   - ✅ `lib/agoraConfig.ts` - Centralized configuration
   - ✅ `.env.local` - Environment variables (needs your App ID)

## 🚀 Get Started in 3 Steps

### Step 1: Get Your Agora App ID (2 minutes)

1. Go to [https://console.agora.io](https://console.agora.io)
2. Sign up or log in
3. Click "Create Project"
4. Copy your **App ID**

### Step 2: Configure Environment (1 minute)

Edit `frontend/.env.local` and replace the placeholder:

```env
NEXT_PUBLIC_AGORA_APP_ID=your_actual_app_id_here
```

**Important:** Restart your Next.js dev server after changing this file!

```powershell
# Stop the server (Ctrl+C), then restart:
cd frontend
npm run dev
```

### Step 3: Choose Your Component (1 minute)

Pick the one that fits your use case:

#### Option A: Interactive Live Streaming (Recommended for Classes)
**Best for:** Teacher-led lectures with many students

```tsx
import InteractiveLiveStreaming from "@/components/InteractiveLiveStreaming";
import { agoraConfig } from "@/lib/agoraConfig";

// Teacher view
<InteractiveLiveStreaming
  sessionId="math_class_101"
  userId="teacher_123"
  userName="Dr. Smith"
  appId={agoraConfig.appId}
  isHost={true}
/>

// Student view
<InteractiveLiveStreaming
  sessionId="math_class_101"
  userId="student_456"
  userName="John Doe"
  appId={agoraConfig.appId}
  isHost={false}
/>
```

#### Option B: Multi-Party Video Call (Recommended for Small Groups)
**Best for:** Study groups, 1-on-1 tutoring, small discussions

```tsx
import AgoraVideoCallReact from "@/components/AgoraVideoCallReact";
import { agoraConfig } from "@/lib/agoraConfig";

<AgoraVideoCallReact
  sessionId="study_group_01"
  userId="student_789"
  userName="Alice"
  appId={agoraConfig.appId}
/>
```

## 🎨 Ready-to-Use Dashboard Examples

### Teacher Dashboard

Replace your existing teacher dashboard page with:

```tsx
import TeacherDashboardWithAgora from "@/components/TeacherDashboardWithAgora";
import { useAuth } from "@/contexts/AuthContext";

export default function TeacherPage() {
  const { user } = useAuth();
  
  return (
    <TeacherDashboardWithAgora
      teacherName={user.name}
      teacherId={user.id}
      sessionId="session_123"
    />
  );
}
```

### Student Dashboard

Replace your existing student dashboard page with:

```tsx
import StudentDashboardWithAgora from "@/components/StudentDashboardWithAgora";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentPage() {
  const { user } = useAuth();
  
  return (
    <StudentDashboardWithAgora
      studentName={user.name}
      studentId={user.id}
      sessionId="session_123"
    />
  );
}
```

## 🧪 Test It Right Now!

1. **Start your dev server** (if not already running):
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Open two browser windows:**
   - Window 1: Go to teacher dashboard
   - Window 2: Go to student dashboard (or use incognito mode)

3. **Teacher:** Click "Start Live Class"
4. **Student:** Enter the same session ID and click "Join Live Class"
5. **Result:** Student sees teacher's video live! 🎉

## 📋 Component Features Comparison

| Feature | InteractiveLiveStreaming | AgoraVideoCallReact |
|---------|-------------------------|---------------------|
| **Use Case** | Large classes, lectures | Small groups, discussions |
| **Layout** | Large host + thumbnails | Equal-sized grid |
| **Roles** | Host/Audience | All equal participants |
| **Best For** | 1 teacher → many students | Peer-to-peer learning |
| **Participants** | 1 host + unlimited audience | Up to 9 (recommended) |
| **Controls** | Host: full, Audience: minimal | Everyone: full controls |

## 🎯 What Each Component Does

### InteractiveLiveStreaming
- ✅ Teacher streams to many students
- ✅ Large teacher video (main view)
- ✅ Small student thumbnails (bottom right)
- ✅ Students can "Request to Speak"
- ✅ Host/Audience role switching
- ✅ Perfect for lectures and webinars

### AgoraVideoCallReact
- ✅ Everyone sees everyone equally
- ✅ Automatic grid layout (1-9 people)
- ✅ All participants have full controls
- ✅ Fullscreen mode
- ✅ Perfect for study groups and discussions

## 🔧 Common Props

Both components use these props:

```tsx
interface CommonProps {
  sessionId: string;      // Channel name (same = join same room)
  userId: string;         // Unique user identifier
  userName: string;       // Display name
  appId: string;          // Your Agora App ID
  token?: string | null;  // Optional (for production security)
  onCallEnd?: () => void; // Callback when user leaves
}
```

Plus `InteractiveLiveStreaming` has:
```tsx
isHost?: boolean;  // true = teacher, false = student
```

## 🐛 Troubleshooting

### "App ID is missing" error
**Solution:** 
1. Check if `.env.local` exists in `frontend/` folder
2. Verify `NEXT_PUBLIC_AGORA_APP_ID` is set
3. **Restart your Next.js dev server** (important!)

### Black screen / No video
**Solutions:**
- Allow camera permissions in browser
- Use HTTPS in production (HTTP only works on localhost)
- Check browser console for errors

### Can't see other participants
**Check:**
- Both users using same `sessionId`? ✓
- Both have camera/mic permissions? ✓
- Internet connection stable? ✓

### "Connection failed"
**Check:**
- App ID is correct (no spaces, quotes)
- Internet connection working
- Firewall allows WebRTC

## 📖 More Resources

- Full documentation: `AGORA_REACT_SETUP.md`
- [Agora React SDK Docs](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-js)
- [Agora Console](https://console.agora.io)

## ⚡ Quick Commands

```powershell
# Install dependencies (already done)
npm install agora-rtc-react agora-rtc-sdk-ng

# Start dev server
npm run dev

# Build for production
npm run build
```

## 🎉 You're All Set!

Just add your Agora App ID to `.env.local` and start using the components!

**Need help?** Check `AGORA_REACT_SETUP.md` for detailed examples and advanced usage.
