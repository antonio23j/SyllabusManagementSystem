from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # admin, teacher, head
    department_id = Column(Integer, ForeignKey("departments.id"))

    department = relationship("Department", back_populates="users", foreign_keys=[department_id])

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    head_id = Column(Integer, ForeignKey("users.id"))

    users = relationship("User", back_populates="department", foreign_keys=[User.department_id])
    head = relationship("User", foreign_keys=[head_id])
    subjects = relationship("Subject", back_populates="department")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    code = Column(String, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"))

    department = relationship("Department", back_populates="subjects")
    assignments = relationship("Assignment", back_populates="subject")
    syllabi = relationship("Syllabus", back_populates="subject")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))

    teacher = relationship("User")
    subject = relationship("Subject")

class Syllabus(Base):
    __tablename__ = "syllabi"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    template_data = Column(JSON)
    status = Column(String, default="draft")  # draft, pending, approved
    version = Column(Integer, default=1)
    google_drive_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subject = relationship("Subject", back_populates="syllabi")
    teacher = relationship("User")
    versions = relationship("SyllabusVersion", back_populates="syllabus")

class SyllabusVersion(Base):
    __tablename__ = "syllabus_versions"
    id = Column(Integer, primary_key=True, index=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.id"))
    data = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)

    syllabus = relationship("Syllabus", back_populates="versions")