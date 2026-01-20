#!/usr/bin/env python
"""
Initialize the database schema. Run this after migrations or when setting up a new database.
Usage: python init_db.py
"""

import sys
from sqlalchemy import text
from app.database import engine, Base

def init_db():
    """Create all tables defined in models."""
    try:
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✓ Database connection successful!")
        
        # Create tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully!")
        
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        print("\nTroubleshooting tips:")
        print("1. Verify DATABASE_URL in .env file is correct")
        print("2. Ensure ODBC Driver 17 for SQL Server is installed (for Azure SQL)")
        print("3. Check that your Azure SQL server allows your IP address (Firewall rules)")
        print("4. Verify database name exists in Azure SQL")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
