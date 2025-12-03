from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models import NotificationCreate, NotificationResponse, UserInDB
from auth import get_current_user
from database import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def get_user_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get notifications for the current user"""
    db = await get_database()
    
    query = {"user_id": current_user.id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    return [NotificationResponse(**notification) for notification in notifications]

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification: NotificationCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new notification"""
    db = await get_database()
    
    notification_dict = notification.model_dump()
    notification_dict["_id"] = str(ObjectId())
    notification_dict["created_at"] = datetime.utcnow()
    notification_dict["read"] = False
    
    await db.notifications.insert_one(notification_dict)
    
    return NotificationResponse(**notification_dict)

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Mark a notification as read"""
    db = await get_database()
    
    result = await db.notifications.update_one(
        {"_id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: UserInDB = Depends(get_current_user)
):
    """Mark all notifications as read for the current user"""
    db = await get_database()
    
    result = await db.notifications.update_many(
        {"user_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a notification"""
    db = await get_database()
    
    result = await db.notifications.delete_one(
        {"_id": notification_id, "user_id": current_user.id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification deleted successfully"}

@router.get("/unread-count")
async def get_unread_count(
    current_user: UserInDB = Depends(get_current_user)
):
    """Get count of unread notifications"""
    db = await get_database()
    
    count = await db.notifications.count_documents({
        "user_id": current_user.id,
        "read": False
    })
    
    return {"unread_count": count}
