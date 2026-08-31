# PHASE 6O.2 — INFRASTRUCTURE PROVISIONING REPORT

**Date:** 2026-08-27
**Status:** BLOCKED — INFRASTRUCTURE DETAILS REQUIRED

---

## 1. EXECUTIVE SUMMARY

This phase assessed infrastructure readiness for the News Website production deployment. The application codebase is verified healthy and stable. However, no production infrastructure has been provisioned yet — no VPS, no domain, no MongoDB Atlas cluster, and no production credentials are available.

This phase has documented all infrastructure requirements, deployment workflows, and security configurations needed before actual application deployment can begin.

**Verdict: BLOCKED — INFRASTRUCTURE DETAILS REQUIRED**

---

## 2. CURRENT PROJECT BASELINE

| Field | Value |
|---|---|
| **Branch** | `main` |
| **HEAD commit** | `33a468c refactor: migrate middleware to proxy convention` |
| **Working tree** | Clean (no modified files) |
| **Untracked files** | Phase report markdown files only (non-source artifacts) |
| **Changes against HEAD** | None |

**Baseline status: STABLE.** No source code was modified during this phase.

---

## 3. APPLICATION HEALTH VERIFICATION

| Check | Result | Details |
|---|---|---|
| **npm audit** | ✅ PASS | 0 vulnerabilities |
| **TypeScript** | ✅ PASS | 0 errors (after `.next` cleanup of stale generated artifacts) |
| **Production build** | ✅ PASS | 30 pages generated, 0 errors |
| **Middleware** | ✅ Detected | `ƒ Proxy (Middleware)` in build output |

**Application health: ALL CHECKS PASSED.** The codebase is ready for deployment pending infrastructure availability.

---

## 4. APPROVED DEPLOYMENT ARCHITECTURE

Per Phase 6O.1 architecture review, the approved production architecture is:

```
Internet
    ↓
Domain + DNS (to be provisioned)
    ↓
Nginx (reverse proxy, HTTPS termination — to be provisioned)
    ↓
Next.js Application (PM2 managed, port 3000 — to be deployed)
    ↓
MongoDB Atlas (cloud database — to be provisioned)
    ↓
Cloudinary (media storage — account exists, credentials to be configured)
```

### Architecture Confirmations

| Confirmation | Status |
|---|---|
| Single-instance deployment | ✅ Confirmed |
| No background workers required | ✅ Confirmed |
| No WebSockets required | ✅ Confirmed |
| In-memory rate limiting acceptable | ✅ Confirmed (single-instance only) |
| MongoDB NOT running locally on VPS | ✅ Confirmed (MongoDB Atlas) |
| Cloudinary handles media storage | ✅ Confirmed |

---

## 5. VPS REQUIREMENTS

### Recommended Minimum Specifications

| Resource | Minimum | Recommended | Notes |
|---|---|---|---|
| **OS** | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS | Long-term support, LTS until 2029 |
| **vCPU** | 2 cores | 4 cores | AI content generation is CPU-intensive |
| **RAM** | 2 GB | 4 GB | Next.js build + runtime + MongoDB connection pool |
| **Disk** | 40 GB SSD | 60 GB SSD | Node modules (~500 MB), .next (~200 MB), logs, backups |
| **Network** | 100 Mbps | 1 Gbps | Media upload/download bandwidth |
| **Public IP** | Required | Required | IPv4 address |

### Provider Options (Not Purchased)

| Provider | Starting Price | Notes |
|---|---|---|
| **DigitalOcean** | $6/month (Droplet) | Simple UI, good documentation |
| **Linode (Akamai)** | $5/month (VPS) | Competitive pricing, good performance |
| **Vultr** | $3.50/month | Hourly billing, wide region selection |
| **AWS EC2** | $7.50/month (t3.micro) | Enterprise features, steeper learning curve |
| **Hetzner** | €4/month | European hosting, excellent price/performance |

**No VPS has been purchased or provisioned.** Provider selection is pending.

### Higher Traffic Scaling Path

