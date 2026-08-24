# News CMS — Backend Architecture Audit Report

**Date:** 2025-07-13
**Scope:** 25 API routes, 6 service files, 8 validation schemas, 7 error classes, 5 models, 1 middleware file, 1 auth config
**Rules:** Preserve all functionality, no file renames, no folder moves, only safe improvements, ask before breaking changes.

---

## 1. Duplicated Business Logic

### 1.1 Slug Generation (HIGH)
**Files affected:** `lib/services/author.service.ts`, `lib/services/tag.service.ts`, `lib/services/category.service.ts`

Each of the three services implements its own slug generation with uniqueness check:
- Check if slug exists via `findOne({ slug })`
- If exists, append `-2`, `-3`, etc.
- Loop until unique slug found

This is the same pattern also duplicated in `lib/articles.ts` (`getUniqueSlug`).

**Impact:** 4 copies of the same algorithm. Changing the logic requires updating 4 locations.

### 1.2 Toggle Status Endpoint (MEDIUM)
**Files affected:** `app/api/admin/categories/[id]/toggle/route.ts`, `app/api/admin/tags/[id]/toggle/route.ts`, `app/api/admin/authors/[id]/toggle/route.ts`

All three toggle endpoints are structurally identical:
- Rate limit check
- Auth check
- Call `toggle{Entity}Status(id)`
- Return `successResponse(entity)`

The only difference is the service function name.

### 1.3 Manual isActive Parsing (LOW)
**Files affected:** `app/api/admin/categories/route.ts`, `app/api/admin/authors/route.ts`

Both GET endpoints manually parse `isActive` query param:
```typescript
const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;
```
This pattern could be extracted into a shared helper.

---

## 2. Service Layer Single Responsibility Violations

### 2.1 dashboard.service.ts (MEDIUM)
**File:** `lib/services/dashboard.service.ts`

This service handles analytics aggregation, recent articles, and dashboard statistics. While related, it combines:
- Article aggregation queries
- Category/author/tag counting
- Recent articles retrieval

**Recommendation:** Split into `analytics.service.ts` (aggregations) and keep `dashboard.service.ts` thin (orchestration only).

### 2.2 article.service.ts (LOW)
**File:** `lib/services/article.service.ts`

Contains `toArticle()` and `toLeanArticle()` helpers that convert Mongoose documents to typed objects. These helpers are fine but add indirection since the services already use `.lean()` and `.select()`.

---

## 3. API Routes with Business Logic That Should Be in Services

### 3.1 news/import/route.ts (HIGH)
**File:** `app/api/news/import/route.ts`

Contains inline business logic:
- Slug generation: `article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")` — duplicated from existing slug utilities
- Duplicate detection: `Article.findOne({ slug })` — inline instead of using service
- N+1 Article.create() loop — should use `bulkWrite` or service method

**Recommendation:** Move slug generation, duplicate checking, and batch creation into `article.service.ts`.

### 3.2 news/fetch/route.ts (LOW)
**File:** `app/api/news/fetch/route.ts`

Similar to import — inline error handling with `error.message` stringification instead of using the error class system.

### 3.3 admin/categories/route.ts GET (LOW)
**File:** `app/api/admin/categories/route.ts`

Manual query param parsing for `isActive` (see 1.3 above). The parsing logic belongs in a shared helper, not in the route.

---

## 4. Missing Transaction Support

### 4.1 news/import (HIGH)
**File:** `app/api/news/import/route.ts`

The import loop uses individual `Article.create()` calls with no transaction:
- If import fails halfway, partial data is committed
- No rollback mechanism
- N+1 database queries (one per article)

**Recommendation:** Wrap in `session.startSession()` with `session.withTransaction()`.

### 4.2 category reorder (MEDIUM)
**File:** `lib/services/category.service.ts` — `reorderCategories()`

Uses `bulkWrite` which is good, but if any update fails mid-bulk, partial reorders are committed.

**Recommendation:** Wrap in a MongoDB session transaction.

### 4.3 General (MEDIUM)
No MongoDB transactions are used anywhere in the codebase. For a CMS that manages related entities (articles with categories, tags, authors), transactions are critical for data integrity.

---

## 5. Race Conditions

### 5.1 Slug Uniqueness TOCTOU (HIGH)
**Files affected:** All services with slug generation

The check-then-create pattern is vulnerable:
```typescript
const exists = await Model.findOne({ slug });  // Check
if (exists) { slug = `${base}-${counter}`; }   // TOCTOU window
await Model.create({ slug });                   // Create
```

Two concurrent requests with the same slug can both pass the check and one will fail with a unique index violation (unhandled).

**Mitigation:** The MongoDB unique index will catch duplicates, but the error is not handled gracefully — it will throw an unhandled exception.

