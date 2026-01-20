# Endpoint Issues & Fixes Report

## Critical Issues Found:

### 1. **Duplicate `get_db()` function**
- **Location**: `auth.py` has it defined twice (line 17 and line 69)
- **Impact**: Causes confusion and duplicate code
- **Fix**: Remove the second definition

### 2. **Incomplete endpoints** 
- **subjects.py**: `assign_subject()` endpoint incomplete (missing `db.refresh()` and return)
- **users.py**: `delete_user()` incomplete (missing final lines)
- **syllabi.py**: Several endpoints incomplete

### 3. **Missing GET endpoints for single items**
- No `GET /users/{id}` endpoint
- No `GET /departments/{id}` endpoint
- No `GET /subjects/{id}` endpoint
- No `GET /syllabi/{id}` endpoint

### 4. **Incorrect role name**
- Line in syllabi.py: `if current_user.role != "head"` 
- Should be: `if current_user.role not in ["head", "admin"]` (admin should have full access)
- Currently "head" role should be "department_head" to match database

### 5. **Pydantic Model Configuration**
- Response models missing `from_attributes = True` config
- This prevents ORM models from being serialized to JSON

### 6. **Database session dependency**
- Multiple copies of `get_db()` defined in different places
- Should be centralized in `database.py`

### 7. **API Integration Issues**
- Auth token issue: `settings.secret_key` should be lowercase in config
- Role checking inconsistent across endpoints
- No validation for role names

## Next Steps:
Run the fix script to correct all issues automatically.