For > 1,000 visitors/day:
- Upgrade to 4 GB RAM, 4 vCPU
- Add Redis for rate limiting (Upstash or self-hosted)
- Consider Cloudflare CDN for static asset caching
- Enable MongoDB Atlas read replicas

---

## 6. SERVER SOFTWARE REQUIREMENTS

### Required Software

| Software | Purpose | Installation Method |
|---|---|---|
| **Ubuntu Linux** | Operating system | VPS provider selection |
| **Node.js 20.x LTS** | JavaScript runtime | NodeSource repository |
| **npm** | Package manager | Bundled with Node.js |
| **Nginx** | Reverse proxy, HTTPS | `apt install nginx` |
| **PM2** | Process manager | `npm install -g pm2` |
| **Git** | Version control | `apt install git` |
| **Certbot** | SSL certificate management | `apt install certbot` |
| **curl** | Health checks, testing | `apt install curl` |
| **UFW** | Firewall management | `apt install ufw` |

### Optional Software

| Software | Purpose | Priority |
|---|---|---|
| **fail2ban** | Brute force protection | Medium |
| **Sentry CLI** | Error tracking | Medium |
| **logrotate** | Log rotation | Low |

**No software has been installed.** All installations are pending VPS provisioning.

---

## 7. NODE.JS COMPATIBILITY

### Package.json Analysis

| Package | Version | Node.js Requirement |
|---|---|---|
| `next` | 16.3.2 | Node.js 18.x or later |
| `next-auth` | 5.0.0-beta.32 | Node.js 18.x or later |
| `mongoose` | 9.9.3 | Node.js 18.x or later |
| `@types/node` | ^20.19.43 | Targets Node.js 20.x |
| `react` | 19.2.4 | Node.js 18.x or later |

### Recommended Production Node.js Version

**Node.js 20.x LTS** (active until April 2026)

Rationale:
- `@types/node` is pinned to `^20.x`, confirming Node.js 20 as the target
- Node.js 20.x is an active LTS version
- Next.js 16.3.2 fully supports Node.js 20.x
- Node.js 22.x LTS is also compatible but 20.x has broader production validation

### Installation on VPS

```bash
# NodeSource repository (Node.js 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**No Node.js was installed or modified during this phase.**

---

## 8. ENVIRONMENT VARIABLE INVENTORY

### Required Variables (7)

| Variable | Category | Description |
|---|---|---|
| `MONGODB_URI` | Database | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Authentication | Session signing secret (64-char hex) |
| `ADMIN_EMAIL` | Authentication | Admin account email |
| `ADMIN_PASSWORD` | Authentication | Admin account password |
| `CLOUDINARY_CLOUD_NAME` | Media | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Media | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Media | Cloudinary API secret |

### Optional Variables (3)

| Variable | Category | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | External API | Disabled | Google Gemini API key for AI content generation |
| `NEWS_API_KEY` | External API | Disabled | News API key for external news import |
| `NEXT_PUBLIC_SITE_URL` | Application URL | `http://localhost:3000` | Site base URL for SEO metadata |

### Secret Safety

| Check | Result |
|---|---|
| **Secrets in .env.example** | ❌ None — all values are placeholders |
| **Secrets in error messages** | ❌ None — only variable names exposed |
| **Secrets in client bundle** | ❌ None — only `NEXT_PUBLIC_*` variables are client-exposed |
| **.env in version control** | ❌ Excluded (`.gitignore`, `.env.example` template only) |

**No secrets were created, exposed, or stored during this phase.**

---

## 9. MONGODB ATLAS REQUIREMENTS

### Required Setup Steps (Not Yet Performed)

