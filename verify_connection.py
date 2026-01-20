#!/usr/bin/env python
"""
Verify Azure SQL connection and ODBC driver installation.
Usage: python verify_connection.py
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_odbc_driver():
    """Check if ODBC Driver 17 for SQL Server is installed."""
    try:
        import pyodbc
        drivers = pyodbc.drivers()
        odbc_17 = any('ODBC Driver 17 for SQL Server' in driver for driver in drivers)
        
        print("Installed ODBC Drivers:")
        for driver in drivers:
            print(f"  - {driver}")
        
        if odbc_17:
            print("\n✓ ODBC Driver 17 for SQL Server is installed")
            return True
        else:
            print("\n✗ ODBC Driver 17 for SQL Server is NOT installed")
            print("  Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server")
            return False
    except Exception as e:
        print(f"✗ Error checking ODBC drivers: {e}")
        return False

def check_database_url():
    """Verify DATABASE_URL environment variable."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("✗ DATABASE_URL not set in .env file")
        return False
    
    print(f"✓ DATABASE_URL is set")
    # Mask the password
    if "://" in db_url and "@" in db_url:
        scheme, rest = db_url.split("://", 1)
        user_pass, host_db = rest.split("@", 1)
        user = user_pass.split(":")[0]
        masked = f"{scheme}://{user}:***@{host_db}"
        print(f"  {masked}")
    return True

def test_connection():
    """Test actual database connection."""
    try:
        from app.database import engine
        from sqlalchemy import text
        
        print("\nTesting database connection...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✓ Successfully connected to Azure SQL Database!")
            return True
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        print("\nPossible issues:")
        print("  1. Firewall: Azure SQL might be blocking your IP")
        print("     → Go to Azure Portal > SQL Server > Firewalls and virtual networks")
        print("     → Add your IP address to the allowed list")
        print("  2. Credentials: Check username and password in DATABASE_URL")
        print("  3. Database: Verify the database name exists in Azure SQL")
        print("  4. Connection string: Check ODBC driver spelling and format")
        return False

def main():
    print("=" * 60)
    print("Azure SQL Connection Verification")
    print("=" * 60)
    
    checks = [
        ("ODBC Driver", check_odbc_driver),
        ("DATABASE_URL", check_database_url),
        ("Connection", test_connection),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n[Checking {name}]")
        results.append(check_func())
    
    print("\n" + "=" * 60)
    if all(results):
        print("✓ All checks passed! Your database is configured correctly.")
    else:
        print("✗ Some checks failed. See above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
