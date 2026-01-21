#!/usr/bin/env python3
"""
Script to create an initial admin user for the Syllabus Management System.
This script creates the database tables and an admin user if they don't exist.
"""

from sqlalchemy.orm import sessionmaker
from app.database import engine, Base
from app.models.models import User, Department
from app.utils.auth import get_password_hash

# Create all tables
Base.metadata.create_all(bind=engine)

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        # Ensure the admin password hash is using the current hashing scheme
        admin_password = "admin123"
        existing_admin.password_hash = get_password_hash(admin_password)
        db.commit()
        db.refresh(existing_admin)

        print(f"Admin user already exists: {existing_admin.email}")
        print("Password has been reset to the default:")
        print(f"Email: {existing_admin.email}")
        print("Password: admin123")
    else:
        # Check if department exists, if not create one
        dept = db.query(Department).first()
        if not dept:
            dept = Department(name="Administration")
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print(f"Created department: {dept.name}")

        # Create admin user
        admin_email = "admin@example.com"
        admin_password = "admin123"
        hashed_password = get_password_hash(admin_password)

        admin_user = User(
            email=admin_email,
            password_hash=hashed_password,
            role="admin",
            department_id=dept.id
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("Admin user created successfully!")
        print("Login credentials:")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()