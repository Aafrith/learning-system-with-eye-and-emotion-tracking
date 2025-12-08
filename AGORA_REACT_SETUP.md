# Agora React Hooks Setup Guide

## ✅ Installation Complete

You've already installed:
```bash
npm install agora-rtc-react agora-rtc-sdk-ng
```

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your Agora App ID

1. Visit [Agora Console](https://console.agora.io)
2. Sign up or log in
3. Create a new project
4. Copy your **App ID**

### Step 2: Configure Environment Variables

Create `.env.local` in your frontend directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` and add your App ID:
```env
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 3: Use the Components

Two components are available:

#### 1. **AgoraVideoCallReact** - Multi-party Video Call
Best for: Small group discussions, peer-to-peer learning

```tsx
import AgoraVideoCallReact from "@/components/AgoraVideoCallReact";
import { agoraConfig } from "@/lib/agoraConfig";

<AgoraVideoCallReact
  sessionId="session_123"
  userId="user_456"
  userName="John Doe"
  appId={agoraConfig.appId}
  onCallEnd={() => console.log("Call ended")}
/>
```

#### 2. **InteractiveLiveStreaming** - Teacher-Student Streaming
Best for: Large classes, lectures, webinars

```tsx
import InteractiveLiveStreaming from "@/components/InteractiveLiveStreaming";
import { agoraConfig } from "@/lib/agoraConfig";

// Teacher/Host view
<InteractiveLiveStreaming
  sessionId="session_123"
  userId="teacher_1"
  userName="Dr. Smith"
  appId={agoraConfig.appId}
  isHost={true}
  onCallEnd={() => console.log("Stream ended")}
/>

// Student/Audience view
<InteractiveLiveStreaming
  sessionId="session_123"
  userId="student_456"
  userName="John Doe"
  appId={agoraConfig.appId}
  isHost={false}
  onCallEnd={() => console.log("Left stream")}
/>
```

## 🎯 Integration Examples

### Example 1: Teacher Dashboard

```tsx
"use client";

import { useState } from "react";
import InteractiveLiveStreaming from "@/components/InteractiveLiveStreaming";
import { agoraConfig } from "@/lib/agoraConfig";
import { Video } from "lucide-react";

export default function TeacherDashboard() {
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionId = "math_class_101";
  const teacherId = "teacher_123";

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
            isStreaming
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Video className="w-5 h-5" />
          {isStreaming ? "End Live Class" : "Start Live Class"}
        </button>
      </div>

      {isStreaming && (
        <div className="mb-6">
          <InteractiveLiveStreaming
            sessionId={sessionId}
            userId={teacherId}
            userName="Dr. Smith"
            appId={agoraConfig.appId}
            isHost={true}
            onCallEnd={() => setIsStreaming(false)}
          />
        </div>
      )}

      {/* Rest of your dashboard */}
    </div>
  );
}
```

### Example 2: Student Dashboard

```tsx
"use client";

import { useState } from "react";
import InteractiveLiveStreaming from "@/components/InteractiveLiveStreaming";
import { agoraConfig } from "@/lib/agoraConfig";

export default function StudentDashboard() {
  const [isWatching, setIsWatching] = useState(false);
  const sessionId = "math_class_101";
  const studentId = "student_456";

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Live Class</h2>
        
        {!isWatching ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Join the live session</p>
            <button
              onClick={() => setIsWatching(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Join Live Class
            </button>
          </div>
        ) : (
          <InteractiveLiveStreaming
            sessionId={sessionId}
            userId={studentId}
            userName="John Doe"
            appId={agoraConfig.appId}
            isHost={false}
            onCallEnd={() => setIsWatching(false)}
          />
        )}
      </div>
    </div>
  );
}
```

### Example 3: Small Group Video Call

```tsx
"use client";

import AgoraVideoCallReact from "@/components/AgoraVideoCallReact";
import { agoraConfig } from "@/lib/agoraConfig";

export default function StudyGroup() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Study Group</h1>
      
      <AgoraVideoCallReact
        sessionId="study_group_ai"
        userId="student_789"
        userName="Alice"
        appId={agoraConfig.appId}
        onCallEnd={() => window.location.href = "/student/dashboard"}
      />
    </div>
  );
}
```

## 🎨 Features

### AgoraVideoCallReact Features:
- ✅ Multi-party video grid (1-9 participants)
- ✅ Automatic layout adjustment
- ✅ Mic and camera controls
- ✅ Connection status indicator
- ✅ Fullscreen mode
- ✅ Participant count
- ✅ Clean, modern UI with Tailwind CSS

### InteractiveLiveStreaming Features:
- ✅ Host/Audience role separation
- ✅ Large host video + audience thumbnails
- ✅ Role switching (audience can request to speak)
- ✅ Live indicator
- ✅ Participant count
- ✅ Optimized for large audiences
- ✅ Low latency streaming

## 🔧 Configuration Options

### Component Props

```tsx
interface AgoraVideoCallProps {
  sessionId: string;      // Unique channel name
  userId: string;         // User identifier
  userName: string;       // Display name
  appId: string;          // Your Agora App ID
  token?: string | null;  // Optional token for production
  onCallEnd?: () => void; // Callback when call ends
}

interface InteractiveLiveStreamingProps {
  sessionId: string;
  userId: string;
  userName: string;
  appId: string;
  token?: string | null;
  isHost?: boolean;       // true = host, false = audience
  onCallEnd?: () => void;
}
```

## 🔐 Security (Production)

For production, generate tokens from your backend:

```tsx
// Fetch token from your backend
const token = await fetch(`/api/agora/token?channel=${sessionId}&uid=${userId}`)
  .then(res => res.json())
  .then(data => data.token);

<AgoraVideoCallReact
  sessionId={sessionId}
  userId={userId}
  userName={userName}
  appId={agoraConfig.appId}
  token={token} // Use backend-generated token
  onCallEnd={handleCallEnd}
/>
```

## 🐛 Troubleshooting

### "App ID is missing"
- Make sure `.env.local` exists with `NEXT_PUBLIC_AGORA_APP_ID`
- Restart your Next.js dev server after adding env variables

### Black screen / No video
- Check camera permissions in browser
- Ensure HTTPS is used (or localhost for dev)
- Open browser console for detailed errors

### "Connection failed"
- Verify App ID is correct
- Check your internet connection
- Ensure Agora Console project is active

### Multiple participants not showing
- All participants must use the same `sessionId`
- Check browser console for WebRTC errors
- Verify firewall allows WebRTC traffic

## 📚 Resources

- [Agora React SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-js)
- [Agora Console](https://console.agora.io)
- [Sample Projects](https://github.com/AgoraIO-Community/agora-react-uikit)

## 🎯 Next Steps

1. ✅ Get your Agora App ID
2. ✅ Configure `.env.local`
3. ✅ Choose your component (video call or live streaming)
4. ✅ Integrate into your dashboard
5. ✅ Test with multiple devices
6. 🔒 Add token authentication for production
