#!/usr/bin/env python3
"""
Master script to populate Computer Science school database.
Runs all setup scripts in the correct order.
Usage: python populate_database.py
"""

import subprocess
import sys

def run_script(script_name, description):
    """Run a script and report results"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            check=True,
            capture_output=False
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error running {script_name}: {e}")
        return False

def main():
    """Run all population scripts in order"""
    print("\n" + "="*60)
    print("Computer Science School Database Population")
    print("="*60)
    
    scripts = [
        ("add_departments.py", "Adding Departments"),
        ("add_teachers.py", "Adding Teachers"),
        ("add_subjects.py", "Adding Subjects"),
        ("add_syllabi.py", "Adding Syllabi"),
    ]
    
    results = []
    for script, description in scripts:
        success = run_script(script, description)
        results.append((description, success))
    
    # Summary
    print("\n" + "="*60)
    print("Database Population Summary")
    print("="*60)
    
    for description, success in results:
        status = "✓ SUCCESS" if success else "✗ FAILED"
        print(f"{status}: {description}")
    
    all_success = all(success for _, success in results)
    
    if all_success:
        print("\n✓ Database populated successfully!")
        print("\nYou can now:")
        print("  1. Login with admin account: admin@example.com / admin123")
        print("  2. Or login with any teacher account: password123")
        print("  3. Access the API at http://localhost:8000/docs")
    else:
        print("\n✗ Some scripts failed. Check the output above.")
    
    return 0 if all_success else 1

if __name__ == "__main__":
    sys.exit(main())
