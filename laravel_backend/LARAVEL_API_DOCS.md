# Laravel Backend - API Documentation

## Overview

Complete REST API for Transport Management System built with Laravel 11.

**Base URL:** `http://localhost:8000/api/v1`

**Framework:** Laravel 11.0+
**PHP Version:** 8.2+
**Database:** MySQL

---

## API Endpoints

### 1. Get All Branches

**Endpoint:** `GET /api/v1/branches`

**Description:** Retrieve all branches from the database

**Request:**
```bash
curl http://localhost:8000/api/v1/branches
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Branches retrieved successfully",
  "data": [
    {
      "id": 1,
      "branch_code": "SINDH",
      "branch_name": "Sindh Branch",
      "address": "123 Main Street",
      "city": "Karachi",
      "state": "Sindh",
      "pincode": "75000",
      "phone": "02135678901",
      "email": "sindh@transport.com",
      "is_active": true,
      "created_at": "2024-12-08T10:00:00.000000Z",
      "updated_at": "2024-12-08T10:00:00.000000Z"
    }
  ],
  "timestamp": "2024-12-08 15:30:00"
}
```

---

### 2. Get Branch by ID

**Endpoint:** `GET /api/v1/branches/{id}`

**Description:** Retrieve a specific branch by ID

**Parameters:**
- `id` (integer, required) - Branch ID

**Request:**
```bash
curl http://localhost:8000/api/v1/branches/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Branch retrieved successfully",
  "data": {
    "id": 1,
    "branch_code": "SINDH",
    "branch_name": "Sindh Branch",
    "address": "123 Main Street",
    "city": "Karachi",
    "state": "Sindh",
    "pincode": "75000",
    "phone": "02135678901",
    "email": "sindh@transport.com",
    "is_active": true,
    "created_at": "2024-12-08T10:00:00.000000Z",
    "updated_at": "2024-12-08T10:00:00.000000Z"
  },
  "timestamp": "2024-12-08 15:30:00"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Branch not found",
  "data": null,
  "timestamp": "2024-12-08 15:30:00"
}
```

---

### 3. Create New Branch

**Endpoint:** `POST /api/v1/branches`

**Description:** Create a new branch

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "branch_code": "KPK",
  "branch_name": "KPK Branch",
  "address": "789 Peshawar Road",
  "city": "Peshawar",
  "state": "KPK",
  "pincode": "25000",
  "phone": "09135678901",
  "email": "kpk@transport.com",
  "is_active": true
}
```

**Request (cURL):**
```bash
curl -X POST http://localhost:8000/api/v1/branches \
  -H "Content-Type: application/json" \
  -d '{
    "branch_code": "KPK",
    "branch_name": "KPK Branch",
    "address": "789 Peshawar Road",
    "city": "Peshawar",
    "state": "KPK",
    "pincode": "25000",
    "phone": "09135678901",
    "email": "kpk@transport.com",
    "is_active": true
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "branch_code": "KPK",
    "branch_name": "KPK Branch",
    "address": "789 Peshawar Road",
    "city": "Peshawar",
    "state": "KPK",
    "pincode": "25000",
    "phone": "09135678901",
    "email": "kpk@transport.com",
    "is_active": true,
    "updated_at": "2024-12-08T15:30:00.000000Z",
    "created_at": "2024-12-08T15:30:00.000000Z",
    "id": 5
  },
  "timestamp": "2024-12-08 15:30:00"
}
```

**Response (422 Validation Error):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "branch_code": [
      "The branch code field is required."
    ],
    "branch_name": [
      "The branch name field is required."
    ]
  },
  "timestamp": "2024-12-08 15:30:00"
}
```

**Validation Rules:**
- `branch_code` - Required, unique, max 50 characters
- `branch_name` - Required, max 100 characters
- `address` - Optional, max 255 characters
- `city` - Optional, max 50 characters
- `state` - Optional, max 50 characters
- `pincode` - Optional, max 10 characters
- `phone` - Optional, valid phone format
- `email` - Optional, valid email format
- `is_active` - Optional, boolean

