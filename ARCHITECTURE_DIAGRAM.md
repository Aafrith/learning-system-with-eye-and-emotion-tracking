# Emotion Detection System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Student Browser                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                   VideoFeed Component                       │    │
│  │                                                             │    │
│  │  • Captures webcam at 2 FPS                                │    │
│  │  • Converts to base64 JPEG                                 │    │
│  │  • Sends via WebSocket                                     │    │
│  └──────────────────────┬──────────────────────────────────────┘   │
│                         │                                            │
│                         ├─ WebSocket Message ──────────────┐        │
│                         │  { type: "video_frame",         │        │
│                         │    frame: "base64...",           │        │
│                         │    timestamp: "..." }            │        │
│                         │                                  │        │
└─────────────────────────┼──────────────────────────────────┼────────┘
                          │                                  │
                          ▼                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                      Backend WebSocket Handler                       │
│                   (websocket_router.py)                              │
│                                                                      │
│  1. Receives video frame                                            │
│  2. Decodes base64 → numpy array                                    │
│  3. Calls EmotionDetector.process_base64_frame()                    │
│                                                                      │
│     ┌─────────────────────────────────────────────────┐            │
│     │        EmotionDetector                          │            │
│     │      (emotion_detector.py)                      │            │
│     │                                                  │            │
│     │  ┌──────────────────────────────────────────┐  │            │
│     │  │   MediaPipe Face Mesh                     │  │            │
│     │  │   • Detects 468 facial landmarks          │  │            │
│     │  │   • Normalized 3D coordinates             │  │            │
│     │  └───────────────┬──────────────────────────┘  │            │
│     │                  │                              │            │
│     │                  ▼                              │            │
│     │  ┌──────────────────────────────────────────┐  │            │
│     │  │   Feature Extraction (37 features)        │  │            │
│     │  │                                            │  │            │
│     │  │  Mouth:  movement, aspect_ratio, smile    │  │            │
│     │  │  Eyes:   openness, EAR, asymmetry         │  │            │
│     │  │  Brows:  height, slope, asymmetry         │  │            │
│     │  │  Nose:   flare, tip movement              │  │            │
│     │  │  Pose:   yaw, pitch, roll (solvePnP)      │  │            │
│     │  │  Face:   width, height, ratios            │  │            │
│     │  └───────────────┬──────────────────────────┘  │            │
│     │                  │                              │            │
│     │                  ▼                              │            │
│     │  ┌──────────────────────────────────────────┐  │            │
│     │  │   ML Model Prediction                     │  │            │
│     │  │   • sklearn model.predict(X)              │  │            │
│     │  │   • Returns: emotion label                │  │            │
│     │  │   • Confidence: model.predict_proba(X)    │  │            │
│     │  └───────────────┬──────────────────────────┘  │            │
│     │                  │                              │            │
│     │                  ▼                              │            │
│     │  ┌──────────────────────────────────────────┐  │            │
│     │  │   Temporal Smoothing                      │  │            │
│     │  │   • Sliding window (5 frames)             │  │            │
│     │  │   • Most common emotion                   │  │            │
│     │  │   • Reduces jitter                        │  │            │
│     │  └───────────────┬──────────────────────────┘  │            │
│     │                  │                              │            │
│     │                  ▼                              │            │
│     │  ┌──────────────────────────────────────────┐  │            │
│     │  │   Engagement & Focus Calculation          │  │            │
│     │  │                                            │  │            │
│     │  │   emotion → engagement mapping            │  │            │
│     │  │     'happy' → 'active' (85% focus)        │  │            │
│     │  │     'bored' → 'distracted' (25% focus)    │  │            │
│     │  └───────────────┬──────────────────────────┘  │            │
│     │                  │                              │            │
│     │                  ▼                              │            │
│     │           Result Dictionary                     │            │
│     │  {                                              │            │
│     │    emotion: "happy",                            │            │
│     │    raw_emotion: "happy",                        │            │
│     │    confidence: 0.89,                            │            │
│     │    engagement: "active",                        │            │
│     │    focus_level: 85,                             │            │
│     │    face_detected: true,                         │            │
│     │    pose: {yaw: 2.3, pitch: -5.1, roll: 0.8}    │            │
│     │  }                                              │            │
│     └──────────────────┬──────────────────────────────┘            │
│                        │                                            │
│  4. Store in MongoDB (engagement_data collection)                  │
│  5. Update session.students[].emotion/engagement/focus             │
│  6. Send result back to student WebSocket                          │
│  7. Broadcast to teacher WebSocket                                 │
│                                                                      │
└──────────────┬─────────────────────┬─────────────────────────────┘
               │                     │
               │                     └─── Broadcast to Teacher ────┐
               │                                                    │
               └─── Send to Student                                │
                    ↓                                               ↓
