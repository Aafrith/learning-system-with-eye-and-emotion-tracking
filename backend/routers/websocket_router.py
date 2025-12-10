from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
from datetime import datetime
from database import get_database
from emotion_detector import EmotionDetector
import os

router = APIRouter()

# Initialize emotion detector (singleton)
emotion_detector = None

def get_emotion_detector():
    """Get or initialize the emotion detector"""
    global emotion_detector
    if emotion_detector is None:
        # Check if model files exist
        model_path = os.getenv("EMOTION_MODEL_PATH", "models/emotion_model.joblib")
        labels_path = os.getenv("EMOTION_LABELS_PATH", "models/label_encoder.joblib")
        
        if os.path.exists(model_path) and os.path.exists(labels_path):
            try:
                emotion_detector = EmotionDetector(model_path, labels_path)
                print("Emotion detector initialized successfully")
            except Exception as e:
                print(f"Warning: Could not initialize emotion detector: {e}")
                emotion_detector = None
        else:
            print(f"Warning: Model files not found. Emotion detection will be disabled.")
            print(f"  Expected: {model_path} and {labels_path}")
            emotion_detector = None
    
    return emotion_detector

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # Store connections by session_id -> role -> connections
        self.active_connections: Dict[str, Dict[str, List[WebSocket]]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str, role: str, user_id: str):
        """Connect a WebSocket client"""
        # Accept connection without origin checking (for development)
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {"teacher": [], "students": []}
        
        self.active_connections[session_id][role].append(websocket)
        print(f"{role.capitalize()} {user_id} connected to session {session_id}")
    
    def disconnect(self, websocket: WebSocket, session_id: str, role: str, user_id: str):
        """Disconnect a WebSocket client"""
        if session_id in self.active_connections and role in self.active_connections[session_id]:
            if websocket in self.active_connections[session_id][role]:
                self.active_connections[session_id][role].remove(websocket)
                print(f"{role.capitalize()} {user_id} disconnected from session {session_id}")
            
            # Clean up empty session
            if (not self.active_connections[session_id]["teacher"] and 
                not self.active_connections[session_id]["students"]):
                del self.active_connections[session_id]
    
    async def send_to_teacher(self, session_id: str, message: dict):
        """Send message to teacher in a session"""
        if session_id in self.active_connections:
            teacher_connections = self.active_connections[session_id]["teacher"]
            if not teacher_connections:
                print(f"⚠️ No teacher connections for session {session_id}")
                return
            for connection in teacher_connections:
                try:
                    await connection.send_json(message)
                    if message.get("type") == "student_update":
                        print(f"✅ Sent update to teacher")
                except Exception as e:
                    print(f"❌ Error sending to teacher: {e}")
        else:
            print(f"⚠️ Session {session_id} not in active_connections")
    
    async def send_to_students(self, session_id: str, message: dict):
        """Send message to all students in a session"""
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]["students"]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending to students: {e}")
    
    async def send_to_all(self, session_id: str, message: dict):
        """Send message to everyone in a session"""
        await self.send_to_teacher(session_id, message)
        await self.send_to_students(session_id, message)
    
    async def broadcast_student_update(self, session_id: str, student_data: dict):
        """Broadcast student data update to teacher"""
        message = {
            "type": "student_update",
            "data": student_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        print(f"🔔 Broadcasting student update for session {session_id}: {student_data.get('student_name')} - {student_data.get('emotion')}/{student_data.get('focus_level')}%")
        await self.send_to_teacher(session_id, message)

manager = ConnectionManager()

@router.websocket("/ws/session/{session_id}/teacher/{teacher_id}")
async def teacher_websocket(websocket: WebSocket, session_id: str, teacher_id: str):
    """WebSocket endpoint for teachers"""
    db = await get_database()
    
    # Verify session exists
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    # Verify teacher owns the session (compare with session's teacher_id)
    # Accept connection for now - authentication is handled by JWT at session creation
    # This allows teachers to connect with their name or ID
    
    await manager.connect(websocket, session_id, "teacher", teacher_id)
    
    try:
        # Fetch fresh session data with all students
        session = await db.sessions.find_one({"_id": session_id})
        
        # Send initial session data with all currently enrolled students
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to session as teacher",
            "session": {
                "id": session["_id"],
                "code": session["session_code"],
                "subject": session["subject"],
                "students": session["students"]
            }
        })
        
        # Send initial student updates for all connected students
        for student in session.get("students", []):
            await manager.broadcast_student_update(session_id, {
                "student_id": student["id"],
                "student_name": student["name"],
                "status": "connected",
                "emotion": student.get("emotion"),
                "engagement": student.get("engagement"),
                "focus_level": student.get("focus_level")
            })
        
        while True:
            # Receive messages from teacher
            data = await websocket.receive_json()
            
            message_type = data.get("type")
            
            if message_type == "session_update":
                # Broadcast session update to all students
                await manager.send_to_students(session_id, {
                    "type": "session_update",
                    "data": data.get("data"),
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == "session_ended":
                # Broadcast session ended to all students
                await manager.send_to_students(session_id, {
                    "type": "session_ended",
                    "message": "Teacher has ended the session",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == "ping":
                # Respond to ping
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id, "teacher", teacher_id)
    except Exception as e:
        print(f"Error in teacher WebSocket: {e}")
        manager.disconnect(websocket, session_id, "teacher", teacher_id)

@router.websocket("/ws/session/{session_id}/student/{student_id}")
async def student_websocket(websocket: WebSocket, session_id: str, student_id: str):
    """WebSocket endpoint for students"""
    db = await get_database()
    
    # Check if this is a mock session (for development/testing)
    is_mock_session = session_id.startswith("mock_session_")
    
    if not is_mock_session:
        # Verify session exists
        session = await db.sessions.find_one({"_id": session_id})
        if not session:
            await websocket.close(code=1008, reason="Session not found")
            return
        
        # Check if student is in session (authentication already done at join time)
        # Accept connection if student exists in session
        student_in_session = any(s["id"] == student_id for s in session["students"])
        if not student_in_session:
            # Student might have just joined, allow connection anyway
            print(f"Warning: Student {student_id} not found in session, but allowing connection")
    else:
        # Mock session - create a fake session object
        session = {
            "_id": session_id,
            "session_code": "MOCK",
            "subject": "Mock Session",
            "teacher_name": "Mock Teacher",
            "students": []
        }
        print(f"Mock session detected: {session_id}, allowing connection for testing")
    
    await manager.connect(websocket, session_id, "students", student_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to session as student",
            "session": {
                "id": session["_id"],
                "code": session["session_code"],
                "subject": session["subject"],
                "teacher": session["teacher_name"]
            }
        })
        
        # Notify teacher that student has connected
        if not is_mock_session:
            # Get student info from session
            student_info = next((s for s in session["students"] if s["id"] == student_id), None)
            if student_info:
                # Send initial update with default values if not yet available
                await manager.broadcast_student_update(session_id, {
                    "student_id": student_id,
                    "student_name": student_info["name"],
                    "status": "connected",
                    "emotion": student_info.get("emotion") or "neutral",
                    "engagement": student_info.get("engagement") or "passive",
                    "focus_level": student_info.get("focus_level") if student_info.get("focus_level") is not None else 50
                })
                print(f"Student {student_info['name']} connected - sent initial update to teacher")
        
        while True:
            # Receive messages from student with timeout
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                print(f"WebSocket disconnected for {student_id}")
                break
            except Exception as e:
                # Log error but continue - don't break connection for processing errors
                print(f"Error receiving message from {student_id}: {e}")
                continue
            
            message_type = data.get("type")
            
            if message_type == "ping":
                # Respond to ping to keep connection alive
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue
            
            if message_type == "video_frame":
                # Process video frame for emotion detection
                detector = get_emotion_detector()
                if detector:
                    try:
                        frame_data = data.get("frame")  # Base64 encoded image
                        if frame_data:
                            emotion_result = detector.process_base64_frame(frame_data)
                            
                            # Only log when face is detected to reduce console spam
                            if emotion_result.get('face_detected'):
                                print(f"Emotion result for {student_id}:")
                                print(f"  - Emotion: {emotion_result.get('emotion')}")
                                print(f"  - Focused Gaze: {emotion_result.get('is_focused_gaze')}")
                                print(f"  - Gaze Direction: {emotion_result.get('gaze_direction')}")
                                print(f"  - Eye Openness: {emotion_result.get('eye_openness')}")
                            
                            # Update student in session (skip for mock sessions)
                            if not is_mock_session:
                                await db.sessions.update_one(
                                    {
                                        "_id": session_id,
                                        "students.id": student_id
                                    },
                                    {
                                        "$set": {
                                            "students.$.emotion": emotion_result.get("emotion"),
                                            "students.$.engagement": emotion_result.get("engagement"),
                                            "students.$.focus_level": emotion_result.get("focus_level")
                                        }
                                    }
                                )
                                
                                # Store in engagement history
                                from bson import ObjectId
                                engagement_history = {
                                    "_id": str(ObjectId()),
                                    "student_id": student_id,
                                    "session_id": session_id,
                                    "emotion": emotion_result.get("emotion"),
                                    "raw_emotion": emotion_result.get("raw_emotion"),
                                    "confidence": emotion_result.get("confidence"),
                                    "engagement": emotion_result.get("engagement"),
                                    "focus_level": emotion_result.get("focus_level"),
                                    "face_detected": emotion_result.get("face_detected"),
                                    "pose": emotion_result.get("pose", {}),
                                    "timestamp": datetime.utcnow()
                                }
                                await db.engagement_data.insert_one(engagement_history)
                            else:
                                # Only log mock results when face is detected
                                if emotion_result.get('face_detected'):
                                    print(f"Mock session - emotion result: {emotion_result}")
                            
                            # Send result back to student (always send, even if no face detected)
                            await websocket.send_json({
                                "type": "emotion_result",
                                "data": emotion_result,
                                "timestamp": datetime.utcnow().isoformat()
                            })
                            
                            # Broadcast to teacher (skip for mock sessions)
                            if not is_mock_session:
                                student_info = next((s for s in session["students"] if s["id"] == student_id), None)
                                if student_info:
                                    # Prepare update with clear field names
                                    update_data = {
                                        "student_id": student_id,
                                        "student_name": student_info["name"],
                                        "student_email": student_info.get("email"),
                                        "emotion": emotion_result.get("emotion"),
                                        "engagement": emotion_result.get("engagement"),
                                        "focus_level": emotion_result.get("focus_level"),
                                        "face_detected": emotion_result.get("face_detected"),
                                        "gaze_direction": emotion_result.get("gaze_direction"),
                                        "is_focused_gaze": emotion_result.get("is_focused_gaze")
                                    }
                                    
                                    # Log every update being sent
                                    print(f"📤 Broadcasting to teacher: {student_info['name']} - Emotion: {update_data['emotion']}, Focus: {update_data['focus_level']}%, Engagement: {update_data['engagement']}, Face: {update_data['face_detected']}")
                                    
                                    await manager.broadcast_student_update(session_id, update_data)
                    except Exception as e:
                        # Log error but don't break connection - continue processing
                        print(f"Error processing video frame: {e}")
                        import traceback
                        traceback.print_exc()
                        # Send error but keep connection alive
                        try:
                            await websocket.send_json({
                                "type": "error",
                                "message": f"Error processing frame: {str(e)}",
                                "timestamp": datetime.utcnow().isoformat()
                            })
                        except:
                            pass  # If send fails, just continue
            
            elif message_type == "engagement_update":
                # Update engagement data in database
                engagement_data = data.get("data")
                
                # Update student in session
                await db.sessions.update_one(
                    {
                        "_id": session_id,
                        "students.id": student_id
                    },
                    {
                        "$set": {
                            "students.$.emotion": engagement_data.get("emotion"),
                            "students.$.engagement": engagement_data.get("engagement"),
                            "students.$.focus_level": engagement_data.get("focus_level")
                        }
                    }
                )
                
                # Store in engagement history
                from bson import ObjectId
                engagement_history = {
                    "_id": str(ObjectId()),
                    "student_id": student_id,
                    "session_id": session_id,
                    "emotion": engagement_data.get("emotion"),
                    "engagement": engagement_data.get("engagement"),
                    "focus_level": engagement_data.get("focus_level"),
                    "timestamp": datetime.utcnow()
                }
                await db.engagement_data.insert_one(engagement_history)
                
                # Broadcast to teacher
                student_info = next((s for s in session["students"] if s["id"] == student_id), None)
                if student_info:
                    await manager.broadcast_student_update(session_id, {
                        "student_id": student_id,
                        "student_name": student_info["name"],
                        **engagement_data
                    })
            
            elif message_type == "ping":
                # Respond to ping
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id, "students", student_id)
    except Exception as e:
        print(f"Error in student WebSocket: {e}")
        manager.disconnect(websocket, session_id, "students", student_id)
