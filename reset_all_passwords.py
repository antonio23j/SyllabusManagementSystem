#!/usr/bin/env python3
"""Reset all user passwords to valid argon2 hashes"""
import sys
from sqlalchemy.orm import sessionmaker
from app.database import engine
from app.models.models import User
from app.utils.auth import get_password_hash

# Create session
Session = sessionmaker(bind=engine)
session = Session()

try:
    # Get all users
    users = session.query(User).all()
    print(f"Found {len(users)} users")
    
    # Set default password for each user based on role
    for user in users:
        if user.role == "admin":
            default_password = "admin123"
        else:
            default_password = "password123"
        
        # Hash with argon2
        new_hash = get_password_hash(default_password)
        user.password_hash = new_hash
        print(f"✓ Updated {user.email} ({user.role}) - password: {default_password}")
    
    # Commit all changes
    session.commit()
    print("\n✓ All user passwords updated successfully!")
    print("\nDefault credentials:")
    print("  Admin: admin@example.com / admin123")
    print("  Teachers: <email> / password123")
    
except Exception as e:
    print(f"✗ Error updating passwords: {e}")
    session.rollback()
    sys.exit(1)
finally:
    session.close()
