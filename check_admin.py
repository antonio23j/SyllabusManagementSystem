from sqlalchemy.orm import sessionmaker
from app.database import engine, Base
from app.models.models import User

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Query without loading relationships to avoid join issues
    admins = db.query(User.id, User.email, User.role).filter(User.role == "admin").all()
    print(f"Found {len(admins)} admin users:")
    for a in admins:
        print(f"- {a.email} (ID: {a.id})")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()