# Meal Ordering & Kitchen Management System - Database Schema

## Database Tables

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT UUID(),
  staff_id VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  location ENUM('Abuja', 'Lagos') DEFAULT 'Lagos',
  role ENUM('admin', 'staff', 'chef') DEFAULT 'staff',
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT UUID(),
  user_id UUID NOT NULL REFERENCES users(id),
  staff_name VARCHAR(100) NOT NULL,
  staff_id VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  location ENUM('Abuja', 'Lagos') NOT NULL,
  meal_category ENUM('Rice', 'Swallow') NOT NULL,
  rice_type ENUM('Jollof Rice', 'Fried Rice', 'White Rice'),
  swallow_type ENUM('Akpu/Fufu', 'Semo', 'Wheat'),
  soup ENUM('Egusi', 'Vegetable', 'Ogbono', 'Oha'),
  protein VARCHAR(255) NOT NULL,
  rice_combination VARCHAR(255),
  order_date DATE NOT NULL,
  order_time TIME NOT NULL,
  status ENUM('Pending', 'Preparing', 'Ready', 'Served', 'Cancelled') DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_date (order_date),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

### Menu Items Table
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT UUID(),
  category ENUM('Rice', 'Swallow', 'Rice_Type', 'Swallow_Type', 'Soup', 'Protein') NOT NULL,
  item_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('enabled', 'disabled') DEFAULT 'enabled',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category)
);
```

### Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT UUID(),
  name VARCHAR(100) NOT NULL UNIQUE,
  address TEXT,
  city VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Departments Table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT UUID(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### System Settings Table
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT UUID(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  data_type ENUM('string', 'boolean', 'number', 'json') DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Key Relationships

- **Orders → Users**: Many orders can belong to one user
- **Users → Departments**: Many users can belong to one department
- **Users → Locations**: Many users belong to one location

## Sample Queries

### Get today's orders
```sql
SELECT * FROM orders WHERE DATE(order_date) = CURDATE();
```

### Get most popular meals today
```sql
SELECT rice_type, COUNT(*) as count 
FROM orders 
WHERE DATE(order_date) = CURDATE() AND meal_category = 'Rice'
GROUP BY rice_type 
ORDER BY count DESC;
```

### Get orders by location
```sql
SELECT location, COUNT(*) as total 
FROM orders 
WHERE DATE(order_date) = CURDATE()
GROUP BY location;
```
