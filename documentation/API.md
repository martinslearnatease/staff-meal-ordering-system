# API Documentation

## Authentication Endpoints

### Login
**POST** `/api/auth/login`

**Staff Login:**
```json
{
  "staff_id": "EMP001",
  "password": "Staff@123"
}
```

**Admin/Chef Login:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff",
      "department": "IT",
      "location": "Lagos"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Refresh Token
**POST** `/api/auth/refresh`
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Change Password
**POST** `/api/auth/change-password`
```json
{
  "currentPassword": "Old@123",
  "newPassword": "New@123"
}
```

## Staff Order Endpoints

### Create Order
**POST** `/api/orders`

**Request:**
```json
{
  "location": "Lagos",
  "meal_category": "Rice",
  "rice_type": "Jollof Rice",
  "rice_combination": "Moimoi + Chicken + Fish",
  "protein": "Chicken"
}
```

### Get Today's Order
**GET** `/api/orders/today`

### Update Order
**PUT** `/api/orders/:id`

### Get Order History
**GET** `/api/orders/history?limit=10&offset=0`

## Chef Endpoints

### Get All Orders
**GET** `/api/chef/orders?location=Lagos&status=Pending`

### Get Kitchen Summary
**GET** `/api/chef/orders/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "riceOrders": [
      { "meal": "Jollof Rice + Moimoi + Chicken", "count": 5 }
    ],
    "swallowOrders": [
      { "meal": "Semo + Egusi + Beef", "count": 3 }
    ],
    "totalOrders": 8
  }
}
```

### Search Orders
**GET** `/api/chef/orders/search?q=John`

### Update Order Status
**PUT** `/api/chef/orders/:id/status`
```json
{
  "status": "Preparing"
}
```

## Admin Endpoints

### Get Dashboard
**GET** `/api/admin/dashboard`

### User Management

#### List Users
**GET** `/api/admin/users?role=staff&limit=20&offset=0`

#### Create User
**POST** `/api/admin/users`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "staff_id": "EMP004",
  "password": "StrongPassword@123",
  "role": "staff",
  "department": "HR",
  "location": "Abuja"
}
```

#### Update User
**PUT** `/api/admin/users/:id`

#### Delete User
**DELETE** `/api/admin/users/:id`

#### Reset Password
**POST** `/api/admin/users/:id/reset-password`

### Settings

#### Get Settings
**GET** `/api/admin/settings`

#### Update Settings
**PUT** `/api/admin/settings`
```json
{
  "key": "ordering_close_time",
  "value": "11:00"
}
```

### Reports

#### Generate Report
**GET** `/api/admin/reports?format=excel&startDate=2024-01-01&endDate=2024-01-31`

Formats: `json`, `excel`, `pdf`

## Socket.IO Events

### Client Events (emit)
- `newOrder`: Emit when staff submits new order
- `updateOrderStatus`: Emit when chef updates status
- `requestKitchenSummary`: Request live kitchen summary

### Server Events (listen)
- `orderReceived`: New order submitted
- `orderStatusChanged`: Order status updated
- `playNotificationSound`: Play notification sound
- `kitchenSummary`: Kitchen summary data

## Error Responses

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (e.g., duplicate order)
- `500`: Server Error