┌─────────────────────────────────────┐  ┌──────────────────────────────────┐
│     Student Browser                  │  │    Teacher Dashboard              │
│                                      │  │                                   │
│  ┌───────────────────────────────┐  │  │  ┌────────────────────────────┐  │
│  │  VideoFeed receives:          │  │  │  │  Receives all students'    │  │
│  │                                │  │  │  │  emotion updates:          │  │
│  │  {                             │  │  │  │                            │  │
│  │    type: "emotion_result",    │  │  │  │  {                         │  │
│  │    data: {                     │  │  │  │    type: "student_update", │  │
│  │      emotion: "happy",         │  │  │  │    data: {                 │  │
│  │      confidence: 0.89,         │  │  │  │      student_id: "...",    │  │
│  │      engagement: "active",     │  │  │  │      student_name: "John", │  │
│  │      focus_level: 85,          │  │  │  │      emotion: "happy",     │  │
│  │      face_detected: true       │  │  │  │      engagement: "active", │  │
│  │    }                           │  │  │  │      focus_level: 85       │  │
│  │  }                             │  │  │  │    }                       │  │
│  │                                │  │  │  │  }                         │  │
│  └────────────┬──────────────────┘  │  │  └────────────┬───────────────┘  │
│               │                      │  │               │                   │
│               ▼                      │  │               ▼                   │
│  ┌───────────────────────────────┐  │  │  ┌────────────────────────────┐  │
│  │  useStudentSession Hook       │  │  │  │  Student Grid View         │  │
│  │                                │  │  │  │                            │  │
│  │  Updates stats state:          │  │  │  │  Shows all students with:  │  │
│  │  • currentEmotion              │  │  │  │  • Name & photo            │  │
│  │  • confidence                  │  │  │  │  • Current emotion         │  │
│  │  • engagement                  │  │  │  │  • Engagement level        │  │
│  │  • focusLevel                  │  │  │  │  • Focus percentage        │  │
│  │  • faceDetected                │  │  │  │  • Color-coded indicators  │  │
│  │  • pose                        │  │  │  │                            │  │
│  └────────────┬──────────────────┘  │  │  └────────────────────────────┘  │
│               │                      │  │                                   │
│               ▼                      │  │  Real-time monitoring of ALL      │
│  ┌───────────────────────────────┐  │  │  students' engagement             │
│  │  UI Updates                    │  │  │                                   │
│  │                                │  │  └───────────────────────────────────┘
│  │  • Emotion badge              │  │
│  │  • Confidence percentage      │  │
│  │  • Engagement indicator       │  │
│  │  • Focus level meter          │  │
│  │  • Face detection status      │  │
│  │  • Alert if unfocused >8min   │  │
│  └───────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         MongoDB Storage                              │
│                                                                      │
│  engagement_data Collection:                                        │
│  {                                                                   │
│    _id: "...",                                                       │
│    student_id: "student_id",                                        │
│    session_id: "session_id",                                        │
│    emotion: "happy",                                                │
│    raw_emotion: "happy",                                            │
│    confidence: 0.89,                                                │
│    engagement: "active",                                            │
│    focus_level: 85,                                                 │
│    face_detected: true,                                             │
│    pose: { yaw: 2.3, pitch: -5.1, roll: 0.8 },                     │
│    timestamp: ISODate("2025-12-05T10:30:00Z")                      │
│  }                                                                   │
│                                                                      │
│  • Stored every frame (2 per second)                                │
│  • Used for analytics and reports                                   │
│  • Can generate engagement graphs                                   │
│  • Track focus patterns over time                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Timeline