### 5.2 Rate Limiter (MEDIUM)
**File:** `lib/rate-limiter.ts`

The in-memory rate limiter uses a non-atomic read-modify-write:
```typescript
const recentEntries = entries.filter(...);
if (recentEntries.length >= config.max) { ... }
recentEntries.push(now);
this.stores.set(key, recentEntries);
```

In a multi-instance deployment (Vercel edge), each instance has its own memory, making rate limiting ineffective. The comment in the file already documents this.

---

## 6. Improper Async Handling

### 6.1 No await on Promise.all where appropriate (LOW)
**File:** `lib/services/category.service.ts` — `listCategories()`

Uses `Promise.all` correctly for pagination queries. However, `lib/services/dashboard.service.ts` could benefit from more parallelism in aggregation queries.

### 6.2 Unhandled Promise Rejection in news/import (HIGH)
**File:** `app/api/news/import/route.ts`

The `Article.create()` inside the for loop can throw. While it's inside a try/catch, individual article failures are silently skipped (the loop continues), but the error is not tracked or reported.

---

## 7. Uncaught Promises

### 7.1 None Found
All async route handlers properly return Promises (either via `NextResponse` or `handleService`). No uncaught promises detected.

---

## 8. Inconsistent Error Handling

### 8.1 Mixed Error Handling Patterns (HIGH)
**Files affected:** Multiple API routes

Three distinct error handling patterns exist:

**Pattern A — handleService wrapper (preferred):**
```typescript
return handleService(async () => { ... });
```
Used by: `articles/route.ts`, `admin/articles/route.ts`, `admin/authors/*`, `admin/tags/*`, `admin/media/*`, `admin/categories/[id]/*`, `admin/dashboard/route.ts`

**Pattern B — Manual try/catch with errorResponse:**
```typescript
try { ... } catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Invalid request";
  return errorResponse(message, 400);
}
```
Used by: `admin/categories/reorder/route.ts`

**Pattern C — Manual try/catch with NextResponse.json:**
```typescript
try { ... } catch (error: any) {
  return NextResponse.json({ success: false, message: error.message }, { status: 500 });
}
```
Used by: `admin/categories/route.ts` (GET), `admin/articles/route.ts` (GET), `admin/recent-articles/route.ts`, `news/import/route.ts`, `news/fetch/route.ts`

**Recommendation:** Standardize on `handleService` everywhere. Convert Pattern B and C routes to use `handleService`.

### 8.2 errorResponse vs NextResponse.json (MEDIUM)
Pattern C returns `{ success: false, message: error.message }` while `errorResponse` returns `{ success: false, error: { message, details } }`. These inconsistent shapes force frontend consumers to handle two different error formats.

---

## 9. Inconsistent Response Formats

### 9.1 DELETE Endpoints (MEDIUM)
**Files affected:** Multiple routes

Different DELETE endpoints return different shapes:

| Route | Returns |
|-------|---------|
| `admin/articles/[id]` | `{ success: true, data: {} }` |
| `admin/categories/[id]` | `{ success: true, data: category }` (AuthorType returned) |
| `admin/tags/[id]` | `{ success: true, data: tag }` (TagType returned) |
| `admin/authors/[id]` | `{ success: true, data: author }` (AuthorType returned) |
| `admin/media/[id]` | `{ success: true, data: { success: true } }` |

**Recommendation:** Standardize DELETE to always return `{ success: true, data: {} }` or always return the deleted entity.

### 9.2 admin/recent-articles/route.ts (LOW)
Returns `{ success: true, articles }` instead of `{ success: true, data: { articles } }`. Inconsistent with all other endpoints.

---

## 10. Inconsistent Validation

### 10.1 Redundant Manual Validation (LOW)
**File:** `app/api/admin/media/[id]/route.ts` — PATCH handler

```typescript
const data = validate(mediaUpdateSchema, body);
if (!data.alt || data.alt.trim().length === 0) {
  throw new ValidationError("Alt text must be a non-empty string");
}
```
The schema `mediaUpdateSchema` already allows optional `alt`. The manual check is redundant and contradictory — the schema permits empty/missing alt, but the manual check rejects it.

### 10.2 Missing Validation in news/import (MEDIUM)
**File:** `app/api/news/import/route.ts`

No Zod validation at all. Article data from the NewsAPI provider is directly inserted into MongoDB. If the provider returns unexpected data (e.g., very long titles), it could violate Mongoose schema constraints.

### 10.3 Inconsistent Schema Usage (LOW)
**File:** `lib/validation/article.ts`

Uses `.strict().partial()` for update schema but `.strict()` (no partial) for create schema. The create schema should also allow omitting optional fields.

---

## 11. Code Duplication

