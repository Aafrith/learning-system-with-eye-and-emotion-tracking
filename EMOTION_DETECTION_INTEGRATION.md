# Emotion Detection Integration Guide

## Overview

Your learning system now includes **real-time emotion detection** using MediaPipe facial landmark detection and machine learning. The system analyzes 37 facial features to detect emotions, calculate engagement levels, and monitor focus.

## 🎯 Features Added

### Backend Capabilities
- **emotion_detector.py**: Core emotion detection module with 37 facial features
- **Real-time video frame processing** via WebSocket
- **Emotion-to-engagement mapping**: Active/Passive/Distracted classification
- **Focus level calculation**: 0-100 scale based on emotion + gaze
- **Head pose estimation**: Yaw, pitch, roll tracking
- **Temporal smoothing**: Stabilizes predictions over time
- **REST API endpoints** for testing and health checks

### Frontend Updates
- **VideoFeed.tsx**: Captures and streams video frames to backend (2 FPS)
- **useStudentSession.ts**: Handles emotion data in WebSocket flow
- **Real-time emotion display** with confidence scores
- **Face detection indicator**
- **Engagement level updates** sent to teacher dashboard

## 📋 Prerequisites

### 1. Install Python Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

New dependencies installed:
- `opencv-python==4.9.0.80` - Image processing
- `mediapipe==0.10.9` - Facial landmark detection
- `scikit-learn==1.4.0` - Machine learning models
- `joblib==1.3.2` - Model serialization
- `numpy==1.26.3` - Numerical operations

### 2. Train or Provide Model Files

The system requires two model files:
- `models/emotion_model.joblib` - Trained emotion classification model
- `models/label_encoder.joblib` - Label encoder for emotion classes

**Option A: Use Your Existing Model**
1. Create `backend/models/` directory:
   ```powershell
   mkdir backend\models
   ```

2. Copy your trained model files:
   ```powershell
   copy path\to\your\emotion_model.joblib backend\models\
   copy path\to\your\label_encoder.joblib backend\models\
   ```

**Option B: Train a New Model**
1. Use your existing training pipeline with the 37 features defined in `FEATURE_ORDER`
2. Save the trained model using joblib:
   ```python
   import joblib
   joblib.dump(model, 'emotion_model.joblib')
   joblib.dump(label_encoder, 'label_encoder.joblib')
   ```

### 3. Configure Environment Variables (Optional)

Create `.env` file in backend directory:

```env
# Emotion Detection Settings
EMOTION_MODEL_PATH=models/emotion_model.joblib
EMOTION_LABELS_PATH=models/label_encoder.joblib
```

## 🚀 Usage

### Starting the System

1. **Start Backend:**
   ```powershell
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Verify Emotion Detection Service:**
   Visit: http://localhost:8000/api/emotion/health
   
   Expected response if models are loaded:
   ```json
   {
     "status": "healthy",
     "model_loaded": true,
     "model_path": "models/emotion_model.joblib",
     "labels_path": "models/label_encoder.joblib"
   }
   ```

### Testing Emotion Detection

**Via REST API:**
```powershell
# Test with base64 image
curl -X POST http://localhost:8000/api/emotion/detect `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"image": "data:image/jpeg;base64,..."}'

# Upload image file
curl -X POST http://localhost:8000/api/emotion/detect-upload `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -F "file=@photo.jpg"
```

**Via Frontend:**
1. Login as a student
2. Join a session
3. Grant camera permissions
4. Watch real-time emotion detection in action!

## 🔄 How It Works

### Data Flow

```
Student Browser (VideoFeed.tsx)
  ↓ Captures video frame (2 FPS)
  ↓ Converts to base64 JPEG
  ↓ Sends via WebSocket
  
Backend (websocket_router.py)
  ↓ Receives frame
  ↓ Passes to EmotionDetector
  
