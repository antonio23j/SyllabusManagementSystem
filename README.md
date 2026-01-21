# Syllabus Management System

A comprehensive web application for managing academic syllabi, built with FastAPI backend and React frontend. The system supports multiple user roles (admin, teacher, department head) with role-based access control.

## Features

- **User Authentication**: JWT-based authentication with role-based permissions
- **Multi-role Support**: Admin, Teacher, and Department Head roles
- **Syllabus Management**: Create, edit, and approve syllabus templates
- **Department Organization**: Hierarchical department and subject management
- **PDF Generation**: Generate syllabus PDFs with customizable templates
- **Dark/Light Mode**: Modern UI with theme switching
- **Responsive Design**: Mobile-friendly Material-UI interface

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- SQLite (development database)
- Pydantic (data validation)
- Alembic (database migrations)
- JWT (authentication)

**Frontend:**
- React 19
- Material-UI (MUI)
- React Router
- Axios (HTTP client)
- React Hook Form

## Prerequisites

- Python 3.10+
- Node.js 16+
- npm or yarn

## Quick Start

### 1. Backend Setup

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create database and admin user
python create_admin.py
```

### 2. Frontend Setup

```bash
# Install Node.js dependencies
cd frontend
npm install
cd ..
```

### 4. Run the Application

```bash
# Terminal 1: Start backend server
python run.py

# Terminal 2: Start frontend development server
cd frontend && npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Admin Login**: Use credentials from step 2 output

## Development Setup

### Database Setup

The application uses SQLite by default. To use a different database:

1. Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost/syllabus_db"
   ```

2. Update `requirements.txt` with appropriate database driver (e.g., `psycopg2` for PostgreSQL)

3. Run database migrations:
   ```bash
   alembic upgrade head
   ```

### Initial Data Setup

After setting up the database, create initial admin user:

```bash
python create_admin.py
```

This creates:
- Database tables
- Default "Administration" department
- Admin user with email: `admin@example.com` and password: `admin123`

### Adding Additional Admin Users

To add more admin users:

```bash
python add_admin.py
```

Follow the prompts to create additional admin accounts.


## Project Structure

```
syllabus-management/
├── app/                          # FastAPI backend
│   ├── main.py                   # FastAPI app instance
│   ├── config.py                 # Application settings
│   ├── database.py               # Database configuration
│   ├── models/                   # SQLAlchemy models
│   ├── routes/                   # API endpoints
│   └── utils/                    # Utility functions
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   └── theme.js              # MUI theme
│   └── package.json
├── alembic/                      # Database migrations
├── tests/                        # Backend tests
├── requirements.txt              # Python dependencies
├── run.py                        # Development server script
├── create_admin.py               # Admin user creation
└── AGENTS.md                     # Development guidelines
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login

### Users
- `GET /users` - List users (admin only)
- `POST /users` - Create user (admin only)
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Departments
- `GET /departments` - List departments
- `POST /departments` - Create department (admin only)
- `GET /departments/{id}` - Get department details
- `PUT /departments/{id}` - Update department
- `DELETE /departments/{id}` - Delete department

### Subjects
- `GET /subjects` - List subjects
- `POST /subjects` - Create subject
- `GET /subjects/{id}` - Get subject details
- `PUT /subjects/{id}` - Update subject
- `DELETE /subjects/{id}` - Delete subject

### Syllabus
- `GET /syllabi` - List syllabi
- `POST /syllabi` - Create syllabus
- `GET /syllabi/{id}` - Get syllabus details
- `PUT /syllabi/{id}` - Update syllabus
- `DELETE /syllabi/{id}` - Delete syllabus

## User Roles & Permissions

### Admin
- Full access to all features
- Manage users, departments, and subjects
- Approve/reject syllabi
- Access all dashboards

### Department Head
- Manage department subjects and assignments
- Approve syllabi from department teachers
- View department reports

### Teacher
- Create and manage syllabi
- Submit syllabi for approval
- View assigned subjects

## Development Workflow

1. **Setup**: Follow Quick Start steps
2. **Development**: Make changes, run tests, format code
3. **Testing**: Write tests for new features, run full test suite
4. **Code Review**: Create PR, address feedback
5. **Deployment**: Build frontend, deploy backend, run migrations

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=sqlite:///./syllabus.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```