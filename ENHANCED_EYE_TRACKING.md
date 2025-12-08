# Enhanced Eye Tracking System

## Overview
The eye tracking system has been upgraded with advanced features from a comprehensive eye tracking monitor, providing more accurate and adaptive gaze detection for the learning system.

## New Features

### 1. **Glasses Detection**
- Automatically detects if the user is wearing glasses
- Adjusts detection thresholds to compensate for glasses
- Uses z-coordinate variance analysis of eye landmarks

### 2. **Distance Adaptation**
- Estimates user's distance from the camera based on face size
- Dynamically adjusts thresholds based on distance
- More lenient detection when user is very close or far from camera
- Optimal distance: 30-40cm from camera

### 3. **Lighting Compensation**
- Assesses lighting quality using brightness and contrast analysis
- Enhances frames using CLAHE (Contrast Limited Adaptive Histogram Equalization) in poor lighting
- Adjusts eye closure thresholds based on lighting conditions
- Maintains accuracy even in suboptimal lighting

### 4. **Blink Detection**
- Distinguishes between natural blinks and prolonged eye closure
- Doesn't penalize focus score for normal blinking
- Only considers eye closure as "unfocused" if longer than 0.3 seconds
- Uses temporal tracking to analyze eye closure duration

### 5. **Head Pose Integration**
- Combines gaze direction with head position for better focus detection
- Adapts head position thresholds based on distance
- More lenient when user is very close to camera

### 6. **Adaptive Thresholds**
The system automatically adjusts detection thresholds based on:
- **Distance**: Closer or farther = more lenient (0.4x to 2.5x multiplier)
- **Glasses**: 1.15x more lenient if wearing glasses
- **Lighting**: Up to 1.2x more lenient in poor lighting
- **Threshold Ranges**:
  - Focus (horizontal): 0.30 - 0.65 (base: 0.35)
  - Vertical gaze: 0.35 - 0.7 (base: 0.4)
  - Eye closure (EAR): 0.15 - 0.28 (base: 0.2)

## Technical Implementation

### Backend Changes (`emotion_detector.py`)

#### New Methods:
1. **`detect_glasses(landmarks, frame_shape)`**
   - Analyzes z-coordinate variance of eye landmarks
   - Returns boolean indicating glasses presence

2. **`estimate_face_distance(landmarks, frame_shape)`**
   - Calculates eye distance in pixels
   - Normalizes to distance ratio (0.4 = very close, 2.5 = very far)

3. **`assess_lighting_quality(frame)`**
   - Analyzes mean brightness and standard deviation
   - Returns quality score (0.3 to 1.0)

4. **`adapt_thresholds()`**
   - Dynamically adjusts detection thresholds
   - Combines distance, glasses, and lighting factors

5. **`enhance_frame_quality(frame)`**
   - Applies CLAHE enhancement in poor lighting
   - Improves landmark detection accuracy

6. **`is_blinking(left_ear, right_ear)`**
   - Tracks eye closure duration
   - Returns True if quick blink (< 0.3s)

7. **`calculate_head_pose_deviation(landmarks, frame_shape)`**
   - Calculates horizontal and vertical head deviation
   - Used in focus determination

#### Updated Methods:
- **`is_focused_on_screen()`**: Now includes all adaptive features
- **`detect_gaze_direction()`**: Uses adaptive thresholds
- **`process_frame()`**: Includes lighting assessment and frame enhancement

### Frontend Changes

#### Updated EmotionData Interface:
Added new optional fields:
- `wearing_glasses?: boolean` - Whether user is wearing glasses
- `face_distance?: number` - Normalized distance from camera
- `lighting_quality?: number` - Lighting quality score (0-1)

## Gaze Detection Logic

### Focus Determination:
```
is_focused = (gaze_direction == "CENTER") AND 
             (NOT eyes_closed OR is_blinking) AND 
             head_forward
```

### Gaze Directions:
- **CENTER**: Looking at screen (focused)
- **LEFT**: Looking left (unfocused)
- **RIGHT**: Looking right (unfocused)
- **UP**: Looking up (unfocused)
- **DOWN**: Looking down (unfocused)

