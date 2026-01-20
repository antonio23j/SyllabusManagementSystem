#!/usr/bin/env python3
"""
Script to add subjects for Computer Science departments.
Usage: python add_subjects.py
"""

from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models.models import Subject, Department

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Define subjects for CS departments
subjects_data = [
    # Computer Science
    {"name": "Introduction to Programming", "code": "CS101", "department": "Computer Science"},
    {"name": "Data Structures", "code": "CS102", "department": "Computer Science"},
    {"name": "Algorithms", "code": "CS103", "department": "Computer Science"},
    {"name": "Database Systems", "code": "CS104", "department": "Computer Science"},
    {"name": "Computer Networks", "code": "CS105", "department": "Computer Science"},
    {"name": "Operating Systems", "code": "CS106", "department": "Computer Science"},
    {"name": "Web Development", "code": "CS107", "department": "Computer Science"},
    {"name": "Object-Oriented Programming", "code": "CS108", "department": "Computer Science"},
    
    # Information Technology
    {"name": "IT Fundamentals", "code": "IT101", "department": "Information Technology"},
    {"name": "Network Administration", "code": "IT102", "department": "Information Technology"},
    {"name": "System Administration", "code": "IT103", "department": "Information Technology"},
    {"name": "Database Management", "code": "IT104", "department": "Information Technology"},
    {"name": "IT Infrastructure", "code": "IT105", "department": "Information Technology"},
    
    # Software Engineering
    {"name": "Software Requirements", "code": "SE101", "department": "Software Engineering"},
    {"name": "Software Design", "code": "SE102", "department": "Software Engineering"},
    {"name": "Software Testing", "code": "SE103", "department": "Software Engineering"},
    {"name": "Project Management", "code": "SE104", "department": "Software Engineering"},
    {"name": "Agile Development", "code": "SE105", "department": "Software Engineering"},
    
    # Artificial Intelligence
    {"name": "AI Fundamentals", "code": "AI101", "department": "Artificial Intelligence"},
    {"name": "Machine Learning", "code": "AI102", "department": "Artificial Intelligence"},
    {"name": "Deep Learning", "code": "AI103", "department": "Artificial Intelligence"},
    {"name": "Natural Language Processing", "code": "AI104", "department": "Artificial Intelligence"},
    {"name": "Computer Vision", "code": "AI105", "department": "Artificial Intelligence"},
    
    # Cybersecurity
    {"name": "Cybersecurity Fundamentals", "code": "CYBER101", "department": "Cybersecurity"},
    {"name": "Network Security", "code": "CYBER102", "department": "Cybersecurity"},
    {"name": "Cryptography", "code": "CYBER103", "department": "Cybersecurity"},
    {"name": "Ethical Hacking", "code": "CYBER104", "department": "Cybersecurity"},
    {"name": "Security Audit", "code": "CYBER105", "department": "Cybersecurity"},
    
    # Data Science
    {"name": "Data Science Basics", "code": "DS101", "department": "Data Science"},
    {"name": "Statistical Analysis", "code": "DS102", "department": "Data Science"},
    {"name": "Data Visualization", "code": "DS103", "department": "Data Science"},
    {"name": "Big Data Processing", "code": "DS104", "department": "Data Science"},
    {"name": "Predictive Analytics", "code": "DS105", "department": "Data Science"},
]

try:
    print("Adding subjects to database...\n")
    
    added_count = 0
    existing_count = 0
    
    for subject_data in subjects_data:
        # Get the department
        dept = db.query(Department).filter(
            Department.name == subject_data["department"]
        ).first()
        
        if not dept:
            print(f"  ✗ Department not found: {subject_data['department']}")
            continue
        
        # Check if subject already exists
        existing = db.query(Subject).filter(Subject.code == subject_data["code"]).first()
        
        if not existing:
            subject = Subject(
                name=subject_data["name"],
                code=subject_data["code"],
                department_id=dept.id
            )
            db.add(subject)
            print(f"  ✓ Added: {subject_data['code']} - {subject_data['name']}")
            added_count += 1
        else:
            print(f"  ⊘ Already exists: {subject_data['code']}")
            existing_count += 1
    
    db.commit()
    print(f"\n✓ Subjects added successfully!")
    print(f"  Added: {added_count}, Already existed: {existing_count}")
    
except Exception as e:
    db.rollback()
    print(f"✗ Error adding subjects: {e}")
finally:
    db.close()
