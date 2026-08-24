# VIDARBHA PRINT CMS — Roadmap

---

## v0.1 — Foundation

**Goal:** Establish the project scaffold, database connection, and core data model.

**Major Features**

- Next.js 15+ App Router project setup
- TypeScript configuration and ESLint
- MongoDB connection via Mongoose (`lib/mongodb.ts`)
- Article schema and model (`models/Article.ts`)
- Category constants and configuration (`lib/constants.ts`)
- Public-facing pages — home page, category listing, article detail
- Responsive TailwindCSS styling across all public pages
- Cloudinary media integration for image uploads

**Status:** ✅ Complete

---

## v0.2 — CRUD

**Goal:** Enable full article lifecycle management through the admin interface.

**Major Features**

- Admin authentication via NextAuth (`lib/auth.ts`)
- Admin dashboard layout with navigation and logout
- Article creation form with rich text editor (`components/editor/`)
- Article editing with pre-populated form data
- Article deletion with confirmation dialog
- Article listing table with search, pagination, and status badges
- API routes for article CRUD (`app/api/articles/route.ts`, `[id]/route.ts`)
- Admin article management pages (`app/admin/articles/`)

**Status:** ✅ Complete

---

## v0.3 — AI Generator

**Goal:** Integrate Gemini AI to assist with article creation and content generation.

**Major Features**

- Gemini AI integration via API route (`app/api/generate-article/`)
- AI-assisted article drafting from topic or summary
- News fetching pipeline (`app/admin/news-fetcher/`)
- Test endpoints for AI and news integration (`app/api/test-gemini/`, `app/api/test-news/`)
- AI-generated content review workflow before publication

**Status:** ✅ Complete

---

## v0.4 — Dashboard & Engineering

**Goal:** Build the admin dashboard analytics and establish engineering documentation and architecture.

**Major Features**

- Dashboard statistics API (`app/api/admin/dashboard/route.ts`)
- Dashboard statistics service layer (`lib/services/dashboard.service.ts`)
- Recent articles API (`app/api/admin/recent-articles/route.ts`)
- Dashboard UI components:
  - `DashboardStatCard` — individual stat card
  - `DashboardStats` — statistics grid with loading and error states
  - `RecentArticles` — latest articles widget with thumbnails and status
  - `QuickActions` — action cards for common operations
- Integrated dashboard layout in `app/admin/page.tsx`
- Engineering documentation:
  - `docs/ARCHITECTURE.md` — system architecture
  - `docs/ENGINEERING_PRINCIPLES.md` — engineering rules
  - `docs/VISION.md` — product vision
  - `docs/ROADMAP.md` — project roadmap
  - `docs/CHANGELOG.md` — release history
  - `docs/API.md` — API documentation
  - `docs/PROJECT_JOURNAL.md` — engineering journal
  - `docs/README_ENGINEERING.md` — docs index
  - `docs/ADR/` — architecture decision records

**Status:** ✅ Complete

---

## v0.5 — Editorial System

**Goal:** Add editorial workflow tools for multi-role newsrooms.

**Major Features**

- Role-based access control (Editor, Author, Admin)
- Editorial approval workflow — draft → review → published
- Article scheduling and queue management
- Category management interface (`/admin/categories`)
- Bulk article operations — publish, unpublish, delete
- Article version history and rollback
- Commenting and annotations on drafts

**Status:** 🟡 Planned

---

## v0.6 — AI Newsroom

**Goal:** Expand AI capabilities into a full editorial assistant.

**Major Features**

- AI-powered headline generation and A/B testing
- Automatic article summarization for social media
- Smart category and tag suggestions
- Breaking news detection from news feeds
- AI-assisted fact-checking and source verification
- Multilingual article generation and translation
- Content gap analysis and story recommendations

**Status:** 🟡 Planned

---

## v0.7 — Analytics

**Goal:** Provide real-time readership and content performance insights.

**Major Features**

- Page view tracking and aggregation
- Article-level engagement metrics (read time, scroll depth)
- Traffic source breakdown (organic, social, referral)
- Real-time dashboard with live visitor count
- Exportable reports (CSV, PDF)
- Audience demographics and geographic distribution
- Content performance ranking and trending topics

**Status:** 🟡 Planned

---

## v1.0 — Production

**Goal:** Ship a stable, production-ready platform for regional newsrooms.

**Major Features**

- Production deployment pipeline with CI/CD
- SSL, CDN, and edge caching configuration
- Monitoring and error tracking (Sentry, structured logging)
- Uptime monitoring and alerting
- Database backup and disaster recovery
- Performance optimization — Lighthouse scores > 90
- Security audit and penetration testing
- User documentation and onboarding guides
- Multi-language support (i18n)
- Compliance with accessibility standards (WCAG 2.1 AA)

**Status:** 🔴 Not Started

---

## Summary

| Version | Name | Status |
|---|---|---|
| v0.1 | Foundation | ✅ Complete |
| v0.2 | CRUD | ✅ Complete |
| v0.3 | AI Generator | ✅ Complete |
| v0.4 | Dashboard & Engineering | ✅ Complete |
| v0.5 | Editorial System | 🟡 Planned |
| v0.6 | AI Newsroom | 🟡 Planned |
| v0.7 | Analytics | 🟡 Planned |
| v1.0 | Production | 🔴 Not Started |
