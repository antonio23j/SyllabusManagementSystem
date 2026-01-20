#!/usr/bin/env python3
"""Recreate admin user with argon2 password hashing"""
import sys
from sqlalchemy.orm import sessionmaker
from app.database import engine, Base
from app.models.models import User
from app.utils.auth import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

Session = sessionmaker(bind=engine)
session = Session()

try:
    # Delete existing admin user if it exists
    existing_admin = session.query(User).filter(User.email == "admin@example.com").first()
    if existing_admin:
        session.delete(existing_admin)
        session.commit()
        print("Deleted existing admin user")
    
    # Create new admin user with argon2 password hashing
    admin_user = User(
        email="admin@example.com",
        password_hash=get_password_hash("admin123"),
        role="admin"
    )
    session.add(admin_user)
    session.commit()
    print(f"✓ Admin user created successfully")
    print(f"  Email: admin@example.com")
    print(f"  Password: admin123")
    print(f"  Role: admin")
    
except Exception as e:
    print(f"✗ Error creating admin user: {e}")
    sys.exit(1)
finally:
    session.close()
