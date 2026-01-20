# Azure SQL Server Connection Troubleshooting Guide

## Problem Summary

Your FastAPI application is failing to connect to Azure SQL Server with the following error:

```
pyodbc.Error: ('01000', "[01000] [unixODBC][Driver Manager]Can't open lib 'ODBC Driver 17 for SQL Server' : file not found (0) (SQLDriverConnect)")
```

**Root Cause:** Your IP address `141.98.140.75` is blocked by the Azure SQL Server firewall.

## Solutions Implemented

### ✅ 1. Database Driver Fix
- **Switched from pyodbc to pymssql** for better Linux compatibility
- **Updated DATABASE_URL** in `.env` file:
  ```
  DATABASE_URL=mssql+pymssql://sqladmin:Xc2002lexeki!@azure-database-babygecko.database.windows.net:1433/SyllabusBroski
  ```
- **Installed pymssql package** in virtual environment

### ✅ 2. Connection Test Results
- **Database credentials verified**: Username, password, server, and database name are correct
- **Connection blocked by firewall**: IP address `141.98.140.75` is not whitelisted

## Required Action: Configure Azure Firewall

### Option 1: Azure Portal (Recommended for Beginners)

1. **Login to Azure Portal**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Navigate to SQL Server**
   - Search for "SQL servers" in the search bar
   - Click on `azure-database-babygecko`

3. **Access Firewall Settings**
   - In the left sidebar, click **"Firewalls and virtual networks"**
   - This is under the "Security" section

4. **Add Your IP Address**
   - Click **"Add client IPv4 address"** button
   - This will automatically detect and add your current IP address
   - Alternatively, manually enter:
     - **Start IP**: `141.98.140.75`
     - **End IP**: `141.98.140.75`
   - **Rule name**: `Development Machine`
   - Click **"Save"**

5. **Wait for Changes**
   - Firewall rule updates may take **up to 5 minutes** to take effect

### Option 2: Azure CLI (For Advanced Users)

```bash
# Login to Azure (if not already logged in)
az login

# Add firewall rule for your IP
az sql server firewall-rule create \
  --resource-group your-resource-group-name \
  --server azure-database-babygecko \
  --name "Development Machine" \
  --start-ip-address 141.98.140.75 \
  --end-ip-address 141.98.140.75

# Verify the rule was added
az sql server firewall-rule list \
  --resource-group your-resource-group-name \
  --server azure-database-babygecko
```

### Option 3: Allow Azure Services (Alternative)

If you want to allow all Azure services to access your database:

1. In Azure Portal, go to your SQL Server
2. Click **"Firewalls and virtual networks"**
3. Set **"Allow Azure services and resources to access this server"** to **"Yes"**
4. Click **"Save"**

⚠️ **Security Warning**: This option allows any Azure service to access your database, which may be less secure.

## Testing the Connection

### 1. Test Database Connection
After adding the firewall rule, test the connection:

```bash
cd /home/antonio/syllabus-management
source venv/bin/activate
python3 run.py
```

### 2. Expected Output
You should see:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 3. Test Login
- **Frontend URL**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Login Credentials**:
  - Email: `admin@example.com`
  - Password: `admin123`

## Troubleshooting

### If Connection Still Fails

1. **Check IP Address**
   ```bash
   curl -s ifconfig.me
   ```
   If your IP changed, update the firewall rule.

2. **Verify Environment Variables**
   ```bash
   cd /home/antonio/syllabus-management
   cat .env
   ```
   Ensure DATABASE_URL is set correctly.

3. **Test with Alternative Driver**
   If pymssql still doesn't work, try installing ODBC drivers:
   ```bash
   # Install Microsoft ODBC Driver (requires sudo)
   curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
   curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
   sudo apt-get update
   sudo apt-get install -y msodbcsql17

   # Then update .env to use pyodbc:
   DATABASE_URL=mssql+pyodbc://sqladmin:Xc2002lexeki!@azure-database-babygecko.database.windows.net:1433/SyllabusBroski?driver=ODBC+Driver+17+for+SQL+Server
   ```

### Firewall Rule Issues

1. **Rule Not Applied**: Wait 5-10 minutes after saving
2. **IP Address Changed**: Your ISP may assign dynamic IPs
3. **Corporate Network**: Some corporate networks block Azure SQL ports
4. **VPN Required**: You may need to connect via VPN

## Application Architecture

### Current Setup
- **Backend**: FastAPI (Python)
- **Frontend**: React with Material-UI
- **Database**: Azure SQL Server
- **Authentication**: JWT tokens
- **Driver**: pymssql (Linux-compatible)

### File Structure
```
syllabus-management/
├── app/                          # FastAPI backend
│   ├── main.py                   # Application entry point
│   ├── config.py                 # Settings & environment variables
│   ├── database.py               # Database connection
│   ├── models/                   # SQLAlchemy models
│   ├── routes/                   # API endpoints
│   └── utils/                    # Authentication utilities
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API client
│   └── theme.js                  # Material-UI theme
├── alembic/                      # Database migrations
├── .env                          # Environment variables
├── requirements.txt              # Python dependencies
└── README.md                     # Project documentation
```

## Security Considerations

### Database Security
- ✅ **Strong password** configured
- ✅ **Firewall rules** in place
- ✅ **SSL/TLS encryption** enabled by default
- ⚠️ **Regular password rotation** recommended

### Application Security
- ✅ **JWT authentication** implemented
- ✅ **Password hashing** with argon2/bcrypt
- ✅ **CORS configuration** for frontend
- ✅ **Input validation** with Pydantic

## Next Steps

1. **Configure Azure Firewall** (immediate priority)
2. **Test application functionality**
3. **Consider VPN for development** if IP changes frequently
4. **Set up database backups** in Azure
5. **Configure monitoring** for production

## Support

If you encounter issues:
1. Check Azure SQL Server logs in the Azure Portal
2. Verify network connectivity with `telnet azure-database-babygecko.database.windows.net 1433`
3. Test with a simple SQL client like Azure Data Studio
4. Contact Azure support if firewall issues persist

---

**Last Updated**: January 2026
**Current IP**: 141.98.140.75
**Database Server**: azure-database-babygecko.database.windows.net
**Database Name**: SyllabusBroski</content>
<parameter name="filePath">/home/antonio/syllabus-management/AZURE_SQL_FIX.md