#!/usr/bin/env python
"""
Reset the database by dropping all tables and recreating them fresh.
Use this after fixing model schema issues.
"""

import sys
from sqlalchemy import text
from app.database import engine, Base
from app.models.models import User, Department, Subject, Assignment, Syllabus, SyllabusVersion

def reset_database():
    """Drop all tables and recreate them."""
    try:
        print("Connecting to database...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✓ Database connection successful!")
        
        print("\nDropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped!")
        
        print("\nCreating fresh database schema...")
        Base.metadata.create_all(bind=engine)
        print("✓ Database schema created successfully!")
        
        print("\n" + "=" * 60)
        print("Database reset complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Run: python create_admin.py")
        print("2. Start backend: python run.py")
        
    except Exception as e:
        print(f"✗ Error resetting database: {e}")
        print("\nTroubleshooting:")
        print("1. Check your DATABASE_URL in .env")
        print("2. Verify Azure SQL firewall allows your IP")
        print("3. Ensure database exists in Azure SQL")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("Database Reset Tool")
    print("=" * 60)
    print("\nWARNING: This will DROP all tables and data!")
    confirm = input("Continue? (yes/no): ").strip().lower()
    
    if confirm == "yes":
        reset_database()
    else:
        print("Cancelled.")
