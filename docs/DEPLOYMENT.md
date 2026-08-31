# Deployment Guide

## Overview

This guide covers deployment options for the VIDARBHA PRINT news website:

1. **Vercel** (Recommended) — Zero-config deployment
2. **Docker** — Self-hosted with docker-compose
3. **Any Node.js host** — Manual deployment

---

## Option 1: Vercel Deployment (Recommended)

### Prerequisites

1. Vercel account ([vercel.com](https://vercel.com))
2. Vercel CLI (optional): `npm i -g vercel`
3. MongoDB Atlas cluster
4. Cloudinary account (for image uploads)
5. GitHub repository (for CI/CD)

### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### GitHub Integration (CI/CD)

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Configure environment variables in Vercel settings
4. Enable auto-deploy on push to `main` branch

### Required Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | ✅ | Secret for NextAuth (generate: `openssl rand -hex 32`) |
| `AUTH_URL` | ✅ | Production URL (e.g., `https://your-domain.com`) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `GEMINI_API_KEY` | ⚠️ | Google Gemini API key (for AI features) |
| `NEWS_API_KEY` | ⚠️ | NewsAPI key (for news import) |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ | Public site URL |

### Custom Domain

1. Go to Vercel → Settings → Domains
2. Add your domain (e.g., `www.vidarbhaprint.com`)
3. Update DNS records as instructed
4. Vercel provides automatic SSL

### Preview Deployments

Every pull request gets a unique preview URL automatically. No configuration needed.

---

## Option 2: Docker Deployment

### Prerequisites

1. Docker installed on server
2. MongoDB Atlas cluster (or local MongoDB)
3. Domain name with SSL certificate

### Local Development with Docker

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with your values
nano .env

# Start everything (app + MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop everything
docker-compose down
```

### Production Deployment

```bash
# Build production image
docker build -t news-website:latest .

# Run with environment variables
docker run -d \
  --name news-website \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/news-website \
  -e NEXTAUTH_SECRET=$(openssl rand -hex 32) \
  -e AUTH_URL=https://your-domain.com \
  -e CLOUDINARY_CLOUD_NAME=your-cloud \
  -e CLOUDINARY_API_KEY=your-key \
  -e CLOUDINARY_API_SECRET=your-secret \
  --restart unless-stopped \
  news-website:latest
```

### Production with docker-compose

```bash
# Create .env file with production values
cp .env.example .env
nano .env

# Start in production mode
docker-compose up -d
```

---

## Option 3: Manual Deployment (Any Node.js Host)

### Prerequisites

1. Node.js 20+ installed
2. MongoDB Atlas cluster
3. Domain name with reverse proxy (nginx, caddy, etc.)

### Build & Deploy

```bash
# Clone repository
git clone https://github.com/your-org/news-website.git
cd news-website

# Install dependencies
npm ci --production

# Set environment variables
export MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/news-website
export NEXTAUTH_SECRET=$(openssl rand -hex 32)
export AUTH_URL=https://your-domain.com
export CLOUDINARY_CLOUD_NAME=your-cloud
export CLOUDINARY_API_KEY=your-key
export CLOUDINARY_API_SECRET=your-secret

# Build
npm run build

# Start production server
npm start
```

### Systemd Service (Linux)

Create `/etc/systemd/system/news-website.service`:

```ini
[Unit]
Description=VIDARBHA PRINT News Website
After=network.target

[Service]
Type=application
User=www-data
WorkingDirectory=/var/www/news-website
Environment=NODE_ENV=production
EnvironmentFile=/var/www/news-website/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable news-website
sudo systemctl start news-website
sudo systemctl status news-website
```

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Database Backup

### MongoDB Atlas (Recommended)

1. Go to MongoDB Atlas → Your Cluster → Backups
2. Enable automatic backups (paid feature)
3. Or create manual snapshots

### Self-Hosted MongoDB

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/news-website" --out=/backups/

# Restore
mongorestore --uri="mongodb://localhost:27017/news-website" /backups/news-website/

# Automated daily backup with cron
0 2 * * * mongodump --uri="mongodb://localhost:27017/news-website" --out=/backups/$(date +\%Y\%m\%d)
```

---

## Monitoring & Alerts

### Health Check

```bash
# Check if app is running
curl -f http://your-domain.com/api/health || echo "DOWN"
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (free tier available)
- **Pingdom** (paid)
- **Better Stack** (paid)

Configure HTTP monitoring to hit your health check endpoint and alert on downtime.

---

## Rollback Strategy

### Vercel

1. Go to Deployments in Vercel dashboard
2. Find previous successful deployment
3. Click "Deploy" to rollback

### Docker

```bash
# Keep previous image tagged
docker tag news-website:latest news-website:rollback-$(date +%Y%m%d)

# Rollback to previous image
docker stop news-website
docker rm news-website
docker run -d --name news-website [previous image ID]
```

### Manual

Keep previous build directory:

```bash
# Before deploying new version
cp -r .next .next.backup

# After successful build
rm -rf .next.backup

# Rollback if needed
rm -rf .next
mv .next.backup .next
npm start
```

---

## Security Checklist

- [ ] All environment variables set (no secrets in code)
- [ ] HTTPS enabled (Vercel does this automatically)
- [ ] Strong `NEXTAUTH_SECRET` generated
- [ ] MongoDB IP whitelist configured (Atlas)
- [ ] Cloudinary upload permissions restricted
- [ ] Regular database backups enabled
- [ ] Monitoring configured
- [ ] Error tracking set up (Sentry, etc.)

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules .next
npm ci
npm run build
```

### MongoDB Connection Error

- Check MongoDB Atlas IP whitelist
- Verify `MONGODB_URI` contains correct credentials
- Ensure cluster is not paused

### Cloudinary Upload Fails

- Verify `CLOUDINARY_API_SECRET` is correct
- Check Cloudinary cloud settings allow your uploads
- Test with `curl` to Cloudinary API

---

**Last Updated:** 2025-01-21
