# VIDARBHA PRINT CMS — Architecture Document

## 1. Overview

VIDARBHA PRINT CMS is an AI-powered News Content Management System built on the App Router edition of Next.js. It follows a layered architecture with thin API routes, a dedicated service layer for business logic, reusable React components, and MongoDB as the persistence layer.

The system is designed for regional newsrooms that need a reliable, fast, and extensible platform for managing editorial workflows — from article creation and categorization to breaking news flags and featured placements.

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser (User)                  │
└──────────────────────┬──────────────────────────┘
                       │ HTTP / Fetch
                       ▼
┌─────────────────────────────────────────────────┐
│              Next.js App Router                  │
│  ┌─────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Pages (SSR) │  │ API Routes │  │  Static  │ │
│  │  (React)     │  │ (Thin)     │  │  Assets  │ │
│  └──────┬───────┘  └─────┬──────┘  └──────────┘ │
└─────────┼────────────────┼───────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────┐
│              Service Layer                       │
│         lib/services/*.ts                        │
│  ┌──────────────────────────────────────────┐   │
│  │  getDashboardStats()                      │   │
│  │  getRecentArticles()                      │   │
│  │  (future: createArticle, updateArticle)   │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │ Mongoose / MongoDB Driver
                       ▼
┌─────────────────────────────────────────────────┐
│              MongoDB                             │
│         (Articles, Users, Sessions)              │
└─────────────────────────────────────────────────┘
```

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15+ (App Router) | Full-stack React framework with SSR, routing, and API routes |
| **Language** | TypeScript | Type-safe development across frontend and backend |
| **Database** | MongoDB + Mongoose | Document storage with schema validation and model layer |
| **Authentication** | NextAuth (Auth.js) | Session-based auth with provider support |
| **Media** | Cloudinary | Image upload, optimization, and delivery |
| **AI** | Google Gemini | Article generation, summarization, and metadata assistance |
| **Styling** | TailwindCSS | Utility-first CSS for consistent, responsive UI |
| **Icons** | react-icons / fa6 | Icon library for UI elements |

## 4. Frontend Architecture

### Rendering Strategy

- **Server Components** are the default. Pages and layouts render on the server, reducing client-side JavaScript.
- **Client Components** (`"use client"`) are used only when interactivity is required — state management, event handlers, browser APIs, or client-side data fetching.

### Component Design

- Components are **small and focused** — a card, a badge, a table row, a form field.
- Components are **reusable** — they accept props and do not hardcode data sources.
- Components are **composed** — complex pages are built by composing smaller components.

### State Management

- **Server state** — fetched at render time via `async` page components or `useEffect` in client components.
- **Client state** — managed with `useState`, `useReducer`, or `useCallback` within client components.
- **No external state library** — React's built-in hooks are sufficient for the current scale.

### Key Frontend Modules

| Module | Location | Purpose |
|---|---|---|
| Pages | `app/` | Route handlers, layouts, and page components |
| Admin UI | `app/admin/` | Dashboard, article management, settings |
| Site UI | `app/` (root) | Public-facing pages — home, categories, articles |
| Components | `components/` | Reusable UI primitives and composite widgets |
| Admin Components | `components/admin/` | Dashboard cards, forms, buttons, tables |
| Editor Components | `components/editor/` | Rich text editor and content tools |

## 5. Backend Architecture

### API Routes

API routes in `app/api/` are **thin controllers**. Each route:

1. Parses the request (query params, body, headers)
2. Calls a service function from `lib/services/`
3. Returns a `NextResponse` with appropriate status and body

Routes do not contain business logic, database queries, or data transformations.

### Request Methods

| Method | Behavior |
|---|---|
| `GET` | Fetches data — lists, counts, or single resources |
| `POST` | Creates new resources |
| `PUT` | Updates existing resources |
| `DELETE` | Removes resources |

### Error Handling

- Service functions throw errors on failure.
- Route handlers catch errors and return `NextResponse.json({ success: false, message }, { status })`.
- HTTP status codes: `404` (not found), `400` (bad request), `500` (internal error).

## 6. Service Layer

The service layer in `lib/services/` is the **single source of business logic**.

### Principles

- Services connect to databases or external APIs.
- Services return plain JavaScript objects — never `NextResponse` or React components.
- Services throw errors on failure — route handlers convert them to HTTP responses.
- Services are pure and testable — they accept inputs and return outputs with no side effects beyond data access.

### Current Services

| Service | File | Purpose |
|---|---|---|
| `getDashboardStats()` | `dashboard.service.ts` | Counts articles by status, flag, and category |
| `getRecentArticles()` | `dashboard.service.ts` | Fetches latest N articles sorted by update time |

### Future Services

- `createArticle()`, `updateArticle()`, `deleteArticle()` — article CRUD operations
- `generateArticle()` — Gemini AI article generation
- `uploadImage()` — Cloudinary media upload

## 7. Authentication Flow

```
User → Login Page → NextAuth Provider → Session Cookie → Protected Route
```

1. User visits `/login` and authenticates via a supported provider.
2. NextAuth creates a session and sets an httpOnly cookie.
3. Protected routes (e.g., `/admin/*`) call `auth()` to verify the session.
4. If no session exists, the user is redirected to `/login`.
5. If valid, the page renders with access to session data.

Authentication is enforced at the **server component level** — pages check `auth()` before rendering sensitive data.

## 8. AI Integration

AI capabilities are provided by Google Gemini and accessed through API routes:

```
Frontend → /api/generate-article → Gemini API → Response
```

### Current Capabilities

- Article generation from a topic or summary
- Content summarization
- Metadata assistance (title, slug, category suggestions)

### Integration Pattern

- AI calls are wrapped in service functions for testability.
- Rate limiting and error handling are applied at the route level.
- AI-generated content is always reviewed by a human before publication.

## 9. Media Management

Media (images, thumbnails) are managed through Cloudinary:

```
Frontend → /api/upload → Cloudinary API → Image URL → MongoDB
```

### Flow

1. User uploads an image through the editor or admin form.
2. The upload route sends the file to Cloudinary.
3. Cloudinary returns a URL and metadata.
4. The URL is stored in the article document's `image` field.
5. Cloudinary's CDN delivers optimized images at request time.

### Optimization

- Images are served at the requested size via Cloudinary URL transformations.
- Lazy loading is used for image elements in the frontend.
- Placeholder elements are shown while images load.

## 10. Request Lifecycle

### Page Request (SSR)

```
Browser → Next.js Router → Server Component → connectDB() → MongoDB → Render HTML → Response
```

1. Browser requests a page URL.
2. Next.js App Router invokes the server component.
3. The component calls a service function.
4. The service connects to MongoDB (using connection pooling).
5. MongoDB returns data.
6. Next.js renders HTML and sends the response.

### API Request

```
Browser → Next.js Router → Thin Route → Service → MongoDB → NextResponse → Response
```

1. Browser sends an HTTP request to an API route.
2. The route handler parses the request.
3. The route calls a service function.
4. The service queries MongoDB or an external API.
5. The service returns a plain object.
6. The route wraps the object in a `NextResponse` and returns it.

### Client-Side Data Fetching

```
Component (useEffect) → fetch() → API Route → Service → MongoDB → setState → Re-render
```

1. A client component mounts and triggers a `useEffect`.
2. The effect calls `fetch()` against an API route.
3. The response is parsed and stored in component state.
4. React re-renders with the new data.

## 11. Folder Structure

```
news-website/
├── app/
│   ├── admin/              # Admin pages and routes
│   │   ├── page.tsx        # Dashboard page
│   │   ├── articles/       # Article management
│   │   └── news-fetcher/   # News import tools
│   ├── api/                # API routes (thin controllers)
│   │   ├── articles/       # Article CRUD endpoints
│   │   └── admin/          # Admin-specific endpoints
│   ├── category/           # Public category pages
│   ├── login/              # Login page
│   └── page.tsx            # Public home page
├── components/
│   ├── admin/              # Admin UI components
│   │   └── dashboard/      # Dashboard widgets
│   ├── editor/             # Rich text editor
│   └── site/               # Public site components
├── lib/
│   ├── mongodb.ts          # Database connection
│   ├── auth.ts             # Auth configuration
│   ├── articles.ts         # Article helpers
│   └── services/           # Service layer
│       └── dashboard.service.ts
├── models/
│   └── Article.ts          # Mongoose schema
├── public/                 # Static assets
├── docs/                   # Engineering documentation
└── services/               # (legacy / future)
```

## 12. Future Architecture

### Planned Extensions

- **Multi-language support** — i18n routing and locale-specific content models.
- **Role-based access control** — Editor, Author, Admin roles with granular permissions.
- **Collaborative editing** — Real-time co-editing with conflict resolution.
- **Analytics pipeline** — Event tracking, aggregation jobs, and a public analytics dashboard.
- **Plugin system** — Extension points for custom fields, custom publish targets, and domain-specific tools.
- **Microservices split** — Extract AI generation and media processing into separate services as scale demands.

### Scaling Considerations

- **Database** — MongoDB sharding and replica sets for high availability.
- **Caching** — Edge caching via Next.js `fetch` cache and CDN-level caching for public pages.
- **CDN** — Cloudflare or similar for static asset delivery and DDoS protection.
- **Monitoring** — Structured logging, error tracking (Sentry), and uptime monitoring.