```
Time (ms)    Event
─────────────────────────────────────────────────────────────────
    0        Student's browser captures video frame
   10        Convert to base64 JPEG (~50KB)
   20        Send via WebSocket to backend
   30        Backend receives and decodes
   40        MediaPipe processes frame
   90        Extract 468 landmarks
  100        Compute 37 facial features
  110        ML model prediction
  120        Temporal smoothing
  130        Calculate engagement & focus
  140        Store in MongoDB
  150        Send to student WebSocket
  160        Broadcast to teacher WebSocket
  170        Student UI updates
  180        Teacher dashboard updates
─────────────────────────────────────────────────────────────────
Total: ~180ms per frame (2 FPS = one frame every 500ms)
```

## Component Interaction

```
┌──────────────┐
│  VideoFeed   │  Captures frames, displays results
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ useStudentSession│  Manages WebSocket, handles emotion data
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  WebSocket       │  ws://localhost:8000/ws/session/{id}/student/{id}
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ Backend WebSocket    │  Receives frames, processes, broadcasts
│ websocket_router.py  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ EmotionDetector      │  Core ML processing
│ emotion_detector.py  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ MongoDB              │  Stores engagement history
└──────────────────────┘
```

## Feature Extraction Detail

```
Input: 468 MediaPipe Face Landmarks (x, y, z coordinates)
              ↓
┌─────────────────────────────────────────────────────────┐
│         Landmark Groups                                  │
├─────────────────────────────────────────────────────────┤
│  Mouth:     61, 291, 13, 14, etc. (20+ landmarks)       │
│  Left Eye:  33, 133, 159, 145, etc.                     │
│  Right Eye: 362, 263, 386, 374, etc.                    │
│  Left Brow: 65, etc.                                    │
│  Right Brow: 295, etc.                                  │
│  Nose:      1, 4, 98, 327, etc.                         │
│  Cheeks:    230, 450, etc.                              │
│  Jaw:       152, 234, 454, etc.                         │
└─────────────────────────────────────────────────────────┘
              ↓
    Calculate Distances & Ratios
              ↓
┌─────────────────────────────────────────────────────────┐
│         37 Features Vector                               │
├─────────────────────────────────────────────────────────┤
│  [0.15, 0.42, 0.33, ..., 2.3, -5.1, 0.8]               │
│   ↑     ↑     ↑          ↑    ↑     ↑                  │
│   mouth eye   brow       yaw  pitch roll               │
└─────────────────────────────────────────────────────────┘
              ↓
         ML Model
              ↓
        Emotion Label
```

## Engagement Levels

```
┌──────────────────────────────────────────────────────┐
│  Emotion → Engagement → Focus                         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ACTIVE (Green)                                       │
│  ├─ happy      → 85% focus                           │
│  ├─ neutral    → 75% focus                           │
│  ├─ surprised  → 70% focus                           │
│  ├─ focused    → 95% focus                           │
│  └─ interested → 90% focus                           │
│                                                       │
│  PASSIVE (Yellow)                                     │
│  ├─ sad        → 50% focus                           │
│  ├─ calm       → 65% focus                           │
│  └─ thoughtful → 60% focus                           │
│                                                       │
│  DISTRACTED (Red)                                     │
│  ├─ angry      → 30% focus                           │
│  ├─ fear       → 40% focus                           │
│  ├─ disgust    → 35% focus                           │
│  ├─ bored      → 25% focus                           │
│  └─ confused   → 45% focus                           │
│                                                       │
└──────────────────────────────────────────────────────┘

Focus Level adjustments:
• No face detected: -30 points
• Good head pose (centered): +0 points
• Extreme head rotation: potential -10 points
```

## System Requirements

```
┌─────────────────────────────────────────────────────┐
│  Backend                                             │
├─────────────────────────────────────────────────────┤
│  • Python 3.8+                                       │
│  • CPU: 2+ cores (4+ recommended)                    │
│  • RAM: 4GB+ (8GB recommended)                       │
│  • Storage: 500MB for dependencies + models          │
│  • Network: Low latency preferred                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Frontend                                            │
├─────────────────────────────────────────────────────┤
│  • Modern browser (Chrome, Edge, Firefox, Safari)    │
│  • Webcam access                                     │
│  • 1 Mbps+ internet connection                       │
│  • Camera: 640x480 minimum                           │
└─────────────────────────────────────────────────────┘
```

This architecture ensures real-time emotion detection with minimal latency while maintaining accuracy through temporal smoothing and comprehensive feature extraction!
