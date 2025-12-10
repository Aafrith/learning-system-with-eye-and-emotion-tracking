from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from io import BytesIO
import json

from models import UserInDB
from auth import get_current_user, get_current_teacher, get_current_student
from database import get_database

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# Helper function to calculate statistics
def calculate_engagement_stats(students_data: List[Dict]) -> Dict:
    """Calculate engagement statistics from student data"""
    if not students_data:
        return {
            "total_students": 0,
            "avg_focus": 0,
            "avg_engagement": 0,
            "emotions": {},
            "focus_distribution": {"high": 0, "medium": 0, "low": 0}
        }
    
    total_focus = 0
    emotion_counts = {}
    engagement_counts = {"active": 0, "passive": 0, "distracted": 0}
    focus_distribution = {"high": 0, "medium": 0, "low": 0}
    
    for student in students_data:
        # Focus level
        focus = student.get("focus_level", 0)
        total_focus += focus
        
        if focus >= 70:
            focus_distribution["high"] += 1
        elif focus >= 40:
            focus_distribution["medium"] += 1
        else:
            focus_distribution["low"] += 1
        
        # Emotion
        emotion = student.get("emotion", "neutral")
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        # Engagement
        engagement = student.get("engagement", "passive")
        if engagement in engagement_counts:
            engagement_counts[engagement] += 1
    
    avg_focus = total_focus / len(students_data) if students_data else 0
    active_percentage = (engagement_counts["active"] / len(students_data) * 100) if students_data else 0
    
    return {
        "total_students": len(students_data),
        "avg_focus": round(avg_focus, 1),
        "avg_engagement": round(active_percentage, 1),
        "emotions": emotion_counts,
        "engagement_distribution": engagement_counts,
        "focus_distribution": focus_distribution
    }

