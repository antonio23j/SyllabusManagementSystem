from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.models import Subject, User, Assignment
from app.utils.auth import get_current_user, get_db
from pydantic import BaseModel

class SubjectCreate(BaseModel):
    name: str
    code: str
    department_id: int

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    department_id: int

router = APIRouter()

@router.post("/", response_model=SubjectResponse)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_subject = Subject(name=subject.name, code=subject.code, department_id=subject.department_id)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/", response_model=list[SubjectResponse])
def read_subjects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subjects = db.query(Subject).offset(skip).limit(limit).all()
    return subjects

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, subject: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db_subject.name = subject.name
    db_subject.code = subject.code
    db_subject.department_id = subject.department_id
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Check for dependencies that would prevent deletion
    from app.models.models import Assignment, Syllabus

    # Check if subject has assignments
    assignments_count = db.query(Assignment).filter(Assignment.subject_id == subject_id).count()
    if assignments_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subject: it has {assignments_count} assignment(s). Please remove assignments first."
        )

    # Check if subject has syllabi
    syllabi_count = db.query(Syllabus).filter(Syllabus.subject_id == subject_id).count()
    if syllabi_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subject: it has {syllabi_count} syllabus(es). Please delete syllabi first."
        )

    try:
        db.delete(db_subject)
        db.commit()
        return {"message": "Subject deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete subject: {str(e)}")

@router.get("/my", response_model=list[SubjectResponse])
def read_my_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subjects = db.query(Subject).join(Assignment).filter(Assignment.teacher_id == current_user.id).all()
    return subjects

class AssignmentCreate(BaseModel):
    teacher_id: int
    subject_id: int

@router.post("/assign", response_model=AssignmentCreate)
def assign_subject(assignment: AssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_assignment = Assignment(teacher_id=assignment.teacher_id, subject_id=assignment.subject_id)
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return assignment