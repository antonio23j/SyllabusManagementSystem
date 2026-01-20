# Azure SQL Database Setup Guide

## Prerequisites Checklist

Before connecting to Azure SQL, ensure you have:

- [ ] Azure SQL Database created
- [ ] Database name: `SyllabusBroski`
- [ ] Admin username: `sqladmin`
- [ ] Admin password saved
- [ ] SQL Server firewall rules configured for your IP

## Step-by-Step Setup

### 1. **Install ODBC Driver 17 for SQL Server**
   
   **Windows:**
   - Download: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   - Run the installer and complete the installation
   - Restart your terminal/IDE after installation

   **Mac:**
   ```bash
   brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
   brew install msodbcsql17
   ```

   **Linux (Ubuntu):**
   ```bash
   sudo su
   curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
   curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | tee /etc/apt/sources.list.d/msprod.list
   apt-get update
   apt-get install msodbcsql17
   ```

### 2. **Verify .env File**

   Ensure your `.env` file contains (exactly as shown):
   ```
   DATABASE_URL=mssql+pyodbc://sqladmin:Xc2002lexeki!@azure-database-babygecko.database.windows.net:1433/SyllabusBroski?driver=ODBC+Driver+17+for+SQL+Server
   SECRET_KEY=syllabus-app-secret-2026
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

### 3. **Configure Azure SQL Firewall**

   Allow your local machine to connect to Azure SQL:
   
   1. Go to Azure Portal → Your SQL Server
   2. Click "Firewalls and virtual networks"
   3. Click "+ Add your client IP"
   4. Or manually add your IP address

   **Find your IP:**
   ```bash
   # Windows PowerShell
   ipconfig
   
   # Mac/Linux
   curl ifconfig.me
   ```

### 4. **Install/Verify Python Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

   Key packages for Azure SQL:
   - `pyodbc` - ODBC database driver
   - `sqlalchemy` - ORM
   - `python-dotenv` - Load .env files

### 5. **Verify Database Connection**

   Run the verification script:
   ```bash
   python verify_connection.py
   ```

   This checks:
   - ODBC Driver 17 installation
   - DATABASE_URL configuration
   - Actual connection to Azure SQL

### 6. **Initialize Database Schema**

   After verification passes, create tables:
   ```bash
   python init_db.py
   ```

### 7. **Run Alembic Migrations (Optional)**

   If using database migrations:
   ```bash
   alembic upgrade head
   ```

## Troubleshooting

### Connection Refused / Timeout
- **Issue**: Cannot reach Azure SQL server
- **Solutions**:
  1. Check firewall rules: Add your IP to Azure SQL firewall
  2. Verify server name: Should be `azure-database-babygecko.database.windows.net`
  3. Check internet connectivity

### ODBC Driver Not Found
- **Error**: `pyodbc.Error: ('01000', "[01000] [unixODBC][Driver Manager]...`
- **Solution**: Install ODBC Driver 17 (see Step 1)
- **Verify installation**:
  ```python
  import pyodbc
  print(pyodbc.drivers())  # Should include "ODBC Driver 17 for SQL Server"
  ```

### Authentication Failed
- **Error**: `Login failed for user 'sqladmin'`
- **Solutions**:
  1. Check password in .env (special chars need proper escaping)
  2. Verify username exists in Azure SQL
  3. Check if account is locked/disabled

### Database Not Found
- **Error**: `Cannot open database "SyllabusBroski"`
- **Solution**: Create the database in Azure SQL first

### Password with Special Characters
If your password contains special characters like `!@#$%`, they may need URL encoding:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

Example:
```
Xc2002lexeki! → Xc2002lexeki%21
```

## Running the Application

### Backend
```bash
python run.py
# or
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm start
```

## Verify Everything Works

1. **Backend running**: Visit http://localhost:8000/docs
2. **Frontend running**: Visit http://localhost:3000
3. **Database**: Tables should be visible in Azure Portal → Query Editor

## Quick Command Reference

```bash
# Verify connection
python verify_connection.py

# Initialize database
python init_db.py

# Run backend
python run.py

# Run migrations
alembic upgrade head
alembic revision --autogenerate -m "message"

# Check ODBC drivers
python -c "import pyodbc; print(pyodbc.drivers())"
```

## Additional Resources

- [Azure SQL Documentation](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [SQLAlchemy + MSSQL](https://docs.sqlalchemy.org/en/20/dialects/mssql.html)
- [pyodbc Documentation](https://github.com/mkleehammer/pyodbc/wiki)
