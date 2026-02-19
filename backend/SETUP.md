# PHP Backend Setup Guide

## Prerequisites

- PHP 8.2 or higher
- MySQL Server running
- Composer (optional, for package management)
- Git (optional)

---

## Step 1: Verify PHP Installation

### Windows

Open Command Prompt and run:
```bash
php -v
```

Expected output:
```
PHP 8.2.x (cli) (built: ...)
```

If PHP is not installed:
1. Download from https://www.php.net/downloads
2. Or use XAMPP/WAMP bundle (includes PHP, MySQL, Apache)

### macOS/Linux

```bash
php -v
```

If not installed:
```bash
# macOS
brew install php@8.2

# Ubuntu/Debian
sudo apt-get install php8.2 php8.2-mysql php8.2-curl php8.2-json
```

---

## Step 2: Configure Environment

1. Navigate to backend folder:
```bash
cd "c:\Users\DELL\Desktop\All Projects\Transport project\backend"
```

2. Create/Update `.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=transport_management_system
DB_USER=transport_user
DB_PASSWORD=secure_password_123
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000
```

3. Create logs directory:
```bash
mkdir logs
```

---

## Step 3: Verify Database Connection

Test database connectivity:

```bash
php -r "
require 'config/Database.php';
use Config\Database;
\$db = new Database();
\$conn = \$db->connect();
echo 'Database connected successfully!';
"
```

Expected output:
```
Database connected successfully!
```

---

## Step 4: Start PHP Server

### Option 1: Built-in PHP Server (Development)

```bash
cd backend
php -S localhost:8000
```

Output:
```
[Fri Dec 08 15:30:00 2024] PHP 8.2.x Development Server started at http://localhost:8000
```

### Option 2: Apache (Production)

Configure Apache virtual host:
```apache
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot "c:\Users\DELL\Desktop\All Projects\Transport project\backend"
    
    <Directory "c:\Users\DELL\Desktop\All Projects\Transport project\backend">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

## Step 5: Test API Endpoints

### Test 1: Get All Branches

```bash
curl http://localhost:8000/api/branches
```

Expected response:
```json
{
  "success": true,
  "message": "Branches retrieved successfully",
  "data": [...],
  "timestamp": "2024-12-08 15:30:00"
}
```

### Test 2: Create Branch

```bash
curl -X POST http://localhost:8000/api/branches \
  -H "Content-Type: application/json" \
  -d '{
    "branch_code": "TEST",
    "branch_name": "Test Branch",
    "city": "Test City",
    "phone": "03001234567",
    "email": "test@transport.com"
  }'
```

### Test 3: Get Branch by ID

```bash
curl http://localhost:8000/api/branches/1
```

### Test 4: Update Branch

```bash
curl -X PUT http://localhost:8000/api/branches/1 \
  -H "Content-Type: application/json" \
  -d '{
    "branch_name": "Updated Branch Name"
  }'
```

### Test 5: Delete Branch

```bash
curl -X DELETE http://localhost:8000/api/branches/1
```

---

## Step 6: Directory Structure

```
backend/
├── index.php                 # Main entry point
├── .env                      # Environment configuration
├── SETUP.md                  # This file
├── API_DOCUMENTATION.md      # API docs
├── config/
│   └── Database.php         # Database connection
├── models/
│   └── Branch.php           # Branch model
├── controllers/
│   └── BranchController.php # Branch controller
├── routes/
│   └── api.php              # API routes
└── logs/
    └── error.log            # Error logs
```

---

## Step 7: Enable .htaccess (Apache)

Create `backend/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Remove .php extension
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php?url=$1 [QSA,L]
</IfModule>
```

---

## Step 8: Connect Frontend to Backend

### In React Component

```javascript
const API_URL = 'http://localhost:8000/api';

// Get all branches
async function fetchBranches() {
  try {
    const response = await fetch(`${API_URL}/branches`);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Create branch
async function createBranch(branchData) {
  try {
    const response = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(branchData)
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Update branch
async function updateBranch(id, branchData) {
  try {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(branchData)
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Delete branch
async function deleteBranch(id) {
  try {
    const response = await fetch(`${API_URL}/branches/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Verify MySQL is running
2. Check .env credentials
3. Ensure database exists
4. Check user permissions

```bash
# Test MySQL connection
mysql -u transport_user -p transport_management_system
```

### Issue: "Class not found"

**Solution:**
1. Verify file paths in autoloader
2. Check namespace declarations
3. Ensure files exist in correct directories

### Issue: "CORS error"

**Solution:**
CORS headers are already set in index.php. If still having issues:
1. Check browser console for exact error
2. Verify API URL is correct
3. Ensure request method is correct

### Issue: "Permission denied" on logs

**Solution:**
```bash
# Create logs directory with write permissions
mkdir logs
chmod 777 logs
```

---

## Performance Optimization

### 1. Enable Query Caching

In `.env`:
```env
CACHE_ENABLED=true
CACHE_TTL=3600
```

### 2. Add Indexes

Already included in database schema.

### 3. Use Connection Pooling

Already implemented in Database.php

### 4. Enable Gzip Compression

Add to index.php:
```php
if (extension_loaded('zlib')) {
    ob_start('ob_gzhandler');
}
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Set `APP_ENV=production` in production
- [ ] Disable `APP_DEBUG` in production
- [ ] Use HTTPS in production
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Validate all inputs
- [ ] Use prepared statements (already done)
- [ ] Keep PHP updated
- [ ] Regular backups

---

## Deployment

### To Production Server

1. Upload files to server
2. Update .env with production credentials
3. Set `APP_ENV=production`
4. Set `APP_DEBUG=false`
5. Configure web server (Apache/Nginx)
6. Enable HTTPS
7. Set up SSL certificate
8. Configure firewall

---

## Useful Commands

```bash
# Start PHP server
php -S localhost:8000

# Check PHP version
php -v

# Check PHP extensions
php -m

# Run PHP file
php filename.php

# Check syntax
php -l filename.php

# View error logs
tail -f logs/error.log
```

---

## Next Steps

1. ✅ Backend API created
2. ⏭️ Add authentication endpoints
3. ⏭️ Add more models (Driver, Vehicle, etc.)
4. ⏭️ Implement pagination
5. ⏭️ Add request logging
6. ⏭️ Add rate limiting
7. ⏭️ Deploy to production

---

## Support

For issues:
1. Check error logs: `logs/error.log`
2. Review API_DOCUMENTATION.md
3. Verify database connection
4. Check PHP version compatibility
5. Review CORS settings

---

**Setup Complete! 🎉**

Your PHP backend is ready to use. Start making API calls!