### 11.1 Rate Limit + Auth Boilerplate (MEDIUM)
Every write endpoint repeats:
```typescript
const rateLimitResult = await checkRateLimit(request, "admin:write");
if (rateLimitResult) return rateLimitResult;
await requireAdmin();
```

This 2-line pattern is repeated 20+ times. Could be wrapped in an `requireAdminWithRateLimit()` helper.

### 11.2 Pagination Query Parsing (LOW)
**Files affected:** `admin/categories/route.ts`, `admin/articles/route.ts`, `admin/authors/route.ts`, `admin/media/route.ts`

All repeat:
```typescript
const page = Math.max(1, Number(searchParams.get("page")) || 1);
const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
```

### 11.3 Slug Regex (LOW)
**Files affected:** `lib/validation/article.ts`, `lib/validation/author.ts`, `lib/validation/tag.ts`

The slug regex `/^[a-z0-9]+(-[a-z0-9]+)*$/` is duplicated across 3 validation files.

---

## 12. Circular Dependencies

### 12.1 None Detected
The dependency graph is clean:
- `models/*` → no internal dependencies
- `lib/services/*` → depends on `models/*`, `lib/errors/*`, `lib/db/*`
- `lib/api/*` → depends on `lib/services/*`, `lib/errors/*`
- `app/api/*` → depends on `lib/services/*`, `lib/api/*`, `lib/auth-guard/*`, `lib/validation/*`
- `lib/auth-guard.ts` → depends on `lib/auth.ts` and `lib/errors/*`

No circular imports detected.

---

## 13. Oversized Service Files

### 13.1 article.service.ts (MEDIUM)
Estimated ~300+ lines. Handles CRUD for articles, toArticle/toLeanArticle helpers, and potentially more. Should be split into:
- `article.service.ts` — CRUD operations
- `article.conversion.ts` — toArticle/toLeanArticle helpers

### 13.2 category.service.ts (MEDIUM)
Estimated ~350+ lines. Handles CRUD, reordering, listing with pagination, and toggle. Should be split into:
- `category.service.ts` — CRUD operations
- `category.listing.ts` — listCategories, getAllCategories
- `category.reorder.ts` — reorderCategories

---

## 14. Dead Code

### 14.1 lib/articles.ts (HIGH)
**File:** `lib/articles.ts`

This file appears to be an **older implementation** of article CRUD that coexists with `lib/services/article.service.ts`. Evidence:
- Uses its own `serializeArticle()` instead of service layer `toArticle()`
- Has its own `getUniqueSlug()` (duplicated from services)
- Has its own `buildArticlePayload()` (validation logic)
- Uses `ArticleModel` directly instead of going through service abstractions

**Question:** Is this file still imported anywhere? If not, it's dead code. If yes, it should be migrated to use the service layer.

### 14.2 lib/validations/article.ts (HIGH)
**File:** `lib/validations/article.ts`

Another older validation file that coexists with `lib/validation/article.ts`. Evidence:
- Different directory (`validations` vs `validation`)
- Different schema structure (uses manual validation instead of Zod schemas)
- Contains `validateArticle()` function that does manual field-by-field validation

**Recommendation:** Delete if unused, or migrate consumers to the new `lib/validation/` directory.

### 14.3 test-news/route.ts and test-gemini/route.ts (LOW)
**Files:** `app/api/test-news/route.ts`, `app/api/test-gemini/route.ts`

Test endpoints that should not be in production. These are likely development artifacts.

---

## 15. Unused Exports

### 15.1 category.service.ts — getAllCategories (LOW)
**File:** `lib/services/category.service.ts`

`getAllCategories()` is exported but may only be used internally. Verify if the admin frontend uses the paginated `listCategories()` instead.

### 15.2 lib/types.ts (MEDIUM)
**File:** `lib/types.ts`

Contains `Category` type alias that duplicates `ArticleCategory` from `lib/types/article.ts`. Multiple type definitions for the same concept create confusion.

---

## 16. Unreachable Code

### 16.1 None Detected
All code paths appear reachable. No obviously dead branches or unreachable statements found.

---

## 17. Security Issues

### 17.1 Hardcoded Admin Credentials (CRITICAL)
**File:** `lib/auth.ts`

Admin email and password are read from environment variables but with no fallback:
```typescript
const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;
```
The `!` non-null assertion means if these env vars are not set, the app crashes at runtime. Additionally, password comparison allows plain-text matching:
```typescript
password === adminPassword || await bcrypt.compare(password, adminPassword)
```
This implies the admin password might be stored as plain text in env vars, with bcrypt as a fallback.

**Recommendation:** Always use bcrypt. Never store plain-text passwords.