@router.get("/session/{session_id}")
async def get_session_report(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get detailed report for a specific session"""
    db = await get_database()
    
    # Get session
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check authorization
    if current_user.role == "teacher" and session["teacher_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this session report"
        )
    
    if current_user.role == "student":
        student_in_session = any(s["id"] == current_user.id for s in session.get("students", []))
        if not student_in_session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this session report"
            )
    
    # Calculate statistics
    stats = calculate_engagement_stats(session.get("students", []))
    
    # Calculate session duration
    duration_minutes = 0
    if session.get("started_at") and session.get("ended_at"):
        duration = session["ended_at"] - session["started_at"]
        duration_minutes = int(duration.total_seconds() / 60)
    elif session.get("started_at"):
        duration = datetime.utcnow() - session["started_at"]
        duration_minutes = int(duration.total_seconds() / 60)
    
    report = {
        "session_id": session_id,
        "session_code": session["session_code"],
        "subject": session["subject"],
        "teacher_name": session["teacher_name"],
        "start_time": session.get("started_at", session["created_at"]).isoformat(),
        "end_time": session.get("ended_at").isoformat() if session.get("ended_at") else None,
        "duration_minutes": duration_minutes,
        "is_active": session["is_active"],
        "statistics": stats,
        "students": [
            {
                "id": s["id"],
                "name": s["name"],
                "email": s.get("email"),
                "joined_at": s["joined_at"].isoformat(),
                "emotion": s.get("emotion", "neutral"),
                "engagement": s.get("engagement", "passive"),
                "focus_level": s.get("focus_level", 0)
            }
            for s in session.get("students", [])
        ]
    }
    
    return report

@router.get("/teacher/summary")
async def get_teacher_summary(
    days: int = 30,
    current_user: UserInDB = Depends(get_current_teacher)
):
    """Get summary report for teacher across all sessions"""
    db = await get_database()
    
    # Get all teacher's sessions within date range
    start_date = datetime.utcnow() - timedelta(days=days)
    sessions = await db.sessions.find({
        "teacher_id": current_user.id,
        "created_at": {"$gte": start_date}
    }).to_list(None)
    
    if not sessions:
        return {
            "teacher_id": current_user.id,
            "teacher_name": current_user.name,
            "period_days": days,
            "total_sessions": 0,
            "total_students": 0,
            "total_duration_minutes": 0,
            "avg_session_duration": 0,
            "avg_focus_level": 0,
            "avg_engagement": 0,
            "sessions_by_subject": {},
            "emotion_trends": {},
            "focus_trends": []
        }
    
    # Calculate aggregate statistics
    total_students = 0
    total_duration = 0
    all_students_data = []
    sessions_by_subject = {}
    
    for session in sessions:
        # Count unique students
        total_students += len(session.get("students", []))
        
        # Calculate duration
        if session.get("started_at") and session.get("ended_at"):
            duration = session["ended_at"] - session["started_at"]
            total_duration += duration.total_seconds() / 60
        
        # Group by subject
        subject = session["subject"]
        if subject not in sessions_by_subject:
            sessions_by_subject[subject] = {"count": 0, "students": 0}
        sessions_by_subject[subject]["count"] += 1
        sessions_by_subject[subject]["students"] += len(session.get("students", []))
        
        # Collect all student data
        all_students_data.extend(session.get("students", []))
    
    # Calculate overall statistics
    overall_stats = calculate_engagement_stats(all_students_data)
    avg_duration = total_duration / len(sessions) if sessions else 0
    
    return {
        "teacher_id": current_user.id,
        "teacher_name": current_user.name,
        "period_days": days,
        "total_sessions": len(sessions),
        "total_students": total_students,
        "total_duration_minutes": round(total_duration, 1),
        "avg_session_duration": round(avg_duration, 1),
        "avg_focus_level": overall_stats["avg_focus"],
        "avg_engagement": overall_stats["avg_engagement"],
        "sessions_by_subject": sessions_by_subject,
        "emotion_distribution": overall_stats["emotions"],
        "engagement_distribution": overall_stats["engagement_distribution"],
        "focus_distribution": overall_stats["focus_distribution"]
    }

@router.get("/student/summary")
async def get_student_summary(
    days: int = 30,
    current_user: UserInDB = Depends(get_current_student)
):
    """Get summary report for student across all attended sessions"""
    db = await get_database()
    
    # Get all sessions the student attended within date range
    start_date = datetime.utcnow() - timedelta(days=days)
    sessions = await db.sessions.find({
        "students.id": current_user.id,
        "created_at": {"$gte": start_date}
    }).to_list(None)
    
    if not sessions:
        return {
            "student_id": current_user.id,
            "student_name": current_user.name,
            "period_days": days,
            "total_sessions": 0,
            "total_duration_minutes": 0,
            "avg_focus_level": 0,
            "avg_engagement": 0,
            "subjects_attended": {},
            "performance_trend": [],
            "emotion_distribution": {},
            "recommendations": []
        }
    
    # Calculate statistics for this student
    total_duration = 0
    student_performance = []
    subjects = {}
    
    for session in sessions:
        # Find student data in this session
        student_data = next((s for s in session.get("students", []) if s["id"] == current_user.id), None)
        if not student_data:
            continue
        
        # Calculate duration
        duration = 0
        if session.get("started_at") and session.get("ended_at"):
            duration_delta = session["ended_at"] - session["started_at"]
            duration = duration_delta.total_seconds() / 60
            total_duration += duration
        
        # Track performance
        student_performance.append({
            "session_id": session["_id"],
            "session_code": session["session_code"],
            "subject": session["subject"],
            "date": session.get("started_at", session["created_at"]).isoformat(),
            "duration_minutes": round(duration, 1),
            "focus_level": student_data.get("focus_level", 0),
            "engagement": student_data.get("engagement", "passive"),
            "emotion": student_data.get("emotion", "neutral")
        })
        
        # Group by subject
        subject = session["subject"]
        if subject not in subjects:
            subjects[subject] = {
                "count": 0,
                "total_focus": 0,
                "emotions": {}
            }
        subjects[subject]["count"] += 1
        subjects[subject]["total_focus"] += student_data.get("focus_level", 0)
        
        emotion = student_data.get("emotion", "neutral")
        subjects[subject]["emotions"][emotion] = subjects[subject]["emotions"].get(emotion, 0) + 1
    
    # Calculate averages
    total_focus = sum(p["focus_level"] for p in student_performance)
    avg_focus = total_focus / len(student_performance) if student_performance else 0
    
    active_count = sum(1 for p in student_performance if p["engagement"] == "active")
    avg_engagement = (active_count / len(student_performance) * 100) if student_performance else 0
    
    # Calculate emotion distribution
    emotion_counts = {}
    for perf in student_performance:
        emotion = perf["emotion"]
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    # Generate recommendations
    recommendations = []
    if avg_focus < 50:
        recommendations.append("Try to minimize distractions during sessions")
        recommendations.append("Consider taking short breaks to maintain focus")
    if avg_engagement < 50:
        recommendations.append("Engage more actively with the learning material")
        recommendations.append("Ask questions when concepts are unclear")
    
    positive_emotions = emotion_counts.get("happiness", 0) + emotion_counts.get("neutral", 0)
    negative_emotions = emotion_counts.get("sadness", 0) + emotion_counts.get("fear", 0) + emotion_counts.get("anger", 0)
    if negative_emotions > positive_emotions:
        recommendations.append("Consider discussing any learning challenges with your teacher")
        recommendations.append("Ensure you're getting adequate rest before sessions")
    
    # Calculate subject averages
    subjects_summary = {}
    for subject, data in subjects.items():
        subjects_summary[subject] = {
            "sessions_attended": data["count"],
            "avg_focus": round(data["total_focus"] / data["count"], 1),
            "top_emotion": max(data["emotions"].items(), key=lambda x: x[1])[0] if data["emotions"] else "neutral"
        }
    
    return {
        "student_id": current_user.id,
        "student_name": current_user.name,
        "period_days": days,
        "total_sessions": len(sessions),
        "total_duration_minutes": round(total_duration, 1),
        "avg_focus_level": round(avg_focus, 1),
        "avg_engagement": round(avg_engagement, 1),
        "subjects_attended": subjects_summary,
        "performance_history": sorted(student_performance, key=lambda x: x["date"], reverse=True),
        "emotion_distribution": emotion_counts,
        "recommendations": recommendations
    }

@router.get("/session/{session_id}/export")
async def export_session_report(
    session_id: str,
    format: str = "json",
    current_user: UserInDB = Depends(get_current_user)
):
    """Export session report in various formats (json, csv, pdf)"""
    # Get the report data
    report = await get_session_report(session_id, current_user)
    
    if format == "pdf":
        # Generate PDF
        from pdf_generator import create_session_pdf_report
        
        pdf_buffer = create_session_pdf_report(report)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=session_{session_id}_report.pdf"
            }
        )
    
    elif format == "csv":
        # Generate CSV
        from io import StringIO
        import csv
        
        output = StringIO()
        
        # Write session info
        output.write(f"Session Report\n")
        output.write(f"Session Code,{report['session_code']}\n")
        output.write(f"Subject,{report['subject']}\n")
        output.write(f"Teacher,{report['teacher_name']}\n")
        output.write(f"Date,{report['start_time']}\n")
        output.write(f"Duration (minutes),{report['duration_minutes']}\n")
        output.write(f"\n")
        
        # Write statistics
        output.write(f"Statistics\n")
        output.write(f"Total Students,{report['statistics']['total_students']}\n")
        output.write(f"Average Focus,{report['statistics']['avg_focus']}%\n")
        output.write(f"Average Engagement,{report['statistics']['avg_engagement']}%\n")
        output.write(f"\n")
        
        # Write student details
        output.write(f"Student Details\n")
        writer = csv.DictWriter(output, fieldnames=["Name", "Email", "Joined At", "Emotion", "Engagement", "Focus Level"])
        writer.writeheader()
        
        for student in report['students']:
            writer.writerow({
                "Name": student["name"],
                "Email": student.get("email", "N/A"),
                "Joined At": student["joined_at"],
                "Emotion": student["emotion"],
                "Engagement": student["engagement"],
                "Focus Level": f"{student['focus_level']}%"
            })
        
        csv_content = output.getvalue()
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=session_{session_id}_report.csv"
            }
        )
    
    # Default: JSON format
    return report

@router.get("/teacher/summary/export")
async def export_teacher_summary(
    days: int = 30,
    format: str = "pdf",
    current_user: UserInDB = Depends(get_current_teacher)
):
    """Export teacher summary report as PDF or JSON"""
    summary = await get_teacher_summary(days, current_user)
    
    if format == "pdf":
        from pdf_generator import create_summary_pdf_report
        
        pdf_buffer = create_summary_pdf_report(summary, "teacher")
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=teacher_summary_{days}days.pdf"
            }
        )
    
    return summary

@router.get("/student/summary/export")
async def export_student_summary(
    days: int = 30,
    format: str = "pdf",
    current_user: UserInDB = Depends(get_current_student)
):
    """Export student summary report as PDF or JSON"""
    summary = await get_student_summary(days, current_user)
    
    if format == "pdf":
        from pdf_generator import create_summary_pdf_report
        
        pdf_buffer = create_summary_pdf_report(summary, "student")
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=student_summary_{days}days.pdf"
            }
        )
    
    return summary

@router.get("/admin/overview")
async def get_admin_overview(
    days: int = 30,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get system-wide overview for administrators"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    db = await get_database()
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all sessions
    sessions = await db.sessions.find({
        "created_at": {"$gte": start_date}
    }).to_list(None)
    
    # Get all users
    teachers = await db.users.count_documents({"role": "teacher"})
    students = await db.users.count_documents({"role": "student"})
    
    # Calculate system-wide statistics
    total_duration = 0
    all_students_data = []
    active_sessions = 0
    
    for session in sessions:
        if session["is_active"]:
            active_sessions += 1
        
        if session.get("started_at") and session.get("ended_at"):
            duration = session["ended_at"] - session["started_at"]
            total_duration += duration.total_seconds() / 60
        
        all_students_data.extend(session.get("students", []))
    
    overall_stats = calculate_engagement_stats(all_students_data)
    
    return {
        "period_days": days,
        "system_stats": {
            "total_teachers": teachers,
            "total_students": students,
            "total_sessions": len(sessions),
            "active_sessions": active_sessions,
            "completed_sessions": len(sessions) - active_sessions
        },
        "usage_stats": {
            "total_duration_minutes": round(total_duration, 1),
            "avg_session_duration": round(total_duration / len(sessions), 1) if sessions else 0,
            "total_participants": overall_stats["total_students"]
        },
        "engagement_stats": {
            "avg_focus_level": overall_stats["avg_focus"],
            "avg_engagement": overall_stats["avg_engagement"],
            "emotion_distribution": overall_stats["emotions"],
            "focus_distribution": overall_stats["focus_distribution"]
        }
    }
