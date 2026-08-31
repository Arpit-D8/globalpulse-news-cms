# Production Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring and deploying the VIDARBHA PRINT news website to production. Follow each section in order to ensure all environment variables, external services, and deployment settings are correctly configured.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables Setup](#2-environment-variables-setup)
3. [MongoDB Atlas Configuration](#3-mongodb-atlas-configuration)
4. [Cloudinary Configuration](#4-cloudinary-configuration)
5. [Authentication Configuration](#5-authentication-configuration)
6. [Admin Account Setup](#6-admin-account-setup)
7. [Optional API Keys](#7-optional-api-keys)
8. [Vercel Deployment](#8-vercel-deployment)
9. [Custom Domain Setup](#9-custom-domain-setup)
10. [GitHub Actions CI/CD](#10-github-actions-cicd)
11. [Docker Deployment](#11-docker-deployment)
12. [Post-Deployment Verification](#12-post-deployment-verification)
13. [Security Hardening](#13-security-hardening)
14. [Monitoring & Backups](#14-monitoring--backups)

---

## 1. Prerequisites

Before starting, ensure you have:

- [ ] **Node.js 20+** installed (for local development)
- [ ] **Git** installed and configured
- [ ] **Vercel account** at [vercel.com](https://vercel.com) (recommended hosting)
- [ ] **MongoDB Atlas account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- [ ] **Cloudinary account** at [cloudinary.com](https://cloudinary.com)
- [ ] **Google Cloud account** (for Gemini API, optional)
- [ ] **GitHub repository** with the code pushed

---

## 2. Environment Variables Setup

### 2.1 Create Your Environment File

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**NEVER commit `.env.local` to version control.** It is listed in `.gitignore`.

### 2.2 Required Variables

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | ✅ | Generate with `openssl rand -hex 32` |
| `AUTH_URL` | ✅ | Your production URL (see below) |
| `ADMIN_EMAIL` | ✅ | Your admin email address |
| `ADMIN_PASSWORD` | ✅ | A strong password |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary dashboard |

### 2.3 Optional Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | ⚠️ | AI content generation |
| `NEWS_API_KEY` | ⚠️ | External news import |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ | SEO metadata (defaults to localhost) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ⚠️ | Public Cloudinary reference |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ⚠️ | Unsigned upload preset |

### 2.4 Understanding AUTH_URL vs NEXTAUTH_URL

**AUTH_URL** is the correct variable for NextAuth v5. It serves two purposes:
1. Sets the `issuer` in the OAuth flow
2. Enables `trustHost: true` automatically by validating the request host against this URL

**NEXTAUTH_URL** is the NextAuth v4 variable name. In NextAuth v5, `AUTH_URL` is preferred. Both work, but only `AUTH_URL` is validated at startup.

**Development:** `AUTH_URL=http://localhost:3000`
**Production:** `AUTH_URL=https://your-domain.com` (no trailing slash)

### 2.5 Generating NEXTAUTH_SECRET

```bash
# Generate a 32-byte hex string
openssl rand -hex 32

# Output example: a1b2c3d4e5f6...
```

Store this securely. Changing this secret will invalidate all existing sessions.

---

## 3. MongoDB Atlas Configuration

### 3.1 Create a Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (Free tier M0 is sufficient for development)
3. Choose your region (closest to your users)

### 3.2 Create Database User

1. Go to **Database Access** → **Add New Database User**
2. Set username and password (or use "Password Authentication" → "Generate Password")
3. Set **Privileges** → "Read and write to any database"
4. Click **Add User**

### 3.3 Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. For development: Add `0.0.0.0/0` (allow from anywhere) — **NOT recommended for production**
3. For production: Add your Vercel deployment IPs or use VPC peering

### 3.4 Get Connection String

1. Go to **Database** → Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string (it looks like `mongodb+srv://user:pass@cluster.x.mongodb.net/dbname`)
4. **Replace** `<password>` with your actual password
5. **Replace** `<dbname>` with your database name (e.g., `globalpulse`)

### 3.5 Set MONGODB_URI

```env
MONGODB_URI=mongodb+srv://user:<password>@cluster.x.mongodb.net/globalpulse?retryWrites=true&w=majority
```

**Important:** URL-encode any special characters in your password:
- `@` becomes `%40`
- `:` becomes `%3A`
- `/` becomes `%2F`

Example: If password is `P@ss/W:ord`, it becomes `P%40ss%2FW%3Aord`

---

## 4. Cloudinary Configuration

### 4.1 Create Account

1. Go to [Cloudinary](https://cloudinary.com) and sign up
2. Go to **Dashboard** → **Dashboard** tab

### 4.2 Get Credentials

Copy these from your Cloudinary dashboard:

- **Cloud Name** (e.g., `damgf5asq`)
- **API Key** (e.g., `486596933181484`)
- **API Secret** (e.g., `iyOwMQSy9Xv1DKORmOqLjDzBbHw`) — click "Reveal" to see it

### 4.3 Set Environment Variables

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4.4 Optional: Unsigned Upload Preset

For client-side uploads (if needed in the future):

1. Go to **Settings** → **Upload** → **Upload presets**
2. Click **Add upload preset**
3. Set signing mode to **Unsigned**
4. Copy the preset name

```env
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
```

### 4.5 Public Cloudinary Reference

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

This allows client-side code to reference Cloudinary URLs (e.g., for image optimization).

---

## 5. Authentication Configuration

### 5.1 NextAuth v5 Setup

The application uses **NextAuth v5** (`next-auth@5.0.0-beta.32`) with:

- **JWT Session Strategy** — sessions are stored in encrypted cookies
- **Credentials Provider** — email/password authentication for admin
- **Role-Based Access** — `role === "admin"` required for admin routes

### 5.2 Configure AUTH_URL

**Development:**
```env
AUTH_URL=http://localhost:3000
```

**Production (Vercel):**
```env
AUTH_URL=https://your-domain.com
```

**Important:** Do NOT include a trailing slash. The value must exactly match your deployment URL.

### 5.3 How Admin Authentication Works

1. Admin logs in at `/api/auth/signin` with email/password
2. Credentials are validated against `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local`
3. A JWT is issued with `role: "admin"` in the session
4. All admin API routes call `requireAdmin()` which checks the session
5. Non-admin users receive a 403 Forbidden error

### 5.4 Security Notes

- Passwords are stored as plaintext in environment variables (not recommended for enterprise)
- For production, consider integrating with a proper identity provider (Google, GitHub, etc.)
- The `ADMIN_PASSWORD` should be at least 16 characters with mixed case, numbers, and symbols
- Sessions expire when the browser closes (session cookies, not persistent)

---

## 6. Admin Account Setup

### 6.1 Set Admin Credentials

```env
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123!
```

### 6.2 Changing Admin Credentials

1. Update `.env.local` with new email/password
2. Redeploy the application
3. Log in with new credentials
4. **Delete the old `.env.local` from any machines it was copied to**

### 6.3 Adding Multiple Admins (Future Enhancement)

The current implementation supports a single admin defined by environment variables. To support multiple admins:

1. Create an `Admin` model in MongoDB
2. Add an admin management page in the admin panel
3. Replace `requireAdmin()` to check the database instead of env vars

---

## 7. Optional API Keys

### 7.1 Gemini API (AI Content Generation)

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Sign up and create an API key
3. Set the key:

```env
GEMINI_API_KEY=AIzaSy...
```

**Without this key, AI content generation features will be disabled gracefully.**

### 7.2 NewsAPI (External News Import)

1. Go to [NewsAPI](https://newsapi.org)
2. Sign up for a free account
3. Copy your API key
4. Set the key:

```env
NEWS_API_KEY=your-news-api-key
```

**Note:** The free plan only works for development (localhost). For production, use [GNews](https://gnews.io) or [MediaStack](https://mediastack.com) and update `services/ai/news/newsApi.ts`.

**Without this key, external news import will be disabled gracefully.**

---

## 8. Vercel Deployment

### 8.1 Quick Deploy (CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 8.2 Deploy with GitHub Integration (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Import repository in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select "Import Project" → Your GitHub repository
   - Choose "Framework Preset" → "Next.js"

3. **Configure environment variables:**
   - Go to your project in Vercel dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add each variable from `.env.local` (see table below)
   - **Do NOT copy `.env.local` directly** — add variables one by one

4. **Enable auto-deploy:**
   - Go to **Settings** → **Git**
   - Enable "Auto-deploy on push to main"

### 8.3 Vercel Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable | Scope | Required |
|----------|-------|----------|
| `MONGODB_URI` | Production | ✅ |
| `NEXTAUTH_SECRET` | Production | ✅ |
| `AUTH_URL` | Production | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Production | ✅ |
| `CLOUDINARY_API_KEY` | Production | ✅ |
| `CLOUDINARY_API_SECRET` | Production | ✅ |
| `ADMIN_EMAIL` | Production | ✅ |
| `ADMIN_PASSWORD` | Production | ✅ |
| `GEMINI_API_KEY` | Production | ⚠️ |
| `NEWS_API_KEY` | Production | ⚠️ |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview, Development | ⚠️ |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | All | ⚠️ |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | All | ⚠️ |

### 8.4 Verify Deployment

1. Visit your Vercel deployment URL
2. Check the health endpoint: `https://your-domain.vercel.app/api/health`
3. Try logging in with your admin credentials
4. Create a test article to verify the admin panel works

---

## 9. Custom Domain Setup

### 9.1 Add Domain in Vercel

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Domains**
3. Enter your domain (e.g., `www.vidarbhaprint.com`)
4. Click **Add**

### 9.2 Configure DNS Records

Vercel will provide DNS records to add:

**For `www` subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (provided by Vercel)
TTL: Automatic
```

**For apex domain (optional):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Automatic
```

### 9.3 Update AUTH_URL

After adding your custom domain:

1. Update `AUTH_URL` in Vercel environment variables:
   ```
   AUTH_URL=https://www.vidarbhaprint.com
   ```
2. Redeploy the application
3. Test login functionality

### 9.4 Automatic SSL

Vercel provides automatic SSL certificates. No configuration needed — your site will be available over HTTPS immediately after DNS propagation.

---

## 10. GitHub Actions CI/CD

### 10.1 Configure Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Where to Get |
|-------------|--------------|
| `VERCEL_TOKEN` | Vercel dashboard → Settings → Tokens → Personal Account → Create Token |
| `VERCEL_ORG_ID` | Vercel dashboard → Settings → General → Organization ID |
| `VERCEL_PROJECT_ID` | Vercel dashboard → Your Project → Settings → General → Project ID |
| `VERCEL_TEAM_ID` | Vercel dashboard → Settings → General → Team ID (or omit if using personal account) |

### 10.2 CI/CD Workflow

The `.github/workflows/ci.yml` file handles:

1. **On push to `main`:**
   - Run linting (non-blocking)
   - Run type-check (blocking)
   - Run build (blocking)
   - Deploy to Vercel production

2. **On pull request:**
   - Run linting, type-check, build
   - Create preview deployment with unique URL

### 10.3 Verify CI/CD

1. Push a change to `main`:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

2. Go to **Actions** tab in GitHub
3. Watch the workflow run
4. Verify the deployment succeeds

---

## 11. Docker Deployment

### 11.1 Build Production Image

```bash
# Build the Docker image
docker build -t news-website:latest .
```

### 11.2 Run with Docker

```bash
# Create .env file with production values
cp .env.example .env
nano .env  # Edit with production values

# Run the container
docker run -d \
  --name news-website \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  news-website:latest
```

### 11.3 Deploy with docker-compose

```bash
# Start app + MongoDB
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop everything
docker-compose down
```

### 11.4 Production Considerations

- **Do NOT run MongoDB in production via docker-compose** — use MongoDB Atlas
- Use a reverse proxy (nginx, caddy) for SSL termination
- Use Docker secrets or external secret management for sensitive values
- Set resource limits in docker-compose:
  ```yaml
  deploy:
    resources:
      limits:
        memory: 512M
        cpus: '0.5'
  ```

---

## 12. Post-Deployment Verification

### 12.1 Health Check

```bash
curl -f https://your-domain.com/api/health || echo "DOWN"
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T12:00:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "database": "connected"
}
```

### 12.2 Admin Login Test

1. Visit `https://your-domain.com/api/auth/signin`
2. Enter your admin email and password
3. Verify redirect to admin dashboard
4. Check that `document.cookie` contains `next-auth.session-token`

### 12.3 Article Creation Test

1. Go to admin panel (`/admin`)
2. Click "Create Article"
3. Fill in title, content, category
4. Submit and verify article appears in listing

### 12.4 Image Upload Test

1. In the article creation form, upload an image
2. Verify the image appears in the preview
3. Check Cloudinary dashboard for the uploaded asset

### 12.5 Security Headers Check

```bash
curl -I https://your-domain.com
```

Verify these headers are present:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (in production, only if using HTTPS)

---

## 13. Security Hardening

### 13.1 MongoDB Atlas

- [ ] **IP Whitelist:** Remove `0.0.0.0/0` and add specific IPs
- [ ] **Database User:** Use a strong, unique password
- [ ] **Encryption:** Ensure "Encryption at Rest" is enabled (default on Atlas)
- [ ] **Audit Logs:** Enable audit logging (Enterprise tier)

### 13.2 Vercel

- [ ] **Environment Variables:** Ensure no secrets are in code or git history
- [ ] **Team Access:** Limit team member access to production settings
- [ ] **Deployment Protection:** Enable protection for production deployments
- [ ] **Rate Limiting:** Review `lib/rate-limit.ts` configurations

### 13.3 Application

- [ ] **HTTPS Only:** Ensure `AUTH_URL` uses `https://`
- [ ] **Strong Admin Password:** At least 16 characters with mixed case, numbers, symbols
- [ ] **Session Timeout:** Review NextAuth session configuration
- [ ] **CSP Headers:** Review `next.config.ts` Content-Security-Policy

### 13.4 Code Security

- [ ] **No Hardcoded Secrets:** Run `git log -p | grep -i "password\|secret\|key"` to check
- [ ] **Dependencies Updated:** Run `npm audit fix` regularly
- [ ] **Rate Limiting:** Verify rate limits are appropriate for your traffic
- [ ] **Error Handling:** Ensure errors don't leak sensitive information

---

## 14. Monitoring & Backups

### 14.1 Database Backups

**MongoDB Atlas (Paid Plans):**
1. Go to **Backups** in Atlas dashboard
2. Enable automatic daily backups
3. Set retention period (recommended: 7 days)

**Manual Backup:**
```bash
# Backup command
mongodump --uri="mongodb+srv://user:pass@cluster.x.mongodb.net/globalpulse" --out=/backups/

# Restore command
mongorestore --uri="mongodb+srv://user:pass@cluster.x.mongodb.net/globalpulse" /backups/latest/
```

### 14.2 Uptime Monitoring

Use a service like [UptimeRobot](https://uptimerobot.com) (free tier available):

1. Create a new HTTP monitor
2. Set URL to `https://your-domain.com/api/health`
3. Check interval: 5 minutes
4. Configure alert contacts (email, SMS, Slack)

### 14.3 Error Tracking (Recommended)

Integrate [Sentry](https://sentry.io) for production error tracking:

```bash
npm install @sentry/nextjs
```

Then configure in `sentry.client.config.ts` and `sentry.edge.config.ts`.

### 14.4 Log Review

**Vercel Logs:**
1. Go to your project in Vercel dashboard
2. Navigate to **Logs** tab
3. Review error logs and response times
4. Set up alerting for error rate spikes

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
- Ensure cluster is not paused (Free tier pauses after 7 days of inactivity)
- URL-encode special characters in password

### Cloudinary Upload Fails

- Verify `CLOUDINARY_API_SECRET` is correct
- Check Cloudinary account limits (free tier: 7500 images/month)
- Test with `curl` to Cloudinary API

### Login Not Working

- Verify `AUTH_URL` exactly matches your deployment URL (no trailing slash)
- Check `NEXTAUTH_SECRET` is set and identical across deployments
- Clear browser cookies and try again
- Check browser console for CORS errors

### Rate Limiting Errors

- If you see "Too many requests", wait for the window to expire
- Adjust limits in `lib/rate-limit.ts` if needed
- Check Vercel logs for the requesting IP

---

## Quick Reference

### Generate Secrets

```bash
# NextAuth secret
openssl rand -hex 32

# Strong password (using openssl)
openssl rand -base64 24
```

### Useful Commands

```bash
# Local development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Docker build
docker build -t news-website:latest .

# Docker run
docker run -d --name news-website -p 3000:3000 --env-file .env news-website:latest
```

### Environment Variable Categories

**Required at startup:**
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `AUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Optional (feature-specific):**
- `GEMINI_API_KEY` — AI content generation
- `NEWS_API_KEY` — External news import
- `NEXT_PUBLIC_SITE_URL` — SEO metadata
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — Public Cloudinary reference
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — Unsigned uploads

---

**Last Updated:** 2025-01-21
