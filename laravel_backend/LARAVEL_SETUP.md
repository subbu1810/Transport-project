# Laravel Backend Setup Guide

## Prerequisites

- PHP 8.2 or higher
- Composer (https://getcomposer.org/)
- MySQL Server running
- Git (optional)

---

## Step 1: Install Composer

### Windows

1. Download from: https://getcomposer.org/Composer-Setup.exe
2. Run the installer
3. Verify installation:
```bash
composer --version
```

### macOS

```bash
brew install composer
```

### Linux

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

---

## Step 2: Create Laravel Project

Navigate to your project directory:

```bash
cd "c:\Users\DELL\Desktop\All Projects\Transport project"
```

Create Laravel project:

```bash
composer create-project laravel/laravel laravel_backend
```

Or if you have the files already, install dependencies:

```bash
cd laravel_backend
composer install
```

---

## Step 3: Configure Environment

1. Copy environment file:
```bash
cp .env.example .env
```

2. Generate application key:
```bash
php artisan key:generate
```

3. Update `.env` with database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=transport_management_system
DB_USERNAME=transport_user
DB_PASSWORD=secure_password_123

APP_DEBUG=true
APP_ENV=local
```

---

## Step 4: Run Migrations

Create tables:

```bash
php artisan migrate
```

Expected output:
```
Migrating: 2024_12_08_000000_create_branches_table
Migrated:  2024_12_08_000000_create_branches_table
```

---

## Step 5: Seed Sample Data

Insert sample data:

```bash
php artisan db:seed --class=BranchSeeder
```

Or seed all:

```bash
php artisan db:seed
```

---

## Step 6: Start Development Server

```bash
php artisan serve
```

Output:
```
Laravel development server started: http://127.0.0.1:8000
```

The API will be available at: `http://localhost:8000/api/v1`

---

## Step 7: Test API Endpoints

### Get All Branches

```bash
curl http://localhost:8000/api/v1/branches
```

### Create Branch

```bash
curl -X POST http://localhost:8000/api/v1/branches \
  -H "Content-Type: application/json" \
  -d '{
    "branch_code": "TEST",
    "branch_name": "Test Branch",
    "city": "Test City",
    "phone": "03001234567",
    "email": "test@transport.com"
  }'
```

### Get Branch by ID

```bash
curl http://localhost:8000/api/v1/branches/1
```

### Update Branch

```bash
curl -X PUT http://localhost:8000/api/v1/branches/1 \
  -H "Content-Type: application/json" \
  -d '{
    "branch_name": "Updated Name"
  }'
```

### Delete Branch

```bash
curl -X DELETE http://localhost:8000/api/v1/branches/1
```

### Search Branches

```bash
curl "http://localhost:8000/api/v1/branches/search?q=Karachi"
```

### Get Active Branches

```bash
curl http://localhost:8000/api/v1/branches/active
```

---

## Directory Structure

```
laravel_backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           └── BranchController.php
│   └── Models/
│       └── Branch.php
├── database/
│   ├── migrations/
│   │   └── 2024_12_08_000000_create_branches_table.php
│   └── seeders/
│       └── BranchSeeder.php
├── routes/
│   └── api.php
├── .env
├── .env.example
├── composer.json
├── artisan
└── LARAVEL_SETUP.md
```

---

## Useful Artisan Commands

```bash
# Start development server
php artisan serve

# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Seed database
php artisan db:seed

# Create model
php artisan make:model Branch

# Create controller
php artisan make:controller Api/BranchController --api

# Create migration
php artisan make:migration create_branches_table

# Create seeder
php artisan make:seeder BranchSeeder

# List all routes
php artisan route:list

# Clear cache
php artisan cache:clear

# Clear config
php artisan config:clear

# Optimize
php artisan optimize
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/branches` | Get all branches |
| GET | `/branches/{id}` | Get branch by ID |
| GET | `/branches/search?q=query` | Search branches |
| GET | `/branches/active` | Get active branches |
| POST | `/branches` | Create branch |
| PUT | `/branches/{id}` | Update branch |
| DELETE | `/branches/{id}` | Delete branch |

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Branches retrieved successfully",
  "data": [...],
  "timestamp": "2024-12-08 15:30:00"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": "2024-12-08 15:30:00"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "branch_code": ["The branch code field is required."],
    "branch_name": ["The branch name field is required."]
  },
  "timestamp": "2024-12-08 15:30:00"
}
```

---

## Connect Frontend to Backend

### In React Component

```javascript
const API_URL = 'http://localhost:8000/api/v1';

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

### Using Axios

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

// Get all branches
axios.get(`${API_URL}/branches`)
  .then(response => console.log(response.data));

// Create branch
axios.post(`${API_URL}/branches`, {
  branch_code: 'TEST',
  branch_name: 'Test Branch'
})
.then(response => console.log(response.data));

// Update branch
axios.put(`${API_URL}/branches/1`, {
  branch_name: 'Updated Name'
})
.then(response => console.log(response.data));

// Delete branch
axios.delete(`${API_URL}/branches/1`)
  .then(response => console.log(response.data));
```

---

## Troubleshooting

### Issue: "Class not found"

**Solution:**
```bash
composer dump-autoload
```

### Issue: "SQLSTATE[HY000]: General error"

**Solution:**
1. Verify database exists
2. Check .env credentials
3. Run migrations: `php artisan migrate`

### Issue: "Port 8000 already in use"

**Solution:**
```bash
php artisan serve --port=8001
```

### Issue: "Composer memory limit"

**Solution:**
```bash
php -d memory_limit=-1 composer install
```

### Issue: "Permission denied" on storage

**Solution:**
```bash
chmod -R 777 storage bootstrap/cache
```

---

## Performance Optimization

### 1. Cache Configuration

```bash
php artisan config:cache
```

### 2. Cache Routes

```bash
php artisan route:cache
```

### 3. Optimize Autoloader

```bash
composer install --optimize-autoloader --no-dev
```

### 4. Enable Query Caching

In `.env`:
```env
CACHE_DRIVER=redis
```

---

## Security Best Practices

- [ ] Change default database password
- [ ] Set `APP_DEBUG=false` in production
- [ ] Set `APP_ENV=production` in production
- [ ] Use HTTPS in production
- [ ] Keep Laravel updated
- [ ] Validate all inputs
- [ ] Use prepared statements (Laravel does this)
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Regular backups

---

## Deployment

### To Production Server

1. Upload files to server
2. Install dependencies: `composer install --no-dev`
3. Update `.env` with production settings
4. Generate key: `php artisan key:generate`
5. Run migrations: `php artisan migrate --force`
6. Cache configuration: `php artisan config:cache`
7. Cache routes: `php artisan route:cache`
8. Set permissions: `chmod -R 755 storage bootstrap/cache`

---

## Next Steps

1. ✅ Laravel backend created
2. ⏭️ Add authentication (Laravel Sanctum)
3. ⏭️ Create more models (Driver, Vehicle, etc.)
4. ⏭️ Add request validation
5. ⏭️ Implement pagination
6. ⏭️ Add API documentation (Swagger)
7. ⏭️ Deploy to production

---

## Support

For issues:
1. Check Laravel documentation: https://laravel.com/docs
2. Review error logs: `storage/logs/laravel.log`
3. Check database connection
4. Verify PHP version compatibility
5. Review .env configuration

---

**Laravel Setup Complete! 🎉**

Your Laravel backend is ready to use. Start making API calls!
