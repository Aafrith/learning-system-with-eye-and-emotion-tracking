# 🚀 Quick Start - Emotion Detection Enabled

Your emotion detection system is now fully integrated! Follow these steps to get started.

## ⚡ 5-Minute Setup

### Step 1: Install Backend Dependencies (1 min)
```powershell
cd backend
pip install -r requirements.txt
```

### Step 2: Add Your Model Files (1 min)
```powershell
# Create models directory
mkdir models

# Copy your trained model files
# - emotion_model.joblib
# - label_encoder.joblib
# Place them in backend/models/
```

### Step 3: Verify Setup (1 min)
```powershell
python check_setup.py
```

Expected output: ✓ SETUP COMPLETE

### Step 4: Start Backend (30 sec)
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/api/emotion/health to verify

### Step 5: Start Frontend (30 sec)
```powershell
# New terminal
cd frontend
npm run dev
```

Visit http://localhost:3000

### Step 6: Test It! (1 min)
1. Login as student
2. Join a session
3. Grant camera permission
4. See real-time emotion detection! 🎉

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[EMOTION_DETECTION_SUMMARY.md](EMOTION_DETECTION_SUMMARY.md)** | 📖 Start here - Complete overview |
| **[EMOTION_DETECTION_INTEGRATION.md](EMOTION_DETECTION_INTEGRATION.md)** | 📘 Detailed integration guide |
| **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** | 🏗️ Visual system architecture |
| **[INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)** | ✅ Step-by-step verification |

## 🎯 What's New

### Backend
- ✅ Real-time emotion detection from video frames
- ✅ 37 facial features analyzed with MediaPipe
- ✅ Engagement classification (Active/Passive/Distracted)
- ✅ Focus level calculation (0-100)
- ✅ Head pose tracking (yaw, pitch, roll)
- ✅ REST API for testing: `/api/emotion/*`
- ✅ WebSocket video frame processing

### Frontend
- ✅ VideoFeed captures and streams frames (2 FPS)
- ✅ Real-time emotion display with confidence
- ✅ Face detection indicator
- ✅ Engagement and focus level meters
- ✅ Automatic 8-minute unfocused alerts
- ✅ Teacher real-time monitoring

## 🔧 Model Requirements

Your model must:
1. Accept 37 features in this exact order:
   ```python
   ['mouth_movement', 'mouth_aspect_ratio', 'lip_corner_distance', 'jaw_drop',
    'left_eye_movement', 'right_eye_movement', 'left_eyebrow_movement', 
    'right_eyebrow_movement', 'left_eyebrow_slope', 'right_eyebrow_slope', 
    'eyebrow_asymmetry', 'nostril_flare', 'nose_tip_movement', 
    'left_cheek_position', 'right_cheek_position', 'jaw_width', 
    'mouth_eye_ratio', 'pose_yaw', 'pose_pitch', 'pose_roll', 
    'left_eye_ear', 'right_eye_ear', 'eye_asymmetry', 'interocular_norm', 
    'mouth_corner_slope', 'mouth_curvature', 'smile_intensity', 
    'brow_eye_dist_left', 'brow_eye_dist_right', 'brow_eye_asymmetry', 
    'cheek_asymmetry', 'jaw_angle_deg', 'nose_to_mouth', 'nose_to_chin_norm', 
    'face_width_norm', 'face_height_norm', 'face_wh_ratio']
   ```

2. Be saved with joblib:
   ```python
   import joblib
   joblib.dump(model, 'emotion_model.joblib')
   joblib.dump(label_encoder, 'label_encoder.joblib')
   ```

## 🎮 Usage Example

### Student Side
```tsx
import { useStudentSession } from '@/hooks/useStudentSession'
import VideoFeed from '@/components/VideoFeed'

function StudentDashboard() {
  const { stats, getWebSocket } = useStudentSession(studentId)
  
  return (
    <>
      <VideoFeed 
        isActive={true}
        websocket={getWebSocket()?.socket}
      />
      
      <p>Emotion: {stats.currentEmotion}</p>
      <p>Engagement: {stats.engagement}</p>
      <p>Focus: {stats.focusLevel}%</p>
    </>
  )
}
```

### REST API
```bash
# Health check
curl http://localhost:8000/api/emotion/health

# Detect emotion from image
curl -X POST http://localhost:8000/api/emotion/detect \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Model files not found" | Place model files in `backend/models/` |
| Camera not working | Grant browser permissions, try Chrome |
| WebSocket connection failed | Ensure backend running, student enrolled |
| No face detected | Check lighting, face visible, camera working |
| Poor performance | Reduce frame rate in `VideoFeed.tsx` |

Run `python backend/check_setup.py` to diagnose issues.

## 📊 System Architecture

```
Student Browser → Captures Frame → WebSocket → Backend
                                        ↓
                                  MediaPipe + ML
                                        ↓
                              Emotion + Engagement
                                        ↓
                           ├─→ MongoDB (storage)
                           ├─→ Student (results)
                           └─→ Teacher (broadcast)
```

**Processing**: ~100-250ms per frame
**Frame Rate**: 2 FPS (configurable)
**Features**: 37 facial features
**Engagement**: Active/Passive/Distracted
**Focus**: 0-100 scale

## 🎓 Next Steps

1. **📖 Read**: [EMOTION_DETECTION_SUMMARY.md](EMOTION_DETECTION_SUMMARY.md)
2. **✅ Verify**: Use [INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)
3. **🧪 Test**: Try REST API endpoints
4. **🎯 Demo**: Join a session and test live
5. **🎨 Customize**: Adjust engagement mappings if needed

## 🎉 You're Ready!

Your emotion detection system is fully integrated. Start the backend, start the frontend, and begin monitoring student engagement in real-time!

**Questions?** Check the detailed documentation files above.

**Issues?** Run `python backend/check_setup.py` for diagnostics.

**Ready to go?** Follow the 5-minute setup above!

---

**Happy Learning! 📚🎓✨**
