from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
from datetime import datetime
from database import get_database

router = APIRouter()

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # Store connections by session_id -> role -> connections
        self.active_connections: Dict[str, Dict[str, List[WebSocket]]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str, role: str, user_id: str):
        """Connect a WebSocket client"""
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
            for connection in self.active_connections[session_id]["teacher"]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending to teacher: {e}")
    
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
        await self.send_to_teacher(session_id, message)

manager = ConnectionManager()

@router.websocket("/ws/session/{session_id}/teacher/{teacher_id}")
async def teacher_websocket(websocket: WebSocket, session_id: str, teacher_id: str):
    """WebSocket endpoint for teachers"""
    db = await get_database()
    
    # Verify session exists and teacher owns it
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    if session["teacher_id"] != teacher_id:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    await manager.connect(websocket, session_id, "teacher", teacher_id)
    
    try:
        # Send initial session data
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
    
    # Verify session exists and student is enrolled
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    # Check if student is in session
    student_in_session = any(s["id"] == student_id for s in session["students"])
    if not student_in_session:
        await websocket.close(code=1008, reason="Not enrolled in session")
        return
    
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
        
        while True:
            # Receive messages from student
            data = await websocket.receive_json()
            
            message_type = data.get("type")
            
            if message_type == "engagement_update":
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
