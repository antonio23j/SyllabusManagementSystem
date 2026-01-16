from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.models.models import Syllabus, User
from app.utils.auth import get_current_user, get_db
from pydantic import BaseModel
from typing import Optional
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from io import BytesIO
import json

class SyllabusCreate(BaseModel):
    subject_id: int
    teacher_id: Optional[int] = None  # Optional for teachers, required for admins
    template_data: dict
    status: str = "draft"

class SyllabusUpdate(BaseModel):
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    template_data: Optional[dict] = None
    status: Optional[str] = None

class SyllabusResponse(BaseModel):
    id: int
    subject_id: int
    teacher_id: int
    template_data: dict
    status: str
    version: int

router = APIRouter()

@router.post("/", response_model=SyllabusResponse)
def create_syllabus(syllabus: SyllabusCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    teacher_id = syllabus.teacher_id if syllabus.teacher_id else current_user.id

    # Find the latest version for this subject-teacher combination
    latest_syllabus = db.query(Syllabus).filter(
        Syllabus.subject_id == syllabus.subject_id,
        Syllabus.teacher_id == teacher_id
    ).order_by(Syllabus.version.desc()).first()

    next_version = 1 if not latest_syllabus else latest_syllabus.version + 1

    db_syllabus = Syllabus(
        subject_id=syllabus.subject_id,
        teacher_id=teacher_id,
        template_data=syllabus.template_data,
        status=syllabus.status,
        version=next_version
    )
    db.add(db_syllabus)
    db.commit()
    db.refresh(db_syllabus)
    return db_syllabus

@router.get("/my", response_model=list[SyllabusResponse])
def read_my_syllabi(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    syllabi = db.query(Syllabus).filter(Syllabus.teacher_id == current_user.id).all()
    return syllabi

@router.get("/pending", response_model=list[SyllabusResponse])
def read_pending_syllabi(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "head":
        raise HTTPException(status_code=403, detail="Not authorized")
    from app.models.models import Department
    dept = db.query(Department).filter(Department.head_id == current_user.id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="No department found")
    syllabi = db.query(Syllabus).join(Syllabus.subject).filter(Syllabus.status == "pending", Syllabus.subject.has(department_id=dept.id)).all()
    return syllabi

# Admin-only routes
@router.get("/all", response_model=list[SyllabusResponse])
def read_all_syllabi(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    syllabi = db.query(Syllabus).offset(skip).limit(limit).all()
    return syllabi

@router.put("/{syllabus_id}/status")
def update_status(syllabus_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "head":
        raise HTTPException(status_code=403, detail="Not authorized")
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    syllabus.status = status
    db.commit()
    return {"message": "Status updated"}

@router.put("/{syllabus_id}", response_model=SyllabusResponse)
def update_syllabus(syllabus_id: int, syllabus: SyllabusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db_syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not db_syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Update only provided fields
    if syllabus.subject_id is not None:
        db_syllabus.subject_id = syllabus.subject_id
    if syllabus.teacher_id is not None:
        db_syllabus.teacher_id = syllabus.teacher_id
    if syllabus.template_data is not None:
        db_syllabus.template_data = syllabus.template_data
    if syllabus.status is not None:
        db_syllabus.status = syllabus.status

    db.commit()
    db.refresh(db_syllabus)
    return db_syllabus

@router.delete("/{syllabus_id}")
def delete_syllabus(syllabus_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db_syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not db_syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    try:
        db.delete(db_syllabus)
        db.commit()
        return {"message": "Syllabus deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete syllabus: {str(e)}")

@router.get("/{syllabus_id}/pdf")
def download_syllabus_pdf(syllabus_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user can access this syllabus
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    # Allow access if user is teacher of the syllabus, admin, or head of department
    if current_user.role not in ["admin"]:
        if current_user.role == "teacher" and syllabus.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        elif current_user.role == "head":
            from app.models.models import Department
            dept = db.query(Department).filter(Department.head_id == current_user.id).first()
            if not dept or syllabus.subject.department_id != dept.id:
                raise HTTPException(status_code=403, detail="Not authorized")

    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=1  # Center alignment
    )

    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12
    )

    content_style = styles['Normal']

    story = []

    # Get template data
    template_data = syllabus.template_data or {}

    # Title
    course_title = template_data.get('courseTitle', 'Course Title')
    course_code = template_data.get('courseCode', 'Course Code')
    story.append(Paragraph(f"{course_title}<br/>{course_code}", title_style))
    story.append(Spacer(1, 12))

    # Instructor Info
    instructor = template_data.get('instructor', 'Instructor Name')
    email = template_data.get('email', '')
    office_hours = template_data.get('officeHours', '')

    story.append(Paragraph("Instructor Information", heading_style))
    story.append(Paragraph(f"<b>Name:</b> {instructor}", content_style))
    if email:
        story.append(Paragraph(f"<b>Email:</b> {email}", content_style))
    if office_hours:
        story.append(Paragraph(f"<b>Office Hours:</b> {office_hours}", content_style))
    story.append(Spacer(1, 12))

    # Subject Information
    typology = template_data.get('typology', '')
    subject_type = template_data.get('type', '')
    if typology or subject_type:
        story.append(Paragraph("Subject Information", heading_style))
        if typology:
            typology_descriptions = {
                'A': 'Basic',
                'B': 'Intermediate',
                'C': 'Advanced',
                'D': 'Specialized',
                'E': 'Research',
                'F': 'Practical'
            }
            typology_desc = typology_descriptions.get(typology, '')
            story.append(Paragraph(f"<b>Typology:</b> {typology} - {typology_desc}", content_style))
        if subject_type:
            story.append(Paragraph(f"<b>Type:</b> {subject_type.title()}", content_style))
        story.append(Spacer(1, 12))

    # Course Description
    course_description = template_data.get('courseDescription', '')
    if course_description:
        story.append(Paragraph("Course Description", heading_style))
        story.append(Paragraph(course_description, content_style))
        story.append(Spacer(1, 12))

    # Learning Objectives
    learning_objectives = template_data.get('learningObjectives', '')
    if learning_objectives:
        story.append(Paragraph("Learning Objectives", heading_style))
        story.append(Paragraph(learning_objectives, content_style))
        story.append(Spacer(1, 12))

    # Prerequisites
    prerequisites = template_data.get('prerequisites', '')
    if prerequisites:
        story.append(Paragraph("Prerequisites", heading_style))
        story.append(Paragraph(prerequisites, content_style))
        story.append(Spacer(1, 12))

    # Required Materials
    textbooks = template_data.get('textbooks', '')
    if textbooks:
        story.append(Paragraph("Required Materials", heading_style))
        story.append(Paragraph(textbooks, content_style))
        story.append(Spacer(1, 12))

    # Grading Policy
    grading_policy = template_data.get('gradingPolicy', '')
    if grading_policy:
        story.append(Paragraph("Grading Policy", heading_style))
        story.append(Paragraph(grading_policy, content_style))
        story.append(Spacer(1, 12))

    # Course Policies
    attendance_policy = template_data.get('attendancePolicy', '')
    academic_integrity = template_data.get('academicIntegrity', '')

    if attendance_policy or academic_integrity:
        story.append(Paragraph("Course Policies", heading_style))
        if attendance_policy:
            story.append(Paragraph(f"<b>Attendance:</b> {attendance_policy}", content_style))
        if academic_integrity:
            story.append(Paragraph(f"<b>Academic Integrity:</b> {academic_integrity}", content_style))
        story.append(Spacer(1, 12))

    # Schedule
    schedule = template_data.get('schedule', '')
    if schedule:
        story.append(Paragraph("Course Schedule", heading_style))
        story.append(Paragraph(schedule.replace('\n', '<br/>'), content_style))
        story.append(Spacer(1, 12))

    # Footer
    from datetime import datetime
    story.append(Spacer(1, 24))
    story.append(Paragraph(f"This syllabus is subject to change at the instructor's discretion.<br/>Last updated: {datetime.now().strftime('%Y-%m-%d')}", styles['Italic']))

    # Build PDF
    doc.build(story)

    buffer.seek(0)

    # Return PDF as streaming response
    filename = f"syllabus-{course_code or 'template'}.pdf"
    return StreamingResponse(
        buffer,
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )