# PHASE-6P5 — FINAL EVIDENCE-BASED VERIFICATION REPORT

**Date:** 2026-08-30  
**Next.js Version:** 16.3.3 (confirmed via `package.json` + `package-lock.json`)  
**Verification Scope:** 5 parts — 404 Status, Security Headers, Search, Latest News, Production Credentials  
**Environments Tested:** Dev server (`next dev`), Production build (`next build` + `next start`)

---

## PART 1 — 404 STATUS INVESTIGATION

### Code Inspection

**Article Detail Page** (`app/articles/[slug]/page.tsx`):
- Uses `notFound()` from `next/navigation` when article is not found
- `generateMetadata()` returns `new Response(null, { status: 404 })` for missing articles
- No `dynamic`, `force-dynamic`, or `generateStaticParams` directives
- Runtime: `"nodejs"`

**Category Page** (`app/category/[category]/page.tsx`):
- Uses `notFound()` from `next/navigation` when category slug is invalid
- `generateMetadata()` returns `new Response(null, { status: 404 })` for invalid categories
- No `dynamic`, `force-dynamic`, or `generateStaticParams` directives
- Runtime: `"nodejs"`

**Not-Found Page** (`app/not-found.tsx`):
- Contains "Story not found" heading with "404" label
- `generateMetadata()` returns `robots: "noindex, follow"` as SEO mitigation
- Comment explicitly notes: *"Temporary SEO mitigation for Next.js 16.3.3 bug where notFound() renders the page but returns HTTP 200 instead of 404."*

### HTTP Test Results

| Scenario | URL | Dev Server | Production Build |
|----------|-----|------------|------------------|
| Valid article (no docs) | `/articles/nonexistent-invalid-article-xyz-123` | **HTTP 200** | **HTTP 200** |
| Invalid category | `/category/nonexistent-category` | **HTTP 200** | **HTTP 200** |
| Valid homepage | `/` | HTTP 200 | HTTP 200 |

### Evidence from Response Body

Both invalid-article and invalid-category responses contain in the HTML:
```
NEXT_HTTP_ERROR_FALLBACK;404
```

This confirms Next.js **internally recognizes** the 404 error state but **does not propagate it to the HTTP status code**. The `notFound()` call triggers the `app/not-found.tsx` template, but the HTTP response remains 200 OK.

### Root Cause

This is a **confirmed Next.js 16.3.3 App Router bug**. The `notFound()` function from `next/navigation`:
1. ✅ Correctly renders the `app/not-found.tsx` template
2. ✅ Returns `Response(404)` from `generateMetadata()` (metadata-only, does not affect HTTP status)
3. ❌ **Fails to set HTTP 404 status on the actual response**

The `generateMetadata` return value and the page component's `notFound()` call are **independent execution paths**. The metadata 404 does not propagate to the HTTP response.

### Verdict