### 17.2 `request as any` Type Casts (MEDIUM)
**Files affected:** `app/api/admin/media/[id]/route.ts`, `app/api/news/import/route.ts`

```typescript
const rateLimitResult = await checkRateLimit(_request as any, "admin:write");
```

The `as any` cast bypasses TypeScript's type checking. The `checkRateLimit` expects `NextRequest` but receives `Request`. This is a type safety issue.

**Recommendation:** Either:
1. Update `checkRateLimit` to accept `Request` and extract IP from `Request.headers`
2. Or cast properly: `checkRateLimit(request as unknown as NextRequest, ...)`

### 17.3 No Content-Security-Policy on API Routes (LOW)
**File:** `middleware.ts`

The middleware explicitly skips `/api/*` routes. API routes rely on individual auth guards but have no CSP headers.

### 17.4 No Rate Limiting on Critical Endpoints (MEDIUM)
**File:** `app/api/auth/[...nextauth]/route.ts`

NextAuth's credential sign-in has rate limiting configured in `ENDPOINT_CONFIGS` (`auth:signin`: 5/min) but the actual `/api/auth/[...nextauth]` route does not invoke `checkRateLimit`. The rate limit config exists but is never applied.

### 17.5 MongoDB Unique Index Violation Not Handled (MEDIUM)
**Files affected:** All services with slug generation

If two concurrent requests create the same slug, MongoDB's unique index will throw a `MongoServerError` (code 11000). This error is not caught by any service method and will propagate as an unhandled 500.

**Recommendation:** Catch `MongoServerError` with code 11000 and convert to `ConflictError`.

---

## 18. Middleware Misuse

### 18.1 None Detected
The middleware file (`middleware.ts`) is correctly configured:
- Skips `/api/*` routes
- Skips static assets
- Applies security headers (CSP, X-Frame-Options, HSTS, etc.)
- Production-only headers are properly gated

The middleware is well-implemented and follows security best practices.

---

## 19. Unnecessary Abstraction

### 19.1 toArticle/toLeanArticle Helpers (LOW)
**File:** `lib/services/article.service.ts`

The `toArticle()` and `toLeanArticle()` helpers add a conversion layer between Mongoose documents and typed objects. However:
- They only call `.lean()` and `.select()` on the query
- The conversion functions themselves just map fields
- This adds indirection without clear benefit

**Recommendation:** Keep `.lean()` and `.select()` but inline the conversion where it matters.

### 19.2 handleService Wrapper (LOW)
**File:** `lib/api/response.ts`

The `handleService` wrapper is a good pattern but is inconsistently applied (see section 8). When standardized, it eliminates the need for manual try/catch in routes.

---

## 20. Opportunities to Simplify Architecture

### 20.1 Unified CRUD Base (HIGH)
All CRUD entities (articles, authors, categories, tags, media) follow the same pattern:
- GET list → paginated, searchable
- GET by id → single entity
- POST create → validated, persisted
- PUT update → validated, persisted
- DELETE → soft/hard delete

**Recommendation:** Create a generic CRUD route generator or use a code generation approach to reduce boilerplate.

### 20.2 Centralized Query Param Parsing (MEDIUM)
**File:** `lib/api/params.ts` (does not exist)

Create a shared `parseQueryParams(request: Request)` helper that extracts page, limit, search, and isActive params consistently.

### 20.3 Unified Error Response Format (MEDIUM)
Standardize all endpoints to return:
```typescript
{
  success: boolean,
  data?: T,
  error?: { message: string, details?: Record<string, string> },
  pagination?: { page, limit, total, pages }
}
```

### 20.4 Service Layer Factory (LOW)
Create a `createService(dbUri: string)` factory that initializes all services with a shared database connection, reducing connection management complexity.

---

## Summary of Findings

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 1 | Hardcoded admin credentials |
| HIGH | 7 | Duplicated slug generation, news/import business logic, missing transactions, TOCTOU race conditions, inconsistent error handling, dead code (2 files) |
| MEDIUM | 11 | Inconsistent responses, rate limiter gaps, type safety, oversized services, unnecessary abstractions |
| LOW | 9 | Redundant validation, code duplication, unused exports |

## Priority Recommendations

1. **Delete dead code:** `lib/articles.ts` and `lib/validations/article.ts` (if unused)
2. **Standardize error handling:** Convert all routes to use `handleService`
3. **Standardize DELETE responses:** Choose one format and apply consistently
4. **Extract shared utilities:** Slug generation, query param parsing, rate-limit+auth wrapper
5. **Fix type safety:** Remove `as any` casts in rate limit calls
6. **Add MongoDB error handling:** Catch unique index violations, convert to ConflictError
7. **Secure admin auth:** Always use bcrypt, never plain-text passwords
8. **Add transactions:** For news/import and category reorder operations
