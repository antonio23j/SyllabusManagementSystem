from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, users, departments, subjects, syllabi

app = FastAPI(title="Syllabus Management API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(departments.router, prefix="/departments", tags=["Departments"])
app.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
app.include_router(syllabi.router, prefix="/syllabi", tags=["Syllabus"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Syllabus Management API"}