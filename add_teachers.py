#!/usr/bin/env python3
"""
Script to add teachers for Computer Science departments.
Usage: python add_teachers.py
"""

from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models.models import User, Department
from app.utils.auth import get_password_hash

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Define teachers for CS departments
teachers_data = [
    # Computer Science Department
    {"email": "dr.smith@cs.edu", "name": "Dr. John Smith", "department": "Computer Science", "role": "teacher"},
    {"email": "prof.johnson@cs.edu", "name": "Prof. Sarah Johnson", "department": "Computer Science", "role": "teacher"},
    {"email": "dr.williams@cs.edu", "name": "Dr. Michael Williams", "department": "Computer Science", "role": "teacher"},
    
    # Information Technology Department
    {"email": "prof.davis@it.edu", "name": "Prof. Emily Davis", "department": "Information Technology", "role": "teacher"},
    {"email": "dr.miller@it.edu", "name": "Dr. Robert Miller", "department": "Information Technology", "role": "teacher"},
    
    # Software Engineering Department
    {"email": "prof.wilson@se.edu", "name": "Prof. Jennifer Wilson", "department": "Software Engineering", "role": "teacher"},
    {"email": "dr.brown@se.edu", "name": "Dr. David Brown", "department": "Software Engineering", "role": "teacher"},
    
    # Artificial Intelligence Department
    {"email": "dr.thomas@ai.edu", "name": "Dr. Lisa Thomas", "department": "Artificial Intelligence", "role": "teacher"},
    {"email": "prof.anderson@ai.edu", "name": "Prof. James Anderson", "department": "Artificial Intelligence", "role": "teacher"},
    
    # Cybersecurity Department
    {"email": "prof.taylor@cyber.edu", "name": "Prof. Patricia Taylor", "department": "Cybersecurity", "role": "teacher"},
    
    # Data Science Department
    {"email": "dr.martin@ds.edu", "name": "Dr. Christopher Martin", "department": "Data Science", "role": "teacher"},
    {"email": "prof.garcia@ds.edu", "name": "Prof. Amanda Garcia", "department": "Data Science", "role": "teacher"},
]

try:
    print("Adding teachers to database...\n")
    
    for teacher_data in teachers_data:
        # Get the department
        dept = db.query(Department).filter(
            Department.name == teacher_data["department"]
        ).first()
        
        if not dept:
            print(f"  ✗ Department not found: {teacher_data['department']}")
            continue
        
        # Check if teacher already exists
        existing = db.query(User).filter(User.email == teacher_data["email"]).first()
        
        if not existing:
            # Create teacher with default password
            hashed_password = get_password_hash("password123")
            teacher = User(
                email=teacher_data["email"],
                password_hash=hashed_password,
                role=teacher_data["role"],
                department_id=dept.id
            )
            db.add(teacher)
            print(f"  ✓ Added: {teacher_data['name']} ({teacher_data['email']})")
        else:
            print(f"  ⊘ Already exists: {teacher_data['email']}")
    
    db.commit()
    print("\n✓ All teachers added successfully!")
    print("\nDefault password for all teachers: password123")
    
except Exception as e:
    db.rollback()
    print(f"✗ Error adding teachers: {e}")
finally:
    db.close()
