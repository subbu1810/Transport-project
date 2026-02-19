# Branch Master API Documentation

## Overview

Complete REST API for Branch Master operations using PHP 8.2+ with modern practices.

**Base URL:** `http://localhost:8000/api`

---

## Endpoints

### 1. Get All Branches

**Endpoint:** `GET /api/branches`

**Description:** Retrieve all branches from the database

**Request:**
```bash
curl -X GET http://localhost:8000/api/branches
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
      "created_at": "2024-12-01 10:00:00",
      "updated_at": "2024-12-01 10:00:00"
    },
    {
      "id": 2,
      "branch_code": "PUNJ",
      "branch_name": "Punjab Branch",
      "address": "456 Liberty Road",
      "city": "Lahore",
      "state": "Punjab",
      "pincode": "54000",
      "phone": "04235678901",
      "email": "punjab@transport.com",
      "is_active": true,
      "created_at": "2024-12-01 10:00:00",
      "updated_at": "2024-12-01 10:00:00"
    }
  ],
  "timestamp": "2024-12-08 15:30:00"
}
```

---

### 2. Get Branch by ID

**Endpoint:** `GET /api/branches/{id}`

**Description:** Retrieve a specific branch by ID

**Parameters:**
- `id` (integer, required) - Branch ID

**Request:**
```bash
curl -X GET http://localhost:8000/api/branches/1
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
    "created_at": "2024-12-01 10:00:00",
    "updated_at": "2024-12-01 10:00:00"
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

**Endpoint:** `POST /api/branches`

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
curl -X POST http://localhost:8000/api/branches \
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
    "id": 5,
    "branch_code": "KPK",
    "branch_name": "KPK Branch",
    "address": "789 Peshawar Road",
    "city": "Peshawar",
    "state": "KPK",
    "pincode": "25000",
    "phone": "09135678901",
    "email": "kpk@transport.com",
    "is_active": true,
    "created_at": "2024-12-08 15:30:00",
    "updated_at": "2024-12-08 15:30:00"
  },
  "timestamp": "2024-12-08 15:30:00"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Branch code already exists",
  "data": null,
  "timestamp": "2024-12-08 15:30:00"
}
```

**Validation Rules:**
- `branch_code` - Required, unique, string
- `branch_name` - Required, string
- `address` - Optional, string
- `city` - Optional, string
- `state` - Optional, string
- `pincode` - Optional, string (format: 5 digits)
- `phone` - Optional, string (valid phone format)
- `email` - Optional, string (valid email format)
- `is_active` - Optional, boolean (default: true)

---

### 4. Update Branch

**Endpoint:** `PUT /api/branches/{id}`

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
curl -X PUT http://localhost:8000/api/branches/5 \
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
    "created_at": "2024-12-08 15:30:00",
    "updated_at": "2024-12-08 15:35:00"
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

**Endpoint:** `DELETE /api/branches/{id}`

**Description:** Delete a branch

**Parameters:**
- `id` (integer, required) - Branch ID

**Request (cURL):**
```bash
curl -X DELETE http://localhost:8000/api/branches/5
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

**Endpoint:** `GET /api/branches/search?q={query}`

**Description:** Search branches by code, name, city, or state

**Parameters:**
- `q` (string, required) - Search query

**Request (cURL):**
```bash
curl -X GET "http://localhost:8000/api/branches/search?q=Karachi"
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
      "created_at": "2024-12-01 10:00:00",
      "updated_at": "2024-12-01 10:00:00"
    }
  ],
  "timestamp": "2024-12-08 15:35:00"
}
```

---

### 7. Get Active Branches

**Endpoint:** `GET /api/branches/active`

**Description:** Retrieve only active branches

**Request (cURL):**
```bash
curl -X GET http://localhost:8000/api/branches/active
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
      "created_at": "2024-12-01 10:00:00",
      "updated_at": "2024-12-01 10:00:00"
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
| 400 | Bad Request | Invalid input or validation error |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | HTTP method not allowed |
| 500 | Internal Server Error | Server error |

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": "2024-12-08 15:35:00"
}
```

---

## Request/Response Examples

### JavaScript/Fetch

```javascript
// Get all branches
fetch('http://localhost:8000/api/branches')
  .then(response => response.json())
  .then(data => console.log(data));

// Create branch
fetch('http://localhost:8000/api/branches', {
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
fetch('http://localhost:8000/api/branches/5', {
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
fetch('http://localhost:8000/api/branches/5', {
  method: 'DELETE'
})
.then(response => response.json())
.then(data => console.log(data));
```

### Axios

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

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

## Setup Instructions

### 1. Install PHP 8.2+
```bash
# Windows: Download from https://www.php.net/downloads
# Or use XAMPP/WAMP with PHP 8.2+
```

### 2. Configure .env
```bash
# Update backend/.env with your database credentials
DB_HOST=localhost
DB_USER=transport_user
DB_PASSWORD=secure_password_123
DB_NAME=transport_management_system
```

### 3. Start PHP Server
```bash
cd backend
php -S localhost:8000
```

### 4. Test API
```bash
curl http://localhost:8000/api/branches
```

---

## Security Considerations

1. **Input Validation** - All inputs are validated
2. **SQL Injection Prevention** - Using prepared statements
3. **CORS** - Configured for cross-origin requests
4. **Error Logging** - Errors logged to file
5. **Environment Variables** - Sensitive data in .env

---

## Performance

- **Database Indexes** - Optimized queries
- **Connection Pooling** - Efficient DB connections
- **Response Caching** - Implement as needed
- **Pagination** - Can be added for large datasets

---

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement pagination
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add caching layer
- [ ] Add API versioning
- [ ] Add webhook support
