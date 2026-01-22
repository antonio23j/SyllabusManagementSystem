from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.models.models import Syllabus, User
from app.utils.auth import get_current_user
from app.database import get_db
from pydantic import BaseModel
from typing import Optional
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from io import BytesIO
import textwrap
import os
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
    
    class Config:
        from_attributes = True

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

# SPECIFIC ROUTES - MUST COME BEFORE GENERIC /{syllabus_id} ROUTE
@router.get("/all", response_model=list[SyllabusResponse])
def read_all_syllabi(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    syllabi = db.query(Syllabus).order_by(Syllabus.id).offset(skip).limit(limit).all()
    return syllabi

@router.get("/my", response_model=list[SyllabusResponse])
def read_my_syllabi(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    syllabi = db.query(Syllabus).filter(Syllabus.teacher_id == current_user.id).order_by(Syllabus.id).offset(skip).limit(limit).all()
    return syllabi

@router.get("/pending", response_model=list[SyllabusResponse])
def read_pending_syllabi(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["head", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from app.models.models import Department
    
    if current_user.role == "head":
        dept = db.query(Department).filter(Department.head_id == current_user.id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="No department found")
        syllabi = db.query(Syllabus).join(Syllabus.subject).filter(
            Syllabus.status == "pending", 
            Syllabus.subject.has(department_id=dept.id)
        ).order_by(Syllabus.id).offset(skip).limit(limit).all()
    else:  # admin sees all pending
        syllabi = db.query(Syllabus).filter(Syllabus.status == "pending").order_by(Syllabus.id).offset(skip).limit(limit).all()
    
    return syllabi

# GENERIC ROUTES - COME AFTER SPECIFIC ONES
@router.get("/{syllabus_id}", response_model=SyllabusResponse)
def read_syllabus(syllabus_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    # Authorization: teacher, admin, or department head can view
    if current_user.role not in ["admin"]:
        if current_user.role == "teacher" and syllabus.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        elif current_user.role == "head":
            from app.models.models import Department
            dept = db.query(Department).filter(Department.head_id == current_user.id).first()
            if not dept or syllabus.subject.department_id != dept.id:
                raise HTTPException(status_code=403, detail="Not authorized")
    
    return syllabus

@router.put("/{syllabus_id}/status")
def update_status(syllabus_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["head", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    # Only heads can approve their department's syllabi, admins can do anything
    if current_user.role == "head":
        from app.models.models import Department
        dept = db.query(Department).filter(Department.head_id == current_user.id).first()
        if not dept or syllabus.subject.department_id != dept.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    syllabus.status = status
    db.commit()
    db.refresh(syllabus)
    return {"message": "Status updated", "syllabus": syllabus}

@router.put("/{syllabus_id}", response_model=SyllabusResponse)
def update_syllabus(syllabus_id: int, syllabus: SyllabusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not db_syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    # Teachers can only update their own syllabi
    if current_user.role == "teacher" and db_syllabus.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

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

def generate_english_syllabus_pdf(syllabus, template_data):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 20 * mm
    y_pos = height - margin

    table_width = width - (2 * margin)
    first_col_width = 65 * mm
    remaining_width = table_width - first_col_width
    light_blue = HexColor('#3498db')
    dark_blue = HexColor('#1a237e')
    black = HexColor('#000000')

    def draw_footer(canvas_obj):
        canvas_obj.saveState()
        canvas_obj.setFillAlpha(0.4)  # Set opacity to 40%
        canvas_obj.setFillColor(black)
        canvas_obj.setFont('Helvetica', 7)
        footer_text = "Adresa: Bulevardi “ Zogu I “, Nr. 25/1, Tiranë, Tel. & Fax: +355 4 2229590. www.fshn.edu.al"
        canvas_obj.drawCentredString(width / 2, 10 * mm, footer_text)
        canvas_obj.restoreState()

    def get_typology_string(typ):
        """Map typology codes to descriptions [cite: 3]"""
        mapping = {
            'A': 'Basic', 'B': 'Intermediate', 'C': 'Advanced',
            'D': 'Specialized', 'E': 'Research', 'F': 'Practical'
        }
        return f"{typ} - {mapping.get(typ, '')}"

    def draw_dynamic_row(y, cells, bold_first=False, is_header=False):
        """Calculates row height dynamically based on the longest wrapped text"""
        num_cols = len(cells)
        other_col_width = remaining_width / max((num_cols - 1), 1)

        # 1. Wrap text and determine required height
        wrapped_cells = []
        max_lines = 1
        for i, text in enumerate(cells):
            curr_w = first_col_width if i == 0 else other_col_width
            # Font size 8.5pt needs roughly 1.8 units per character
            chars_per_line = int(curr_w / 1.7)
            lines = textwrap.wrap(str(text if text else ""), width=chars_per_line)
            wrapped_cells.append(lines)
            max_lines = max(max_lines, len(lines))

        # Calculate dynamic height (4mm per line + padding)
        row_h = max(10 * mm, (max_lines * 4 * mm) + 3 * mm)

        # Handle Page Breaks
        if y - row_h < 25 * mm:
            c.showPage()
            y = height - margin
            draw_footer(c)

        # 2. Draw Row
        curr_x = margin
        for i, lines in enumerate(wrapped_cells):
            curr_w = first_col_width if i == 0 else other_col_width
            c.setLineWidth(0.5)
            c.rect(curr_x, y - row_h, curr_w, row_h)

            # Text Styling
            if i == 0:
                c.setFillColor(light_blue)  # Light blue text for the first cell
                c.setFont('Helvetica-Bold' if bold_first else 'Helvetica', 8.5)
            else:
                c.setFillColor(HexColor('#000000'))
                c.setFont('Helvetica-Bold' if is_header else 'Helvetica', 8.5)

            # Draw each line inside the cell
            text_y = y - 5 * mm
            for line in lines:
                c.drawString(curr_x + 2 * mm, text_y, line)
                text_y -= 4 * mm

            curr_x += curr_w

        c.setFillColor(HexColor('#000000'))  # Reset color
        return y - row_h

    # === HEADER: CENTERED LOGO ===
    current_script_dir = os.path.dirname(__file__)
    logo_path = os.path.join(current_script_dir, 'universiteti-i-tiranes-logo.jpg')

    print("Logo path:", logo_path)
    if os.path.exists(logo_path):
        img_width = 30 * mm
        img_height = 20 * mm

        c.drawImage(
            logo_path,
            (width - img_width) / 2,
            y_pos - img_height,
            width=img_width,
            height=img_height,
            preserveAspectRatio=True,
            mask='auto'
        )

        y_pos -= img_height + 5 * mm
    else:
        y_pos -= 10 * mm

    # === TITLES [cite: 1, 2] ===
    c.setFillColor(dark_blue)
    c.setFont('Helvetica-Bold', 12)
    c.drawCentredString(width / 2, y_pos, syllabus.subject.department.name)
    y_pos -= 7 * mm
    c.drawCentredString(width / 2, y_pos, 'SUBJECT PROGRAM:')
    y_pos -= 10 * mm

    # === TABLE 1 [cite: 3] ===
    headers = ['Subject activity', 'Lectures', 'Exercises', 'Laboratories', 'Practice', 'Total']
    y_pos = draw_dynamic_row(y_pos, headers, bold_first=True, is_header=True)

    typ_val = template_data.get('typology', 'B')
    rows = [
        ['Student duties', 'Not compulsory', '75%', '100%', '100%', ''],
        ['Class hours', '30', '15', '30', '', '75'],
        ['Individual studies', '75'],
        ['Lesson language', 'Anglisht'],
        ['Evaluation forms (ESE/TSE)', 'TSE'],
        ['Subject typology / Type of the subject/ Subject code',
         f"{get_typology_string(typ_val)} / {template_data.get('type', '')} / {template_data.get('courseCode', '')}"],
        ['Ethical code', 'Referred to Ethical code of UT, approved by Decision No. 12, date 18.04.2011'],
        ['Exam form', 'Written'],
        ['Credits', {template_data.get('credits', '5')}],
        ['Lesson form',
         f"Viti {template_data.get('year', 'I')}, Sem {template_data.get('semester', 'II')}, {template_data.get('schedule', '')}"],
    ]

    for row in rows:
        y_pos = draw_dynamic_row(y_pos, row)

    # === GRADING [cite: 3] ===
    y_pos = draw_dynamic_row(y_pos, ['End Semester Evaluation (ESE)', template_data.get('semesterEvaluation', '')], bold_first=True,
                             is_header=True)
    grading = [
        ['', 'Presence and active participation', f"{template_data.get('otherPercent', '0')}%"],
        ['', 'Midterm control', f"{template_data.get('midtermPercent', '0')}%"],
        ['', 'Projects', f"{template_data.get('assignmentsPercent', '0')}%"],
        ['', 'Final exam', f"{template_data.get('finalPercent', '0')}%"],
        ['', 'Total', '100%']
    ]
    for g_row in grading:
        y_pos = draw_dynamic_row(y_pos, g_row)

    y_pos = draw_dynamic_row(y_pos, ['Subject Representative', f"Prof. Dr., {template_data.get('instructor', '')}"],
                             bold_first=True)

    # === PAGE 2 SECTIONS [cite: 4] ===
    c.showPage()
    y_pos = height - margin
    draw_footer(c)

    sections = [
        ('Basic concepts', template_data.get('additionalDescription', '')),
        ('Objectives', template_data.get('learningObjectives', '')),
        ('Foreknowledge', template_data.get('prerequisites', '')),
        ('Skills given', 'Aftësi analitike në fushën e lëndës.'),
        ('Topics of the Lectures', template_data.get('lectureTopics', '')),
        ('Literature', f"Tekste bazë: {template_data.get('textbooks', '')}")
    ]

    for title, content in sections:
        # These now expand in height if the content is long
        y_pos = draw_dynamic_row(y_pos, [title, content], bold_first=True)

    # === SIGNATURES [cite: 5, 6] ===
    y_pos -= 20 * mm
    c.setFont('Helvetica-Bold', 9)
    c.drawString(margin, y_pos, 'Subject Representative')
    c.drawString(width - margin - 55 * mm, y_pos, 'Head of Department')
    y_pos -= 6 * mm
    c.setFont('Helvetica', 9)
    c.drawString(margin, y_pos, f"Prof. Dr. {template_data.get('instructor', 'Ana Ktona')}")

    draw_footer(c)

    c.save()
    buffer.seek(0)
    return buffer

def generate_albanian_syllabus_pdf(syllabus, template_data):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 20 * mm
    y_pos = height - margin

    table_width = width - (2 * margin)
    first_col_width = 65 * mm
    remaining_width = table_width - first_col_width
    light_blue = HexColor('#3498db')
    dark_blue = HexColor('#1a237e')
    black = HexColor('#000000')

    def draw_footer(canvas_obj):
        canvas_obj.saveState()
        canvas_obj.setFillAlpha(0.4)  # Set opacity to 40%
        canvas_obj.setFillColor(black)
        canvas_obj.setFont('Helvetica', 7)
        footer_text = "Adresa: Bulevardi “ Zogu I “, Nr. 25/1, Tiranë, Tel. & Fax: +355 4 2229590. www.fshn.edu.al"
        canvas_obj.drawCentredString(width / 2, 10 * mm, footer_text)
        canvas_obj.restoreState()

    def get_typology_string(typ):
        """Map typology codes to descriptions [cite: 3]"""
        mapping = {
            'A': 'Basic', 'B': 'Intermediate', 'C': 'Advanced',
            'D': 'Specialized', 'E': 'Research', 'F': 'Practical'
        }
        return f"{typ} - {mapping.get(typ, '')}"

    def draw_dynamic_row(y, cells, bold_first=False, is_header=False):
        """Calculates row height dynamically based on the longest wrapped text"""
        num_cols = len(cells)
        other_col_width = remaining_width / max((num_cols - 1), 1)

        # 1. Wrap text and determine required height
        wrapped_cells = []
        max_lines = 1
        for i, text in enumerate(cells):
            curr_w = first_col_width if i == 0 else other_col_width
            # Font size 8.5pt needs roughly 1.8 units per character
            chars_per_line = int(curr_w / 1.7)
            lines = textwrap.wrap(str(text if text else ""), width=chars_per_line)
            wrapped_cells.append(lines)
            max_lines = max(max_lines, len(lines))

        # Calculate dynamic height (4mm per line + padding)
        row_h = max(10 * mm, (max_lines * 4 * mm) + 3 * mm)

        # Handle Page Breaks
        if y - row_h < 25 * mm:
            draw_footer(c)
            c.showPage()
            y = height - margin

        curr_x = margin
        for i, lines in enumerate(wrapped_cells):
            curr_w = first_col_width if i == 0 else other_col_width
            c.setLineWidth(0.5)
            c.rect(curr_x, y - row_h, curr_w, row_h)

            # Text Styling
            if i == 0:
                c.setFillColor(light_blue)  # Light blue text for the first cell
                c.setFont('Helvetica-Bold' if bold_first else 'Helvetica', 8.5)
            else:
                c.setFillColor(HexColor('#000000'))
                c.setFont('Helvetica-Bold' if is_header else 'Helvetica', 8.5)

            # Draw each line inside the cell
            text_y = y - 5 * mm
            for line in lines:
                c.drawString(curr_x + 2 * mm, text_y, line)
                text_y -= 4 * mm

            curr_x += curr_w

        c.setFillColor(HexColor('#000000'))  # Reset color
        return y - row_h

    # === HEADER: CENTERED LOGO ===
    current_script_dir = os.path.dirname(__file__)
    logo_path = os.path.join(current_script_dir, 'universiteti-i-tiranes-logo.jpg')

    print("Logo path:", logo_path)
    if os.path.exists(logo_path):
        img_width = 30 * mm
        img_height = 20 * mm

        c.drawImage(
            logo_path,
            (width - img_width) / 2,
            y_pos - img_height,
            width=img_width,
            height=img_height,
            preserveAspectRatio=True,
            mask='auto'
        )

        y_pos -= img_height + 5 * mm
    else:
        y_pos -= 10 * mm

    # === TITLES [cite: 1, 2] ===
    c.setFillColor(dark_blue)
    c.setFont('Helvetica-Bold', 12)
    c.drawCentredString(width / 2, y_pos, syllabus.subject.department.name)
    y_pos -= 7 * mm
    c.drawCentredString(width / 2, y_pos, 'PROGRAMI I LËNDËS:')
    y_pos -= 10 * mm

    # === TABLE 1 [cite: 3] ===
    headers = ['Aktiviteti mësimor', 'Leksione', 'Ushtrime', 'Laboratore', 'Praktike', 'Totale']
    y_pos = draw_dynamic_row(y_pos, headers, bold_first=True, is_header=True)

    typ_val = template_data.get('typology', 'B')
    rows = [
        ['Detyrimi i studentit', 'Jo të detyrueshëm', '75%', '100%', '100%', ''],
        ['Orë mesimore', ''],
        ['Studim individuale', ''],
        ['Gjuha e zhvillimit të mësimit', 'Anglisht'],
        ['Tipologjia / Lloji / Kodi',
         f"{get_typology_string(typ_val)} / {template_data.get('type', '')} / {template_data.get('courseCode', '')}"],
        ['Kodi i etikës', 'Referuar Kodit të etikës së UT'],
        ['Mënyra e shlyerjes', 'Provim'],
        ['Kredite', {template_data.get('credits', '5')}],
        ['Zhvillimi i Mësimit',
         f"Viti {template_data.get('year', 'I')}, Sem {template_data.get('semester', 'II')}, {template_data.get('schedule', '')}"],
        ['Zhvillimi i Provimit', template_data.get('gradingPolicy', '')]
    ]

    for row in rows:
        y_pos = draw_dynamic_row(y_pos, row)

    # === GRADING [cite: 3] ===
    y_pos = draw_dynamic_row(y_pos, ['Vlerësimi, Nota, Provim', 'Elementet', 'Përqindja'], bold_first=True,
                             is_header=True)
    grading = [
        ['', 'Pjesëmarrja dhe aktivizimi', f"{template_data.get('otherPercent', '0')}%"],
        ['', 'Kontrolle të ndërmjetme', f"{template_data.get('midtermPercent', '0')}%"],
        ['', 'Detyra kursi', f"{template_data.get('assignmentsPercent', '0')}%"],
        ['', 'Provimit final', f"{template_data.get('finalPercent', '0')}%"],
        ['', 'Gjithsej', '100%']
    ]
    for g_row in grading:
        y_pos = draw_dynamic_row(y_pos, g_row)

    y_pos = draw_dynamic_row(y_pos, ['Përgjegjësi i lëndës', f"Prof. Dr., {template_data.get('instructor', '')}"],
                             bold_first=True)

    draw_footer(c)

    # === PAGE 2 SECTIONS [cite: 4] ===
    c.showPage()
    y_pos = height - margin

    sections = [
        ('Konceptet themelore', template_data.get('additionalDescription', '')),
        ('Objektivat', template_data.get('learningObjectives', '')),
        ('Njohuritë paraprake', template_data.get('prerequisites', '')),
        ('Aftësitë e studentit', 'Aftësi analitike në fushën e lëndës.'),
        ('Tematika e Leksioneve', template_data.get('lectureTopics', '')),
        ('Literatura', f"Tekste bazë: {template_data.get('textbooks', '')}")
    ]

    for title, content in sections:
        # These now expand in height if the content is long
        y_pos = draw_dynamic_row(y_pos, [title, content], bold_first=True)

    # === SIGNATURES [cite: 5, 6] ===
    y_pos -= 20 * mm
    c.setFont('Helvetica-Bold', 9)
    c.drawString(margin, y_pos, 'Titullari i lëndës')
    c.drawString(width - margin - 55 * mm, y_pos, 'Përgjegjësi i Departamentit')
    y_pos -= 6 * mm
    c.setFont('Helvetica', 9)
    c.drawString(margin, y_pos, f"Prof. Dr. {template_data.get('instructor', 'Ana Ktona')}")

    draw_footer(c)

    c.save()
    buffer.seek(0)
    return buffer
@router.post("/{syllabus_id}/pdf")
def download_syllabus_pdf(
    syllabus_id: int,
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check authorization
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if current_user.role not in ["admin"]:
        if current_user.role == "teacher" and syllabus.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        elif current_user.role == "head":
            from app.models.models import Department
            dept = db.query(Department).filter(Department.head_id == current_user.id).first()
            if not dept or syllabus.subject.department_id != dept.id:
                raise HTTPException(status_code=403, detail="Not authorized")

    # Get template data
    template_data = request_data.get('template_data', {})

    # Generate Albanian format PDF
    language = template_data.get('language', 'AL')
    print('language', language)

    if language == 'EN':
        pdf_buffer = generate_english_syllabus_pdf(syllabus, template_data)
    else:
        pdf_buffer = generate_albanian_syllabus_pdf(syllabus, template_data)

    # Create filename
    course_code = template_data.get('courseCode', 'template')
    filename = f"syllabus-{course_code}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
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