EmotionDetector (emotion_detector.py)
  ↓ MediaPipe extracts 468 facial landmarks
  ↓ Computes 37 facial features
  ↓ ML model predicts emotion
  ↓ Maps emotion → engagement level
  ↓ Calculates focus level (0-100)
  ↓ Applies temporal smoothing
  
Backend
  ↓ Stores in MongoDB (engagement_data collection)
  ↓ Updates session students array
  ↓ Broadcasts to teacher WebSocket
  ↓ Sends result to student WebSocket
  
Student Browser
  ↓ Updates UI with emotion/engagement
  ↓ Shows confidence score
  ↓ Updates focus indicators
  
Teacher Dashboard
  ↓ Receives all students' emotion data
  ↓ Displays real-time engagement
  ↓ Shows focus levels
```

### Feature Extraction (37 Features)

The system analyzes:
- **Mouth**: Movement, aspect ratio, jaw drop, curvature, smile intensity
- **Eyes**: Openness, EAR (Eye Aspect Ratio), asymmetry
- **Eyebrows**: Height, slope, asymmetry, distance from eyes
- **Nose**: Flare, tip movement, distances
- **Cheeks**: Position, asymmetry
- **Jaw**: Width, angle
- **Head Pose**: Yaw, pitch, roll (via solvePnP)
- **Face Shape**: Width, height, ratios

### Engagement Mapping

```python
Active Learner    → ['happy', 'neutral', 'surprised', 'focused', 'interested']
Passive Learner   → ['sad', 'calm', 'thoughtful']
Distracted        → ['angry', 'fear', 'disgust', 'bored', 'confused']
```

## 📊 API Endpoints

### Emotion Detection

```
POST /api/emotion/detect
  - Detect emotion from base64 image
  - Body: { "image": "base64_string" }
  - Returns: { emotion, confidence, engagement, focus_level, face_detected, pose }

POST /api/emotion/detect-upload
  - Detect emotion from uploaded file
  - Form data: file=@image.jpg
  - Returns: Same as above

GET /api/emotion/health
  - Check if emotion service is available
  - Returns: { status, model_loaded, model_path, labels_path }

GET /api/emotion/info
  - Get system information
  - Returns: { features, emotions, engagement_levels, focus_range }
```

### WebSocket Messages

**Student → Backend:**
```json
{
  "type": "video_frame",
  "frame": "data:image/jpeg;base64,...",
  "timestamp": "2025-12-05T10:30:00Z"
}
```

**Backend → Student:**
```json
{
  "type": "emotion_result",
  "data": {
    "emotion": "happy",
    "raw_emotion": "happy",
    "confidence": 0.89,
    "engagement": "active",
    "focus_level": 85,
    "face_detected": true,
    "pose": { "yaw": 2.3, "pitch": -5.1, "roll": 0.8 }
  },
  "timestamp": "2025-12-05T10:30:00Z"
}
```

**Backend → Teacher (Broadcast):**
```json
{
  "type": "student_update",
  "data": {
    "student_id": "...",
    "student_name": "John Doe",
    "student_email": "john@example.com",
    "emotion": "focused",
    "confidence": 0.92,
    "engagement": "active",
    "focus_level": 95,
    "face_detected": true
  }
}
```

## 🎨 Frontend Integration

### Update StudentDashboard Component

The VideoFeed component now requires a WebSocket connection:

```tsx
import { useStudentSession } from '@/hooks/useStudentSession'
import VideoFeed from './VideoFeed'

function StudentDashboard() {
  const { getWebSocket, stats } = useStudentSession(studentId)
  
  return (
    <VideoFeed 
      isActive={isInSession}
      websocket={getWebSocket()?.socket}
      onEmotionDetected={(emotionData) => {
        console.log('Emotion detected:', emotionData)
        // Auto-handled by useStudentSession hook
      }}
    />
  )
}
```

### Access Emotion Data

```tsx
const { stats } = useStudentSession(studentId)

