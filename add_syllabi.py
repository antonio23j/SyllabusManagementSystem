#!/usr/bin/env python3
"""
Script to add sample syllabi for Computer Science courses.
Usage: python add_syllabi.py
"""

from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models.models import Syllabus, Subject, User

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Sample syllabus template for different courses
def create_syllabus_data(course_code, course_name, instructor_email, dept_name):
    """Create template data for a syllabus"""
    return {
        "courseTitle": course_name,
        "courseCode": course_code,
        "department": dept_name,
        "instructor": instructor_email.split("@")[0],
        "email": instructor_email,
        "officeHours": "Monday, Wednesday: 2:00 PM - 4:00 PM",
        "typology": "B",  # Intermediate
        "type": "theoretical",
        "courseDescription": f"This course covers the fundamentals and advanced concepts of {course_name}.",
        "learningObjectives": (
            "• Understand core concepts of the subject\n"
            "• Apply theoretical knowledge to practical problems\n"
            "• Develop problem-solving skills\n"
            "• Prepare for advanced courses in the field"
        ),
        "prerequisites": "General knowledge of computer science fundamentals",
        "textbooks": "Primary and supplementary textbooks as recommended",
        "gradingPolicy": (
            "Participation: 10%\n"
            "Assignments: 30%\n"
            "Midterm Exam: 25%\n"
            "Final Exam: 35%"
        ),
        "attendancePolicy": "Regular attendance is expected. More than 3 unexcused absences will affect your grade.",
        "academicIntegrity": "All work submitted must be original. Academic dishonesty will result in course failure.",
        "schedule": (
            "Week 1-2: Introduction and Fundamentals\n"
            "Week 3-4: Core Concepts\n"
            "Week 5-6: Advanced Topics\n"
            "Week 7: Midterm Review\n"
            "Week 8: Midterm Exam\n"
            "Week 9-12: Project Work\n"
            "Week 13-14: Final Project Presentations\n"
            "Week 15: Final Review and Exam"
        )
    }

# Define syllabi to create
syllabi_data = [
    # Computer Science Department
    {"subject_code": "CS101", "instructor_email": "dr.smith@cs.edu"},
    {"subject_code": "CS102", "instructor_email": "prof.johnson@cs.edu"},
    {"subject_code": "CS103", "instructor_email": "dr.williams@cs.edu"},
    {"subject_code": "CS104", "instructor_email": "dr.smith@cs.edu"},
    
    # Information Technology Department
    {"subject_code": "IT101", "instructor_email": "prof.davis@it.edu"},
    {"subject_code": "IT102", "instructor_email": "dr.miller@it.edu"},
    
    # Software Engineering Department
    {"subject_code": "SE101", "instructor_email": "prof.wilson@se.edu"},
    {"subject_code": "SE102", "instructor_email": "dr.brown@se.edu"},
    
    # AI Department
    {"subject_code": "AI101", "instructor_email": "dr.thomas@ai.edu"},
    {"subject_code": "AI102", "instructor_email": "prof.anderson@ai.edu"},
]

try:
    print("Adding syllabi to database...\n")
    
    added_count = 0
    
    for syllabus_info in syllabi_data:
        # Get subject
        subject = db.query(Subject).filter(
            Subject.code == syllabus_info["subject_code"]
        ).first()
        
        if not subject:
            print(f"  ✗ Subject not found: {syllabus_info['subject_code']}")
            continue
        
        # Get teacher
        teacher = db.query(User).filter(
            User.email == syllabus_info["instructor_email"]
        ).first()
        
        if not teacher:
            print(f"  ✗ Teacher not found: {syllabus_info['instructor_email']}")
            continue
        
        # Check if syllabus already exists
        existing = db.query(Syllabus).filter(
            Syllabus.subject_id == subject.id,
            Syllabus.teacher_id == teacher.id
        ).first()
        
        if not existing:
            # Create template data
            template_data = create_syllabus_data(
                subject.code,
                subject.name,
                teacher.email,
                subject.department.name if subject.department else "Unknown"
            )
            
            # Create syllabus
            syllabus = Syllabus(
                subject_id=subject.id,
                teacher_id=teacher.id,
                template_data=template_data,
                status="draft",
                version=1
            )
            db.add(syllabus)
            print(f"  ✓ Added: {subject.code} - {subject.name} (by {teacher.email})")
            added_count += 1
        else:
            print(f"  ⊘ Already exists: {subject.code} by {teacher.email}")
    
    db.commit()
    print(f"\n✓ Syllabi added successfully!")
    print(f"  Total added: {added_count}")
    
except Exception as e:
    db.rollback()
    print(f"✗ Error adding syllabi: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
