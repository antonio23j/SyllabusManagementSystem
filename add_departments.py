#!/usr/bin/env python3
"""
Script to add departments for a Computer Science school.
Usage: python add_departments.py
"""

from sqlalchemy.orm import sessionmaker
from app.database import engine, Base
from app.models.models import Department

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Define departments for Computer Science school
departments_data = [
    {"name": "Computer Science"},
    {"name": "Information Technology"},
    {"name": "Software Engineering"},
    {"name": "Artificial Intelligence"},
    {"name": "Cybersecurity"},
    {"name": "Data Science"},
]

try:
    print("Adding departments to database...")
    
    for dept_data in departments_data:
        # Check if department already exists
        existing = db.query(Department).filter(Department.name == dept_data["name"]).first()
        
        if not existing:
            dept = Department(name=dept_data["name"])
            db.add(dept)
            print(f"  ✓ Added: {dept_data['name']}")
        else:
            print(f"  ⊘ Already exists: {dept_data['name']}")
    
    db.commit()
    print("\n✓ All departments added successfully!")
    
except Exception as e:
    db.rollback()
    print(f"✗ Error adding departments: {e}")
finally:
    db.close()