### Eye States:
- **OPEN**: Normal eye openness (EAR > threshold)
- **BLINK**: Quick eye closure (< 0.3s)
- **CLOSED**: Prolonged eye closure (> 0.3s, unfocused)

## Data Flow

1. **Frame Capture**: Student's camera captures video frame
2. **Lighting Assessment**: System evaluates lighting conditions
3. **Frame Enhancement**: CLAHE applied if lighting is poor (< 0.7)
4. **Face Detection**: MediaPipe detects face with iris landmarks
5. **Glasses Detection**: Analyzes landmark z-variance
6. **Distance Estimation**: Calculates based on eye distance
7. **Threshold Adaptation**: Adjusts based on conditions
8. **Gaze Calculation**: Computes iris position in eyes
9. **Blink Detection**: Analyzes eye closure duration
10. **Head Pose**: Calculates head position deviation
11. **Focus Determination**: Combines all factors
12. **WebSocket Broadcast**: Sends to student and teacher dashboards

## Debugging Features

### Console Logging:
The system logs comprehensive data for debugging:
- Gaze horizontal/vertical values
- Adaptive thresholds
- Direction detection
- Eye closure state (blink vs closed)
- Glasses detection
- Distance and lighting quality
- Final focus determination

### Log Format:
```
Gaze values - H: 0.123, V: -0.045, Thresholds - H: 0.350, V: 0.400
Focus Detection - Direction: CENTER, Eyes Closed: False, Blink: False, 
EAR: 0.25, Head Forward: True, Glasses: True, Distance: 1.2, 
Lighting: 0.8, Focused: True
```

## Benefits

1. **More Accurate**: Adaptive thresholds prevent false positives/negatives
2. **Robust**: Works in various lighting conditions and distances
3. **Natural**: Doesn't penalize normal blinking
4. **Personalized**: Adapts to glasses wearers automatically
5. **Reliable**: Multiple factors combined for focus detection
6. **Transparent**: Comprehensive logging for debugging

## Testing Guide

### Test Scenarios:
1. **Normal Focus**: Look at screen center - should show "Focused"
2. **Look Away**: Look left/right/up/down - should detect direction
3. **Blink**: Quick blinks should not trigger unfocused state
4. **Eye Closure**: Close eyes for >0.3s - should become unfocused
5. **Distance**: Move closer/farther - thresholds should adapt
6. **Lighting**: Test in bright/dim conditions - should maintain accuracy
7. **Glasses**: Test with/without glasses - should detect and adapt

### Expected Behavior:
- **Focused**: Green "Focused" badge, gaze percentage increases
- **Unfocused**: Orange "Looking [DIRECTION]" badge, percentage decreases
- **Blinking**: No change in focus state
- **Console**: See detailed gaze values and adaptive thresholds

## Performance Considerations

- Frame processing: ~2 FPS (500ms interval)
- Additional processing: ~5-10ms per frame
- Memory: Deque history buffers (30 frames for distance/lighting)
- Minimal impact on overall system performance

## Future Enhancements

Possible additions:
1. User calibration mode for personalized thresholds
2. Attention logging and statistics
3. Notification system for extended unfocused periods
4. Focus trend analysis over time
5. Multi-user optimization

## Troubleshooting

### Issue: Always showing "Focused"
- Check console logs for gaze values
- Verify lighting quality is adequate (> 0.5)
- Ensure iris landmarks are being detected
- Check if adaptive thresholds are too lenient

### Issue: Too sensitive (always "Unfocused")
- May need to increase base thresholds
- Check distance estimation accuracy
- Verify lighting conditions are good
- Ensure face is clearly visible

### Issue: Not detecting glasses
- Z-variance threshold may need adjustment
- Ensure glasses don't cause excessive reflections
- Check landmark detection quality

## References

- MediaPipe Face Mesh: https://google.github.io/mediapipe/solutions/face_mesh.html
- Eye Aspect Ratio (EAR): Soukupová & Čech, 2016
- CLAHE: Zuiderveld, 1994

---

**Version**: 2.0  
**Last Updated**: December 7, 2025  
**Status**: Production Ready