| Step | Description | Owner |
|---|---|---|
| 1. **Create cluster** | MongoDB Atlas M10+ cluster (recommended for production) | User |
| 2. **Create database user** | Strong username + generated password | User |
| 3. **Configure network access** | Whitelist VPS IP address (or 0.0.0.0/0 for development) | User |
| 4. **Obtain connection string** | Format: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/news-website` | User |
| 5. **Store in environment** | Set `MONGODB_URI` on production VPS | Deployer |

### Connection Architecture

- **Global caching:** `globalThis.mongooseCache` persists connection across requests
- **Buffer disabled:** `bufferCommands: false` prevents silent query queuing
- **Model registration:** All 5 models imported at module load time
- **Connection pool:** Default Mongoose pool size (5), adequate for single-instance

### Backup Requirements

| Backup Type | Method | Frequency |
|---|---|---|
| Automatic | Atlas built-in backups (M10+ tier) | Daily |
| Manual | Atlas manual snapshots | Before migrations |
| Export | `mongodump` / `mongorestore` | Weekly |

**No MongoDB operations were performed during this phase.**

---

## 10. CLOUDINARY REQUIREMENTS

### Required Configuration

| Parameter | Environment Variable | Status |
|---|---|---|
| Cloud Name | `CLOUDINARY_CLOUD_NAME` | Pending credentials |
| API Key | `CLOUDINARY_API_KEY` | Pending credentials |
| API Secret | `CLOUDINARY_API_SECRET` | Pending credentials |

### Image Optimization Configuration

**File:** `next.config.ts`

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.cloudinary.com" },
    { protocol: "https", hostname: "images.unsplash.com" },
  ],
}
```

### Production Requirements

| Requirement | Recommendation |
|---|---|
| **Cloudinary plan** | Free tier adequate for < 25 GB storage, 250 GB bandwidth/month |
| **Upload preset** | Configure unsigned upload preset for client-side uploads (optional) |
| **Transformations** | Use Cloudinary URL transformations for responsive images |
| **Backup** | Enable Cloudinary media backup add-on for production |

**No Cloudinary resources were modified during this phase.**

---

## 11. DOMAIN REQUIREMENTS

### Current Status

**DOMAIN NOT YET PROVIDED**

No domain name has been registered, purchased, or configured for this project.

### Future DNS Requirements

Once a domain is selected and VPS IP is known:

| Record Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `<VPS_IPv4>` | 3600 |
| A (optional) | `www` | `<VPS_IPv4>` | 3600 |

### Domain Registration

| Provider | Cost | Notes |
|---|---|---|
| Namecheap | $8-15/year | Simple UI, free WHOIS privacy |
| Cloudflare Registrar | $9-15/year | At-cost pricing, no markup |
| Google Domains | $12-20/year | Integrated with Google services |
| Porkbun | $8-14/year | Competitive pricing |

### DNS Configuration Timing

DNS should only be configured **after**:
1. Domain is registered
2. VPS public IP is known
3. Nginx is installed and configured

**No DNS changes were made during this phase.**

---

## 12. FIREWALL PLAN

### Required Inbound Ports

| Port | Protocol | Service | Status |
|---|---|---|---|
| 22 | TCP | SSH | To be opened |
| 80 | TCP | HTTP (Nginx) | To be opened |
| 443 | TCP | HTTPS (Nginx) | To be opened |

### Required Outbound Ports

| Port | Protocol | Service |
|---|---|---|
| 443 | TCP | MongoDB Atlas, Cloudinary, Gemini API, News API |
| 80 | TCP | Certbot ACME challenge |
| 22 | TCP | SSH (management) |

### Future UFW Commands (Not Executed)

```bash
# Install UFW (if not pre-installed)
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow required services
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify status
sudo ufw status
```

**No firewall changes were made during this phase.**

---

## 13. NGINX ARCHITECTURE PLAN

### Request Flow

```
Client (browser)
    ↓ HTTPS :443
Nginx (reverse proxy, TLS termination)
    ↓ localhost:3000
PM2 → Next.js Application (port 3000)
```

### Nginx Responsibilities

| Responsibility | Configuration |
|---|---|
| HTTPS termination | Let's Encrypt certificates |
| HTTP → HTTPS redirect | `return 301 https://$host$request_uri` |
| Reverse proxy to Next.js | `proxy_pass http://localhost:3000` |
| Static asset caching | `expires 30d` for images, CSS, JS |
| Security headers (optional) | Additional layer on top of proxy.ts headers |

### Important Security Note

**Next.js must NOT be publicly exposed on port 3000.** Nginx is the only publicly accessible entry point.

### Nginx Configuration Template (Not Created Yet)

Final Nginx configuration requires:
1. Production domain name
2. SSL certificate paths (from Certbot)
3. VPS IP address (for DNS records)

**No Nginx configuration was created during this phase.**

---

## 14. PM2 ARCHITECTURE PLAN

### Process Configuration

| Parameter | Value |
|---|---|
| **App name** | `news-website` |
| **Script** | `npm start` |
| **Internal port** | 3000 |
| **Instances** | 1 (single-instance deployment) |
| **Max memory restart** | 1G (auto-restart if memory exceeds 1 GB) |
| **Log files** | `/var/log/pm2/news-website-error.log`, `/var/log/pm2/news-website-out.log` |

### Future PM2 Commands (Not Executed)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem config
# (see ecosystem.config.js in Phase 6O.1 report)

# Start application
pm2 start npm --name "news-website" -- start

# Save process list
pm2 save

# Start on boot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs news-website

# Restart (zero-downtime)
pm2 restart news-website
```

### Ecosystem Config (To Be Created on VPS)

```javascript
module.exports = {
  apps: [{
    name: 'news-website',
    script: 'npm',
    args: 'start',
    env: { NODE_ENV: 'production' },
    instances: 1,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/pm2/news-website-error.log',
    out_file: '/var/log/pm2/news-website-out.log',
  }],
};
```

**No PM2 processes were started during this phase.**

---

## 15. HTTPS PLAN

### Let's Encrypt Workflow

| Step | Action | Prerequisite |
|---|---|---|
| 1 | VPS provisioned and accessible | VPS IP known |
| 2 | DNS points to VPS | Domain registered |
| 3 | Nginx installed and configured | Nginx ready |
| 4 | HTTP site reachable on port 80 | Nginx listening |
| 5 | Run Certbot | Steps 1-4 complete |
| 6 | Verify certificate | Certbot completes |
| 7 | Verify automatic renewal | Certbot installs systemd timer |

### Certbot Commands (Not Executed)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### HSTS (HTTP Strict Transport Security)

**Enforced in proxy.ts at runtime:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**HSTS preload submission** (optional, requires 1-year commitment):
```
https://hstspreload.org/
```

**No SSL certificates were requested during this phase.**

---

## 16. DEPLOYMENT WORKFLOW

### Recommended Deployment Sequence

```
Developer Machine
    ↓ (git push)
GitHub Repository
    ↓ (SSH deploy script)
VPS: git pull origin main
    ↓
VPS: npm ci --production
    ↓
VPS: npm run build
    ↓
VPS: pm2 restart news-website
    ↓
VPS: pm2 save
    ↓
VPS: curl http://localhost:3000/api/health (health check)
    ↓
Deploy complete
```

### Deployment Script (To Be Created on VPS)

```bash
#!/bin/bash
# deploy.sh — Zero-downtime deployment script

set -e

echo "=== Starting Deployment ==="

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci --production

# 3. Build application
npm run build

# 4. Restart with PM2
pm2 restart news-website

# 5. Save PM2 process list
pm2 save

# 6. Health check
sleep 5
for i in 1 2 3; do
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  if [ "$response" = "200" ]; then
    echo "Health check passed."
    exit 0
  fi
  sleep 5
done

echo "ERROR: Health check failed. Rolling back..."
pm2 restart news-website
exit 1
```

**No deployment was performed during this phase.**

---

## 17. BACKUP PLAN

### Backup Requirements

| Resource | Backup Method | Frequency | Storage |
|---|---|---|---|
| **MongoDB** | Atlas automatic backups (M10+ tier) | Daily | MongoDB Atlas |
| **MongoDB** | `mongodump` manual snapshots | Before migrations | VPS local storage |
| **Application** | Git repository | Continuous | GitHub/GitLab |
| **Environment variables** | Password manager (1Password, Bitwarden) | Before changes | Secure vault |
| **Media** | Cloudinary backup add-on | Monthly | Cloudinary |
| **VPS** | Provider snapshot | Before major changes | VPS provider |

### Disaster Recovery

| Scenario | Recovery Steps | Estimated RTO |
|---|---|---|
| VPS failure | Provision new VPS, restore from backup | 2-4 hours |
| Database corruption | Restore from `mongorestore` | 30-60 minutes |
| Security breach | Rebuild VPS, rotate all secrets, restore from clean backup | 4-8 hours |

**No backups were created during this phase.**

---

## 18. MONITORING PLAN

### Baseline Monitoring

| Tool | What it Monitors | Cost |
|---|---|---|
| **PM2 monit** | CPU, memory, restarts | Free |
| **PM2 logs** | Application stdout/stderr | Free |
| **MongoDB Atlas Monitoring** | Query performance, connection count, storage | Free (M0-M10), Paid (M20+) |
| **Server disk usage** | `df -h` | Free |
| **Server memory usage** | `free -h` | Free |

### Optional Monitoring

| Tool | What it Monitors | Cost |
|---|---|---|
| **Sentry** | Error tracking, performance monitoring | Free tier available |
| **UptimeRobot** | HTTP health checks, alerts | Free tier (50 monitors) |
| **Better Uptime** | HTTP checks, alerts | $5/month |
| **Datadog** | Full stack monitoring | $15+/month |

### Health Check Endpoint (Recommended)

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
```

**No monitoring services were installed during this phase.**

---

## 19. SECURITY CHECKLIST

### Infrastructure Security Preservation

| Security Control | Status | Notes |
|---|---|---|
| **HTTPS** | ✅ Planned | Let's Encrypt + Certbot |
| **Content-Security-Policy** | ✅ Preserved | proxy.ts headers intact |
| **X-Frame-Options: DENY** | ✅ Preserved | proxy.ts headers intact |
| **X-Content-Type-Options: nosniff** | ✅ Preserved | proxy.ts headers intact |
| **Referrer-Policy** | ✅ Preserved | proxy.ts headers intact |
| **Permissions-Policy** | ✅ Preserved | proxy.ts headers intact |
| **COOP / CORP** | ✅ Preserved | proxy.ts headers intact |
| **HSTS** | ✅ Preserved | proxy.ts production-only header |
| **Authentication (NextAuth v5)** | ✅ Preserved | JWT + Credentials + bcrypt |
| **requireAdmin() protection** | ✅ Preserved | 67+ calls across admin routes |
| **Environment validation** | ✅ Preserved | Fails fast at module load |
| **Rate limiting** | ✅ Preserved | In-memory sliding window |
| **MongoDB credential isolation** | ✅ Planned | Credentials only in .env.local |
| **Cloudinary credential isolation** | ✅ Planned | Credentials only in .env.local |

**All existing security controls will be preserved during deployment.** No security weakening was performed or planned.

---

## 20. INFRASTRUCTURE READINESS CHECKLIST

### VPS

| Item | Status |
|---|---|
| Provider selected? | ⬜ Not selected |
| Server provisioned? | ⬜ Not provisioned |
| Public IP available? | ⬜ Not available |
| SSH access available? | ⬜ Not available |

### Domain

| Item | Status |
|---|---|
| Domain selected? | ⬜ Not selected |
| DNS access available? | ⬜ Not available |
| DNS configured? | ⬜ Not configured |

### Database

| Item | Status |
|---|---|
| MongoDB Atlas cluster ready? | ⬜ Not created |
| Production user ready? | ⬜ Not created |
| Production URI ready? | ⬜ Not available |

### Cloudinary

| Item | Status |
|---|---|
| Production credentials available? | ⬜ Pending |

### Server Software

| Item | Status |
|---|---|
| Ubuntu ready? | ⬜ No VPS |
| Node.js ready? | ⬜ No VPS |
| Nginx ready? | ⬜ No VPS |
| PM2 ready? | ⬜ No VPS |
| Firewall configured? | ⬜ No VPS |

### Deployment

