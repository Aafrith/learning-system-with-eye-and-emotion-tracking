# Emotion Detection Troubleshooting Guide

## Current Status
The emotion detection system is integrated but requires proper backend connection and model files.

## Architecture Flow

```
Student Dashboard (Frontend)
    ↓
VideoFeed Component captures frames every 500ms
    ↓
Sends base64 frames via WebSocket: ws://localhost:8000/ws/session/{session_id}/student/{student_name}
    ↓
Backend WebSocket endpoint receives frames
    ↓
EmotionDetector.process_base64_frame() analyzes the frame
    ↓
Returns emotion data: { emotion, confidence, engagement, focus_level, face_detected }
    ↓
Backend sends result back via WebSocket with type: 'emotion_result'
    ↓
VideoFeed receives result and calls onEmotionDetected callback
    ↓
StudentDashboard updates stats and displays emotion with emoji
```

## Required Setup

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Run the startup script
.\start_backend.ps1
```

**Or manually:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

### 2. Verify Model Files

The backend needs these files in `backend/models/`:
- `emotion_model.joblib` ✅ (exists)
- `label_encoder.joblib` ✅ (exists)

### 3. Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies if needed
npm install

# Start the development server
npm run dev
```

## Testing the Flow

### Step 1: Start Backend
```powershell
cd backend
python main.py
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Check Backend Health

Open browser: http://localhost:8000/api/emotion/health

Should return:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "models/emotion_model.joblib",
  "labels_path": "models/label_encoder.joblib"
}
```

### Step 3: Start Frontend
```powershell
cd frontend
npm run dev
```

Open: http://localhost:3000

### Step 4: Test Emotion Detection

1. **Login** (or signup)
2. **Select Student role**
3. **Enter your name** (e.g., "John")
4. **Create or join a session** with a session code
5. **Check browser console** (F12) for logs:
   - "Connected to session WebSocket"
   - "Starting frame capture interval (500ms)"
   - "Frame sent to backend via WebSocket"
   - "WebSocket message received: emotion_result"
   - "Emotion result: { emotion: 'happy', confidence: 0.87, ... }"

6. **Look for emotion display**:
   - Top of session card: Large emoji badge (😊 😠 😢 etc.)
   - Video feed header: Emotion text
   - Engagement section: Current emotion badge

## Common Issues and Fixes

### Issue 1: "No face detected" or "AI Processing..."

**Causes:**
- Backend not running
- WebSocket not connected
- Model files missing/corrupted
- Camera not accessible
- Poor lighting conditions

**Fixes:**
```powershell
# 1. Check backend is running
# Open http://localhost:8000 - should see API message

# 2. Check browser console for WebSocket errors
# Should see "Connected to session WebSocket"

# 3. Verify model files exist
cd backend
dir models
# Should list emotion_model.joblib and label_encoder.joblib

# 4. Test camera separately
# Go to https://webcamtests.com/ to verify camera works

# 5. Check face is visible and well-lit
# Face detection requires clear frontal face view
```

### Issue 2: WebSocket connection fails

**Symptoms:** Console shows "WebSocket error" or connection refused

**Fixes:**
```powershell
# 1. Ensure backend is running on port 8000
netstat -ano | findstr :8000

# 2. Check CORS settings in backend/main.py
# Should include "http://localhost:3000"

# 3. Verify WebSocket URL format
# Should be: ws://localhost:8000/ws/session/{session_id}/student/{student_name}
```

### Issue 3: Frames not being sent

**Check these in browser console:**
- "Starting frame capture interval (500ms)" ✓
- "Frame sent to backend via WebSocket" (repeating every 500ms) ✓
- Video element should show your camera feed ✓

**If missing:**
```javascript
// Check in console:
// 1. Is session active?
console.log('isInSession:', /* should be true */)

// 2. Is WebSocket connected?
console.log('WebSocket state:', /* should be 1 (OPEN) */)

// 3. Is camera active?
console.log('Video element has stream:', /* should be true */)
```

### Issue 4: Backend processes frames but no results

**Check backend terminal output:**
```
INFO:     127.0.0.1:xxxxx - "WebSocket /ws/session/{id}/student/{name}" [accepted]
# Should see processing logs when frames arrive
```

**Test emotion detection directly:**
```powershell
# In backend directory with venv activated
python

>>> from emotion_detector import EmotionDetector
>>> detector = EmotionDetector("models/emotion_model.joblib", "models/label_encoder.joblib")
>>> # If no errors, detector is working
```

## Expected Console Output

### Frontend (Browser Console)
```
Connected to session WebSocket
Session ID: abc123, Student: John
Starting frame capture interval (500ms)
Frame sent to backend via WebSocket
Frame sent to backend via WebSocket
Frame sent to backend via WebSocket
WebSocket message received: emotion_result
Emotion result: {
  emotion: "happy",
  raw_emotion: "happy", 
  confidence: 0.87,
  engagement: "active",
  focus_level: 85,
  face_detected: true,
  pose: { yaw: 2.3, pitch: -5.1, roll: 1.2 }
}
```

### Backend (Terminal)
```
INFO:     Application started successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
Emotion detector initialized successfully
Student John connected to session abc123
Processing video frame from student John
Detected emotion: happy (confidence: 0.87)
```

## Quick Debug Commands

```powershell
# Check if backend is responsive
curl http://localhost:8000/health

# Check emotion detection health
curl http://localhost:8000/api/emotion/health

# View active WebSocket connections
# (Check backend terminal for connection logs)

# Test frontend WebSocket in browser console
ws = new WebSocket('ws://localhost:8000/ws/session/test123/student/TestUser')
ws.onopen = () => console.log('Connected!')
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data))
```

## System Requirements

- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Webcam** with permissions granted
- **Modern browser** (Chrome, Edge, Firefox)
- **Good lighting** for face detection
- **Stable internet** for MongoDB Atlas connection

## Performance Tips

1. **Frame Rate**: Currently 2 FPS (every 500ms)
   - Adjust in VideoFeed.tsx line ~82: `setInterval(() => { captureAndSendFrame() }, 500)`
   - Lower = faster response, higher CPU usage
   - Higher = slower response, lower CPU usage

2. **Image Quality**: Currently 0.8 JPEG quality
   - Adjust in VideoFeed.tsx line ~113: `canvas.toDataURL('image/jpeg', 0.8)`
   - Higher = better detection, larger data transfer
   - Lower = faster transfer, less accurate

3. **Face Detection**: Requires MediaPipe Face Mesh
   - Works best with frontal face view
   - Minimum face size: ~100x100 pixels in frame
   - Optimal distance: 50-100cm from camera

## Support

If issues persist after following this guide:

1. **Check error logs** in both frontend console and backend terminal
2. **Verify all services are running** (backend, frontend, MongoDB)
3. **Test with good lighting** and clear face visibility
4. **Review WebSocket connection** in Network tab (F12 → Network → WS)
5. **Ensure model files are valid** by testing EmotionDetector directly

## Success Criteria

✅ Backend running on port 8000
✅ Frontend running on port 3000  
✅ WebSocket connects successfully
✅ Camera feed visible in VideoFeed component
✅ Frames sent every 500ms (check console logs)
✅ Emotion results received from backend
✅ Emoji and emotion text displayed in UI
✅ Engagement and focus level updating
