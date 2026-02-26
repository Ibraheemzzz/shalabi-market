# Shalabi Market — Single VPS Deployment Guide (Monolithic)

This guide explains how to deploy the entire project (Backend API + Frontend Website + Database) on a **single VPS server**, minimizing costs and simplifying management.

## 1. Server Requirements

| Component | Minimum Requirement |
|---|---|
| **OS** | Ubuntu 22.04 LTS or newer |
| **RAM** | 2 GB |
| **CPU** | 1 vCPU |
| **Storage** | 40 GB SSD |
| **Estimated Cost** | $5 – $10/month (DigitalOcean, Contabo, Hetzner, etc.) |

### Required Software
- **Node.js** v18+ (runtime for the backend)
- **PostgreSQL** (database)
- **Nginx** (web server & reverse proxy)
- **PM2** (process manager to keep the app running 24/7)

## 2. How It Works

The Node.js backend has been configured to serve the frontend static files directly from a `public/` directory. This means:

- Visitors accessing `https://yourdomain.com/` → see the **Frontend website**
- Visitors accessing `https://yourdomain.com/api/` → hit the **Backend API**
- Both run on the **same server, same domain, same port** — no CORS issues.

### Project Structure
```
shalabi-market-patched/
├── public/              ← Place compiled frontend files here
│   ├── index.html
│   ├── assets/
│   └── ...
├── src/                 ← Backend source code
├── prisma/              ← Database schema & migrations
├── uploads/             ← User-uploaded images
├── .env                 ← Environment variables
└── package.json
```

## 3. Step-by-Step Deployment

### Step 1: Prepare the Server
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

### Step 2: Set Up the Database
```bash
# Switch to postgres user and create a new database & user
sudo -u postgres psql

CREATE USER shalabi_user WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE shalabi_market OWNER shalabi_user;
GRANT ALL PRIVILEGES ON DATABASE shalabi_market TO shalabi_user;
\q
```

### Step 3: Upload the Project
```bash
# Upload project files to the server (via Git, SCP, or FTP)
# Example using Git:
cd /var/www
git clone <your-repo-url> shalabi-market
cd shalabi-market

# Install dependencies
npm install --production
```

### Step 4: Configure Environment Variables
```bash
# Edit the .env file
nano .env
```
Update the following values:
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://shalabi_user:your_strong_password_here@localhost:5432/shalabi_market
JWT_SECRET=generate_a_random_64_char_string_here
ALLOWED_ORIGINS=https://yourdomain.com
```

### Step 5: Run Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 6: Build & Place the Frontend
On your **local machine** (where the frontend project is):
```bash
cd frontend-project/
npm run build
```
Then copy the contents of the `dist/` (or `build/`) folder into the `public/` directory on the server:
```bash
scp -r dist/* user@your-server-ip:/var/www/shalabi-market/public/
```

### Step 7: Start the Application with PM2
```bash
cd /var/www/shalabi-market
pm2 start src/server.js --name "shalabi-market"
pm2 save
pm2 startup
```

### Step 8: Configure Nginx (Reverse Proxy + Domain)
```bash
sudo nano /etc/nginx/sites-available/shalabi-market
```
Paste the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Allow large file uploads (images)
        client_max_body_size 10M;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/shalabi-market /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Install Free SSL Certificate (HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot will automatically configure Nginx to use HTTPS. The certificate renews automatically.

## 4. Useful PM2 Commands
```bash
pm2 status              # Check if the app is running
pm2 logs shalabi-market  # View live logs
pm2 restart shalabi-market  # Restart after code changes
pm2 stop shalabi-market  # Stop the app
```

## 5. Summary

| What | Where |
|---|---|
| Frontend (Website) | Served from `public/` folder by Node.js |
| Backend (API) | Node.js running on port 3001, managed by PM2 |
| Database | PostgreSQL running locally on the same server |
| Web Server | Nginx forwards traffic from port 80/443 to Node.js |
| SSL (HTTPS) | Free via Let's Encrypt / Certbot |
| **Total Cost** | **~$5–10/month for the VPS + ~$10/year for the domain** |
