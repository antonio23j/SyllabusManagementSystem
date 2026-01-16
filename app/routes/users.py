from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.models import User
from app.utils.auth import get_current_user, get_db, get_password_hash
from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    department_id: int

class UserUpdate(BaseModel):
    email: str
    password: Optional[str] = None
    role: str
    department_id: int

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    department_id: int

router = APIRouter()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, password_hash=hashed_password, role=user.role, department_id=user.department_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=list[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.email = user.email
    if user.password:  # Only update password if provided
        hashed_password = get_password_hash(user.password)
        db_user.password_hash = hashed_password
    db_user.role = user.role
    db_user.department_id = user.department_id
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Prevent admin from deleting themselves
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for dependencies that would prevent deletion
    from app.models.models import Department, Assignment, Syllabus

    # Check if user is department head
    dept_head = db.query(Department).filter(Department.head_id == user_id).first()
    if dept_head:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user: they are the head of department '{dept_head.name}'. Please assign a new head first."
        )

    # Check if user has assignments
    assignments = db.query(Assignment).filter(Assignment.teacher_id == user_id).count()
    if assignments > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user: they have {assignments} subject assignment(s). Please remove assignments first."
        )

    # Check if user has syllabi
    syllabi = db.query(Syllabus).filter(Syllabus.teacher_id == user_id).count()
    if syllabi > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user: they have {syllabi} syllabus(es). Please delete syllabi first."
        )

    try:
        db.delete(db_user)
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")