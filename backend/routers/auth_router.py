from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from models import (
    UserCreate, UserLogin, UserResponse, Token, 
    UserUpdate, ChangePassword, UserInDB
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_active_user
)
from database import get_database
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):
    """Register a new user"""
    db = await get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["created_at"] = datetime.utcnow()
    user_dict["last_login"] = datetime.utcnow()
    user_dict["_id"] = str(ObjectId())
    
    # Insert user into database
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user_dict["_id"],
            "role": user.role
        }
    )
    
    # Return user data without password
    user_response = UserResponse(**user_dict)
    
    return {
        "user": user_response.model_dump(),
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    """Login user and return access token"""
    db = await get_database()
    
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "user_id": user["_id"],
            "role": user["role"]
        }
    )
    
    # Return user data without password
    user_response = UserResponse(**user)
    
    return {
        "user": user_response.model_dump(),
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(**current_user.model_dump())

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Update user profile"""
    db = await get_database()
    
    # Prepare update data (only non-None values)
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data to update"
        )
    
    # Update user in database
    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user.id})
    
    return UserResponse(**updated_user)

@router.put("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Change user password"""
    db = await get_database()
    
    # Verify current password
    user = await db.users.find_one({"_id": current_user.id})
    if not verify_password(password_data.current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_hashed_password = get_password_hash(password_data.new_password)
    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    return {"message": "Password updated successfully"}