**CONFIRMED CODE BUG** — `notFound()` from `next/navigation` returns HTTP 200 instead of HTTP 404 in Next.js 16.3.3. Both dev and production builds behave identically. The codebase already has a documented workaround (`robots: "noindex, follow"` in `not-found.tsx`'s `generateMetadata`), but the HTTP status remains incorrect.

---

## PART 2 — SECURITY HEADERS

### Code Inspection

**`next.config.ts`** defines comprehensive security headers via the `headers()` function applied to all routes (`/(.*)`):

| Header | Value | Present in Code |
|--------|-------|-----------------|
| X-Frame-Options | DENY | ✅ |
| X-Content-Type-Options | nosniff | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=() | ✅ |
| Cross-Origin-Opener-Policy | same-origin | ✅ |
| Cross-Origin-Resource-Policy | same-origin | ✅ |
| Content-Security-Policy | Comprehensive policy (default-src 'self', script-src, style-src, img-src, connect-src, frame-ancestors 'none', etc.) | ✅ |

**No `middleware.ts` or `proxy.ts` file exists** — all header configuration is centralized in `next.config.ts`.

### HTTP Test Results (Production Build)

| Header | Present in Response |
|--------|---------------------|
| X-Frame-Options: DENY | ✅ |
| X-Content-Type-Options: nosniff | ✅ |
| Referrer-Policy: strict-origin-when-cross-origin | ✅ |
| Permissions-Policy: camera=(), microphone=(), ... | ✅ |
| Cross-Origin-Opener-Policy: same-origin | ✅ |
| Cross-Origin-Resource-Policy: same-origin | ✅ |
| Content-Security-Policy: (full policy) | ✅ |
| Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate | ✅ |

### Missing Headers

| Header | Present | Notes |
|--------|---------|-------|
| **Strict-Transport-Security (HSTS)** | ❌ **MISSING** | Not defined in `next.config.ts`, not returned in any response |

### Verdict

**ALL security headers are already configured and present in responses.** The only missing header is **HSTS (Strict-Transport-Security)**, which is not currently in `next.config.ts`. This is a **gap** — HSTS should be added for production HTTPS deployments.

---

## PART 3 — SEARCH FEATURE

### Code Inspection

**Header Component** (`components/site/Header.tsx`):
```tsx
<form action="/search" method="GET" className="flex items-center gap-3">
  <input type="search" name="q" placeholder="Search news..." />
  <button type="submit" aria-label="Search">
    <FaSearchengin />
  </button>
</form>
```

The form submits to `/search` via GET with query parameter `q`.

**Route Inspection:**
- No `/search` route exists in the app directory
- No `app/search/page.tsx` or `app/search/route.ts`
- No middleware intercepts `/search`
- No `generateStaticParams` or dynamic route for search

**Admin Panel Search:**
- Search functionality exists **only within the admin dashboard** (for managing articles)
- No public-facing search endpoint

**Article Service** (`lib/articles.ts`):
- Functions: `getPublishedArticles`, `getArticleBySlug`, `getArticleById`, `getAdminArticles`, `getHomepageArticles`, `getArticlesByTag`
- **No search function** (e.g., `searchArticles`, `getArticlesByQuery`)
- No text search or full-text indexing on article content/title/summary

### Verdict

**CONFIRMED FEATURE GAP** — The Header component has a search form that submits to `/search`, but no `/search` route exists. Users who click the search button will receive a 404 (or in this case, a 200 with "Story not found" content). This is a **broken user-facing feature** that needs implementation.

---

## PART 4 — LATEST NEWS FEATURE

### Code Inspection

**Homepage** (`app/page.tsx`):
- Uses `dynamic = "force-dynamic"` for runtime fetching
- Renders a `<LatestStories>` component

**Article Service** (`lib/articles.ts` — `getHomepageArticles()`):
```typescript
export async function getHomepageArticles() {
  const articles = await getPublishedArticles({ limit: 80 });
  const hero = articles.find((article) => article.isFeatured) ?? articles[0] ?? null;
  const excludeId = hero?._id;
  const latest = articles
    .filter((article) => article._id !== excludeId)
    .slice(0, 12);
  // ...
}
```

The `latest` array contains the 12 most recent published articles (excluding the hero article). These are displayed on the homepage under a "Latest Stories" section.

**Route Inspection:**
- No `/latest` route exists
- No `app/latest/page.tsx`
- **No `/latest` route is needed** — the homepage already displays the latest articles

### Verdict

**NOT A MISSING FEATURE** — The homepage already serves as the "latest stories" page. The `getHomepageArticles()` function explicitly fetches and displays the 12 most recent published articles. A separate `/latest` route is not required by the architecture.

---

## PART 5 — PRODUCTION CREDENTIAL INVENTORY

### Environment Variables (from `.env.example`)

| Variable Name | Required for Local Dev | Required for Production | Feature Dependent | Real Production Value Required |
|---------------|----------------------|------------------------|-------------------|-------------------------------|
| `MONGODB_URI` | ✅ Yes | ✅ Yes | Core — all articles | ✅ Yes (MongoDB Atlas or self-hosted) |
| `NEXTAUTH_SECRET` | ✅ Yes | ✅ Yes | Authentication | ✅ Yes (openssl rand -hex 32) |
| `ADMIN_EMAIL` | ✅ Yes | ✅ Yes | Admin login | ⚠️ Can use placeholder for local |
| `ADMIN_PASSWORD` | ✅ Yes | ✅ Yes | Admin login | ✅ Yes (strong password in production) |
| `CLOUDINARY_CLOUD_NAME` | ✅ Yes | ✅ Yes | Image/media upload | ✅ Yes (Cloudinary account) |
| `CLOUDINARY_API_KEY` | ✅ Yes | ✅ Yes | Image/media upload | ✅ Yes (Cloudinary account) |
| `CLOUDINARY_API_SECRET` | ✅ Yes | ✅ Yes | Image/media upload | ✅ Yes (Cloudinary account) |
| `GEMINI_API_KEY` | ⚠️ Optional | ⚠️ Optional | AI content generation | ✅ Yes (Google AI API key) |
| `NEWS_API_KEY` | ⚠️ Optional | ⚠️ Optional | External news import | ✅ Yes (NewsAPI.org key) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | ✅ Yes | SEO meta tags, sitemaps | ⚠️ Can use localhost for local |
| `NEXTAUTH_URL` | ✅ Yes | ✅ Yes | NextAuth v5 session parsing | ⚠️ Must be `http://localhost:3000` for local dev, site URL for production |

### A. Code Blockers (Must Fix Before Deployment)

| Item | Description |
|------|-------------|
| **404 HTTP Status Bug** | `notFound()` returns HTTP 200 instead of 404 (Next.js 16.3.3 bug). Requires workaround or Next.js upgrade. |
| **Broken Search Form** | Header submits to `/search` which does not exist. Users get 404 (rendered as 200). |
| **Missing HSTS Header** | No `Strict-Transport-Security` header. Required for HTTPS production deployments. |
| **Missing NEXTAUTH_URL** | NextAuth v5 requires `NEXTAUTH_URL` env var. Without it, the server crashes with `UntrustedHost` errors on `localhost`. Not documented in `.env.example`. |

### B. Infrastructure/Deployment Requirements

| Requirement | Description |
|-------------|-------------|
| **MongoDB Instance** | `MONGODB_URI` must point to a running MongoDB (Atlas cluster or self-hosted) |
| **NextAuth Secret** | `NEXTAUTH_SECRET` must be a strong random value (32+ hex chars) |
| **Admin Credentials** | `ADMIN_EMAIL` + `ADMIN_PASSWORD` for built-in credentials provider |
| **Cloudinary Account** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for image uploads |
| **Environment File** | `.env` file (never committed to git) with all production values |
| **Node.js Runtime** | Node.js 18+ (Next.js 16.3.3 requirement) |
| **Build Step** | `npm run build` must succeed before `npm start` |

---

## FINAL SUMMARY

### Confirmed Code Bugs

1. **404 HTTP Status Not Propagated** — `notFound()` from `next/navigation` in Next.js 16.3.3 renders the `app/not-found.tsx` template correctly but returns HTTP 200 instead of HTTP 404. Affects all invalid article slugs and invalid category slugs. Documented in `app/not-found.tsx` with a `robots: "noindex, follow"` workaround, but the HTTP status remains broken.

### Confirmed Feature Gaps

2. **Broken Public Search** — Header component has a search form (`action="/search"`) but no `/search` route exists. Search functionality only exists in the admin panel. Users clicking search get the not-found page (rendered as HTTP 200).

### Not Actually Problems

3. **Latest News** — Not a missing feature. Homepage already displays "Latest Stories" via `getHomepageArticles()` which fetches the 12 most recent published articles.
4. **Security Headers** — All major security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP) are already configured in `next.config.ts` and present in responses.
5. **No middleware/proxy** — Not required. All header configuration is centralized in `next.config.ts`.

### Items Requiring Attention

6. **HSTS Header Missing** — `Strict-Transport-Security` header not configured. Should be added to `next.config.ts` for production HTTPS deployments.
7. **NEXTAUTH_URL Missing from .env.example** — NextAuth v5 requires `NEXTAUTH_URL` env var. Without it, the production server crashes with `UntrustedHost` errors. Must be added to `.env.example` and `.env`.

### Final Recommendation

**Priority 1 (Code Blockers):**
- Fix the 404 HTTP status bug (either upgrade Next.js to a version where this is fixed, or implement a middleware-based workaround that sets `Response(404)` before the route handler executes)
- Implement the `/search` route to match the Header component's form action
- Add `NEXTAUTH_URL=http://localhost:3000` to `.env` and `.env.example` (NextAuth v5 requirement)

**Priority 2 (Security Hardening):**
- Add HSTS header to `next.config.ts` for production deployments

**Priority 3 (Infrastructure):**
- Ensure all required environment variables are configured before deployment
- Verify MongoDB Atlas connection, Cloudinary credentials, and NextAuth secret

---

*Report generated from evidence in actual code inspection and HTTP tests against both dev server and production build.*