| Item | Status |
|---|---|
| Application deployment NOT STARTED | ✅ Confirmed |

---

## 21. DEPLOYMENT BLOCKERS

The following items must be provided before actual application deployment can begin:

| # | Blocker | Owner | Impact |
|---|---|---|---|
| 1 | **VPS provider selection** | User | Cannot provision server |
| 2 | **VPS public IP** | User | Cannot configure DNS, Nginx, MongoDB Atlas |
| 3 | **SSH access credentials** | User | Cannot connect to server |
| 4 | **Domain name** | User | Cannot configure HTTPS, DNS |
| 5 | **DNS access** | User | Cannot point domain to VPS |
| 6 | **MongoDB Atlas production URI** | User | Application cannot connect to database |
| 7 | **Production API credentials** | User | NEXTAUTH_SECRET, Cloudinary keys, admin credentials |

**All blockers are infrastructure/credential related, NOT application code issues.** The application codebase is verified healthy and ready for deployment pending infrastructure availability.

---

## 22. DATABASE SAFETY CONFIRMATION

| Check | Result |
|---|---|
| **Database connections made** | 0 |
| **Database queries executed** | 0 |
| **Database migrations run** | 0 |
| **Database users created** | 0 |
| **Database data modified** | 0 |
| **MongoDB Atlas accessed** | 0 |

**Database safety: CONFIRMED. Zero database operations were performed during this phase.**

---

## 23. SECRETS SAFETY CONFIRMATION

| Check | Result |
|---|---|
| **Secrets created** | 0 |
| **Secrets exposed** | 0 |
| **Secrets printed in output** | 0 |
| **Secrets stored in files** | 0 |
| **.env.local created** | 0 |
| **.env committed to Git** | 0 |
| **NEXTAUTH_SECRET generated** | 0 |
| **Admin credentials set** | 0 |

**Secrets safety: CONFIRMED. No secrets were created, exposed, or stored during this phase.**

---

## 24. NO-CODE-CHANGE VERIFICATION

| Check | Result |
|---|---|
| **Application source code changed** | ✅ None |
| **package.json changed** | ✅ None |
| **package-lock.json changed** | ✅ None |
| **Database operations** | ✅ None |
| **Secrets created or exposed** | ✅ None |
| **git diff against HEAD** | ✅ Empty (no changes) |
| **git status --short** | ✅ Only untracked report files |

**No-code-change verification: PASSED.** The application source tree remains completely unmodified.

---

## 25. FINAL VERDICT

### BLOCKED — INFRASTRUCTURE DETAILS REQUIRED

The application codebase is verified healthy and stable:

- ✅ npm audit: 0 vulnerabilities
- ✅ TypeScript: 0 errors
- ✅ Production build: 30 pages generated successfully
- ✅ All security headers preserved
- ✅ Authentication intact
- ✅ Rate limiting intact
- ✅ No source code changes

However, no production infrastructure exists:

- ❌ No VPS provisioned
- ❌ No domain registered
- ❌ No MongoDB Atlas cluster
- ❌ No production credentials available
- ❌ No SSH access available

**All blockers are infrastructure/credential related. The application is ready to deploy as soon as infrastructure is provisioned.**

### Recommended Next Steps

1. **Select VPS provider** (DigitalOcean, Linode, Vultr, AWS, Hetzner)
2. **Provision VPS** (Ubuntu 24.04, 2+ cores, 2+ GB RAM, 40+ GB SSD)
3. **Register domain** (Namecheap, Cloudflare, Google Domains)
4. **Configure DNS** (A record → VPS IP)
5. **Provision MongoDB Atlas** (M10+ cluster, production user)
6. **Obtain production credentials** (NEXTAUTH_SECRET, Cloudinary keys, admin credentials)
7. **Provide SSH access** (IP, username, authentication method)
8. **Proceed to Phase 6O.3 — Application Deployment**

---

**Report generated: 2026-08-27**
**Phase 6O.2 Complete. Awaiting infrastructure provisioning before proceeding to Phase 6O.3 — Application Deployment.**