---

### 4. Update Branch

**Endpoint:** `PUT /api/v1/branches/{id}`

**Description:** Update an existing branch

**Parameters:**
- `id` (integer, required) - Branch ID

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "branch_name": "KPK Branch Updated",
  "phone": "09135678902",
  "email": "kpk.updated@transport.com"
}
```

**Request (cURL):**
```bash
curl -X PUT http://localhost:8000/api/v1/branches/5 \
  -H "Content-Type: application/json" \
  -d '{
    "branch_name": "KPK Branch Updated",
    "phone": "09135678902",
    "email": "kpk.updated@transport.com"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "id": 5,
    "branch_code": "KPK",
    "branch_name": "KPK Branch Updated",
    "address": "789 Peshawar Road",
    "city": "Peshawar",
    "state": "KPK",
    "pincode": "25000",
    "phone": "09135678902",
    "email": "kpk.updated@transport.com",
    "is_active": true,
    "created_at": "2024-12-08T15:30:00.000000Z",
    "updated_at": "2024-12-08T15:35:00.000000Z"
  },
  "timestamp": "2024-12-08 15:35:00"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Branch not found",
  "data": null,
  "timestamp": "2024-12-08 15:35:00"
}
```

---

### 5. Delete Branch

**Endpoint:** `DELETE /api/v1/branches/{id}`

**Description:** Delete a branch

**Parameters:**
- `id` (integer, required) - Branch ID

**Request (cURL):**
```bash
curl -X DELETE http://localhost:8000/api/v1/branches/5
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Branch deleted successfully",
  "data": null,
  "timestamp": "2024-12-08 15:35:00"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot delete branch with related records",
  "data": null,
  "timestamp": "2024-12-08 15:35:00"
}
```

---

### 6. Search Branches

**Endpoint:** `GET /api/v1/branches/search?q={query}`

**Description:** Search branches by code, name, city, or state

**Parameters:**
- `q` (string, required) - Search query

**Request (cURL):**
```bash
curl "http://localhost:8000/api/v1/branches/search?q=Karachi"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    {
      "id": 1,
      "branch_code": "SINDH",
      "branch_name": "Sindh Branch",
      "address": "123 Main Street",
      "city": "Karachi",
      "state": "Sindh",
      "pincode": "75000",
      "phone": "02135678901",
      "email": "sindh@transport.com",
      "is_active": true,
      "created_at": "2024-12-08T10:00:00.000000Z",
      "updated_at": "2024-12-08T10:00:00.000000Z"
    }
  ],
  "timestamp": "2024-12-08 15:35:00"
}
```

---

### 7. Get Active Branches

**Endpoint:** `GET /api/v1/branches/active`

**Description:** Retrieve only active branches

**Request (cURL):**
```bash
curl http://localhost:8000/api/v1/branches/active
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Active branches retrieved successfully",
  "data": [
    {
      "id": 1,
      "branch_code": "SINDH",
      "branch_name": "Sindh Branch",
      "address": "123 Main Street",
      "city": "Karachi",
      "state": "Sindh",
      "pincode": "75000",
      "phone": "02135678901",
      "email": "sindh@transport.com",
      "is_active": true,
      "created_at": "2024-12-08T10:00:00.000000Z",
      "updated_at": "2024-12-08T10:00:00.000000Z"
    }
  ],
  "timestamp": "2024-12-08 15:35:00"
}
```

---

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or business logic error |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

---

## Error Handling

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message"]
  },
  "timestamp": "2024-12-08 15:30:00"
}
```

### Business Logic Errors

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": "2024-12-08 15:30:00"
}
```

---

## Request/Response Examples

### JavaScript/Fetch

```javascript
const API_URL = 'http://localhost:8000/api/v1';

// Get all branches
fetch(`${API_URL}/branches`)
  .then(response => response.json())
  .then(data => console.log(data));

