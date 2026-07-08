# Deployment Guide

## Production Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- MySQL 8.0+
- Nginx
- PM2
- SSL Certificate (Let's Encrypt)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE meal_ordering_db;
CREATE USER 'meal_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON meal_ordering_db.* TO 'meal_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Application Setup

```bash
# Clone repository
git clone https://github.com/martinslearnatease/staff-meal-ordering-system.git
cd staff-meal-ordering-system

# Setup Backend
cd backend
npm install
cp .env.example .env
# Edit .env with production values
npm run migrate
npm run seed

# Start with PM2
pm2 start npm --name "meal-ordering-api" -- start
pm2 save

# Setup Frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env.production
npm run build
```

### 4. Nginx Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/meal-ordering
```

```nginx
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;

    # Frontend
    location / {
        root /var/www/meal-ordering/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://backend/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable Nginx config
sudo ln -s /etc/nginx/sites-available/meal-ordering /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. Environment Variables

**Production .env:**
```bash
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=meal_user
DB_PASSWORD=SecurePassword123!
DB_NAME=meal_ordering_db
JWT_SECRET=generate-a-strong-random-string
FRONTEND_URL=https://yourdomain.com
```

### 7. Backup Strategy

```bash
# Daily database backup
cat > /usr/local/bin/backup-meal-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/meal-ordering"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u meal_user -p'SecurePassword123!' meal_ordering_db | gzip > "$BACKUP_DIR/meal_ordering_$DATE.sql.gz"
find $BACKUP_DIR -mtime +7 -delete  # Keep 7 days of backups
EOF

chmod +x /usr/local/bin/backup-meal-db.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-meal-db.sh
```

### 8. Monitoring

```bash
# Install Monit for process monitoring
sudo apt install -y monit

# Configure PM2 to restart on failure
pm2 install pm2-auto-restart
pm2 startup
```

### 9. Performance Optimization

```bash
# Install Redis for caching/sessions
sudo apt install -y redis-server
sudo systemctl start redis-server

# Install Node.js clustering in backend
# (Configure in app.js for multi-core usage)
```

## Monitoring Checklist

- [ ] Application logs: `pm2 logs`
- [ ] Database performance
- [ ] CPU/Memory usage
- [ ] Disk space
- [ ] SSL certificate expiry
- [ ] Backup completion

## Rollback Procedure

```bash
# If deployment fails
cd /var/www/meal-ordering
git revert HEAD
npm run build
pm2 restart meal-ordering-api
```
