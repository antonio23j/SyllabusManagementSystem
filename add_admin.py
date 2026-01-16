from sqlalchemy.orm import sessionmaker
from app.database import engine, Base
from app.models.models import User, Department
from app.utils.auth import get_password_hash

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check if there's at least one department
    department = db.query(Department).first()
    if not department:
        # Create a default department if none exists
        department = Department(name="Default Department")
        db.add(department)
        db.commit()
        db.refresh(department)
        print("Created default department")

    # Create admin user
    admin_email = "admin@example.com"
    admin_password = "admin123"  # Change this to a secure password
    hashed_password = get_password_hash(admin_password)

    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        print(f"Admin user {admin_email} already exists")
    else:
        admin_user = User(
            email=admin_email,
            password_hash=hashed_password,
            role="admin",
            department_id=department.id
        )
        db.add(admin_user)
        db.commit()
        print(f"Admin user {admin_email} created successfully with password: {admin_password}")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()