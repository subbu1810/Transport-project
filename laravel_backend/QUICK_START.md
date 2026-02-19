# Laravel Backend - Quick Start (5 Minutes)

## Prerequisites

- PHP 8.2+
- Composer installed
- MySQL running

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd laravel_backend
composer install
```

---

## Step 2: Configure Environment (1 minute)

```bash
cp .env.example .env
php artisan key:generate
```

Update `.env`:
```env
DB_HOST=127.0.0.1
DB_DATABASE=transport_management_system
DB_USERNAME=transport_user
DB_PASSWORD=secure_password_123
```

---

## Step 3: Run Migrations (1 minute)

```bash
php artisan migrate
php artisan db:seed --class=BranchSeeder
```

---

## Step 4: Start Server (1 minute)

```bash
php artisan serve
```

Output:
```
Laravel development server started: http://127.0.0.1:8000
```

---

## Step 5: Test API

```bash
# Get all branches
curl http://localhost:8000/api/v1/branches

# Create branch
curl -X POST http://localhost:8000/api/v1/branches \
  -H "Content-Type: application/json" \
  -d '{"branch_code":"TEST","branch_name":"Test Branch"}'

# Get branch by ID
curl http://localhost:8000/api/v1/branches/1

# Update branch
curl -X PUT http://localhost:8000/api/v1/branches/1 \
  -H "Content-Type: application/json" \
  -d '{"branch_name":"Updated Name"}'

# Delete branch
curl -X DELETE http://localhost:8000/api/v1/branches/1

# Search branches
curl "http://localhost:8000/api/v1/branches/search?q=Karachi"

# Get active branches
curl http://localhost:8000/api/v1/branches/active
```

---

## API Endpoints

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/v1/branches` | Get all |
| GET | `/api/v1/branches/{id}` | Get by ID |
| GET | `/api/v1/branches/search?q=query` | Search |
| GET | `/api/v1/branches/active` | Get active |
| POST | `/api/v1/branches` | Create |
| PUT | `/api/v1/branches/{id}` | Update |
| DELETE | `/api/v1/branches/{id}` | Delete |

---

## Response Format

```json
{
  "success": true,
  "message": "Branches retrieved successfully",
  "data": [...],
  "timestamp": "2024-12-08 15:30:00"
}
```

---

## Connect to React Frontend

```javascript
const API_URL = 'http://localhost:8000/api/v1';

// Fetch branches
fetch(`${API_URL}/branches`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Useful Commands

```bash
# Start server
php artisan serve

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# List routes
php artisan route:list

# Clear cache
php artisan cache:clear

# Tinker (REPL)
php artisan tinker
```

---

## Troubleshooting

**Database error?**
```bash
# Check .env credentials
# Run: php artisan migrate
```

**Port 8000 in use?**
```bash
php artisan serve --port=8001
```

**Composer error?**
```bash
composer dump-autoload
```

---

**Ready to go! 🚀**

Your Laravel API is running at `http://localhost:8000/api/v1`