// Create branch
fetch(`${API_URL}/branches`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    branch_code: 'BALO',
    branch_name: 'Balochistan Branch',
    city: 'Quetta',
    state: 'Balochistan',
    phone: '08135678901',
    email: 'balochistan@transport.com'
  })
})
.then(response => response.json())
.then(data => console.log(data));

// Update branch
fetch(`${API_URL}/branches/5`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    branch_name: 'Updated Branch Name'
  })
})
.then(response => response.json())
.then(data => console.log(data));

// Delete branch
fetch(`${API_URL}/branches/5`, {
  method: 'DELETE'
})
.then(response => response.json())
.then(data => console.log(data));
```

### Axios

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

// Get all branches
axios.get(`${API_URL}/branches`)
  .then(response => console.log(response.data));

// Create branch
axios.post(`${API_URL}/branches`, {
  branch_code: 'BALO',
  branch_name: 'Balochistan Branch',
  city: 'Quetta'
})
.then(response => console.log(response.data));

// Update branch
axios.put(`${API_URL}/branches/5`, {
  branch_name: 'Updated Name'
})
.then(response => console.log(response.data));

// Delete branch
axios.delete(`${API_URL}/branches/5`)
  .then(response => console.log(response.data));
```

---

## Rate Limiting

Currently no rate limiting is implemented. To add rate limiting:

```php
// In routes/api.php
Route::middleware('throttle:60,1')->group(function () {
    Route::apiResource('branches', BranchController::class);
});
```

---

## Authentication

Currently API is public. To add authentication with Laravel Sanctum:

```bash
php artisan install:api
```

Then add middleware to routes:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('branches', BranchController::class);
});
```

---

## Pagination

To add pagination to list endpoints:

```php
// In BranchController@index
public function index(): JsonResponse
{
    $branches = Branch::paginate(15);
    return response()->json($branches);
}
```

---

## Sorting

To add sorting capability:

```php
// In BranchController@index
public function index(Request $request): JsonResponse
{
    $sortBy = $request->query('sort_by', 'created_at');
    $sortOrder = $request->query('sort_order', 'desc');
    
    $branches = Branch::orderBy($sortBy, $sortOrder)->get();
    return response()->json($branches);
}
```

---

## Filtering

To add filtering capability:

```php
// In BranchController@index
public function index(Request $request): JsonResponse
{
    $query = Branch::query();
    
    if ($request->has('city')) {
        $query->where('city', $request->query('city'));
    }
    
    if ($request->has('state')) {
        $query->where('state', $request->query('state'));
    }
    
    $branches = $query->get();
    return response()->json($branches);
}
```

---

## CORS Configuration

CORS is enabled by default in Laravel. To customize:

Edit `config/cors.php`:

```php
'paths' => ['api/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['*'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => false,
```

---

## Testing

### Unit Test Example

```php
// tests/Unit/BranchTest.php
namespace Tests\Unit;

use App\Models\Branch;
use Tests\TestCase;

class BranchTest extends TestCase
{
    public function test_can_create_branch()
    {
        $branch = Branch::create([
            'branch_code' => 'TEST',
            'branch_name' => 'Test Branch',
        ]);

        $this->assertDatabaseHas('branches', [
            'branch_code' => 'TEST'
        ]);
    }
}
```

### Run Tests

```bash
php artisan test
```

---

## Performance Tips

1. **Use Eager Loading:**
```php
$branches = Branch::with('users', 'drivers')->get();
```

2. **Add Indexes:**
Already included in migration

3. **Cache Results:**
```php
$branches = Cache::remember('branches', 3600, function () {
    return Branch::all();
});
```

4. **Use Pagination:**
```php
$branches = Branch::paginate(15);
```

---

## Deployment Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Cache config: `php artisan config:cache`
- [ ] Cache routes: `php artisan route:cache`
- [ ] Set proper file permissions
- [ ] Configure HTTPS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test all endpoints

---

## Support

For issues:
1. Check Laravel docs: https://laravel.com/docs
2. Review error logs: `storage/logs/laravel.log`
3. Check database connection
4. Verify .env configuration
5. Run: `php artisan tinker` for debugging

---

**API Documentation Complete! 🎉**