console.log(stats.currentEmotion)  // e.g., "happy"
console.log(stats.confidence)       // e.g., 0.89
console.log(stats.engagement)       // "active" | "passive" | "distracted"
console.log(stats.focusLevel)       // 0-100
console.log(stats.faceDetected)     // true/false
console.log(stats.pose)             // { yaw, pitch, roll }
```

## 🔧 Customization

### Adjust Frame Rate

In `VideoFeed.tsx`, change the interval (default 500ms = 2 FPS):

```tsx
frameIntervalRef.current = setInterval(() => {
  captureAndSendFrame()
}, 500)  // Change to 1000 for 1 FPS, 250 for 4 FPS, etc.
```

### Modify Engagement Mapping

Edit `emotion_detector.py`:

```python
def emotion_to_engagement(emotion: str) -> str:
    emotion_lower = emotion.lower()
    
    # Customize your mapping here
    if emotion_lower in ['happy', 'excited', 'engaged']:
        return 'active'
    # ... add your logic
```

### Change Focus Calculation

Edit `emotion_detector.py`:

```python
def calculate_focus_level(emotion: str, gaze_focused: bool = True) -> int:
    base_focus = {
        'happy': 85,
        'your_emotion': 70,  # Add custom emotions
        # ... customize values
    }
```

### Add More Emotions

If your model supports additional emotions, add them to the mappings in `emotion_detector.py`.

## 🐛 Troubleshooting

### Model Not Found
```
Warning: Model files not found. Emotion detection will be disabled.
```
**Solution:** Ensure model files are in `backend/models/` directory.

### Camera Access Denied
**Solution:** Grant browser camera permissions. Check browser console for errors.

### WebSocket Connection Failed
**Solution:** 
- Verify backend is running on port 8000
- Check CORS settings in `main.py`
- Ensure student is enrolled in an active session

### Low FPS / Performance Issues
**Solutions:**
- Reduce frame capture rate (increase interval from 500ms)
- Use smaller image resolution in VideoFeed canvas
- Ensure backend has sufficient CPU resources
- Consider using GPU-accelerated MediaPipe if available

### No Face Detected
- Ensure good lighting conditions
- Position face clearly in camera view
- Check MediaPipe `min_detection_confidence` setting (default 0.5)

## 📈 Performance Metrics

- **Frame Processing Time**: ~50-150ms per frame (CPU-dependent)
- **WebSocket Latency**: ~10-50ms
- **Total Latency**: ~100-250ms from capture to display
- **Bandwidth**: ~50-100 KB/s per student at 2 FPS

## 🔐 Security Considerations

- Video frames are transmitted via WebSocket (consider WSS for production)
- Frames are processed in-memory and not stored (unless engagement data is saved)
- Authentication required for emotion detection endpoints
- MongoDB stores only emotion metadata, not raw images

## 📝 Database Schema

### engagement_data Collection
```json
{
  "_id": "unique_id",
  "student_id": "student_id",
  "session_id": "session_id",
  "emotion": "happy",
  "raw_emotion": "happy",
  "confidence": 0.89,
  "engagement": "active",
  "focus_level": 85,
  "face_detected": true,
  "pose": { "yaw": 2.3, "pitch": -5.1, "roll": 0.8 },
  "timestamp": ISODate("2025-12-05T10:30:00Z")
}
```

## 🎓 Next Steps

1. **Train your emotion model** if you haven't already
2. **Copy model files** to `backend/models/`
3. **Restart backend** to load models
4. **Test via REST API** to verify model works
5. **Start a session** and test real-time detection
6. **Monitor teacher dashboard** to see student engagement

## 📚 Additional Resources

- MediaPipe Face Mesh: https://google.github.io/mediapipe/solutions/face_mesh
- scikit-learn: https://scikit-learn.org/
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

## ✅ Integration Complete!

Your system is now ready for real-time emotion detection. The emotion analysis seamlessly integrates with your existing session management, WebSocket infrastructure, and teacher/student dashboards.
