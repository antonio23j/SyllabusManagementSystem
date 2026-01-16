from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.models import Department, User
from app.utils.auth import get_current_user, get_db
from pydantic import BaseModel
from typing import Optional

class DepartmentCreate(BaseModel):
    name: str
    head_id: Optional[int] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    head_id: Optional[int] = None

router = APIRouter()

@router.post("/", response_model=DepartmentResponse)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_dept = Department(name=dept.name, head_id=dept.head_id)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/", response_model=list[DepartmentResponse])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    depts = db.query(Department).offset(skip).limit(limit).all()
    return depts

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, dept: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_dept = db.query(Department).filter(Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db_dept.name = dept.name
    db_dept.head_id = dept.head_id
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db_dept = db.query(Department).filter(Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Check for dependencies that would prevent deletion
    from app.models.models import User, Subject

    # Check if department has users
    users_count = db.query(User).filter(User.department_id == dept_id).count()
    if users_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department: it has {users_count} user(s). Please move users to another department first."
        )

    # Check if department has subjects
    subjects_count = db.query(Subject).filter(Subject.department_id == dept_id).count()
    if subjects_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department: it has {subjects_count} subject(s). Please move subjects to another department first."
        )

    try:
        db.delete(db_dept)
        db.commit()
        return {"message": "Department deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete department: {str(e)}")