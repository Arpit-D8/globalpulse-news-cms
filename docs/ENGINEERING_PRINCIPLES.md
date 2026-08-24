# Engineering Principles

Guiding rules for building, maintaining, and evolving the VIDARBHA PRINT CMS codebase.

---

## 1. Thin API Routes

API route handlers are **thin controllers**. Their only responsibilities are:

- Parse incoming request data
- Delegate to a service function
- Return a `NextResponse` with the appropriate status code

**Do not** place business logic, database queries, or data transformations inside route handlers.

```typescript
// ✅ Correct
export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ❌ Wrong — business logic inside the route
export async function GET() {
  await connectDB();
  const stats = await Article.countDocuments({});
  // ...
}
```

---

## 2. Service Layer

All business logic lives in `lib/services/`. Service functions:

- Connect to databases or call external APIs
- Return plain JavaScript objects (never `NextResponse`)
- Throw errors on failure (route handlers catch and convert to responses)
- Are pure and testable — no request or response objects

```typescript
// lib/services/dashboard.service.ts
export async function getDashboardStats() {
  await connectDB();
  // ... queries
  return { totalArticles, published, drafts, breaking, featured, categories };
}
```

---

## 3. Single Responsibility Principle

Each file, component, and function should do **one thing well**.

- A React component renders a UI fragment. It does not fetch data at the module level.
- A service function performs one business operation.
- An API route handles one endpoint.
- A utility function solves one small problem.

If a file grows beyond ~100 lines, ask whether it is doing too much.

---

## 4. Component Reusability

React components should be **reusable and composable**.

- Prefer props over internal state for data that varies between usages.
- Keep components small — a card, a badge, a table row.
- Avoid coupling components to specific data sources.
- Use client components (`"use client"`) only when interactivity or browser APIs are needed.
- Server components are the default for data fetching and rendering.

---

## 5. Type Safety

TypeScript is used **everywhere**.

- Define types for all component props, API request/response shapes, and service return values.
- Prefer explicit types over `any`.
- Use `InferSchemaType` from Mongoose for database document types.
- Never suppress type errors with `@ts-ignore` or `as any` without a comment explaining why.

---

## 6. Documentation First

Before writing code for a new feature or architectural change:

- Write or update the relevant documentation file.
- For architectural decisions, create an ADR in `docs/ADR/`.
- Update `ROADMAP.md` when adding a new feature area.
- Update `API.md` when adding or changing an endpoint.

Documentation is not optional. It is part of the deliverable.

---

## 7. Small Feature Branches

Work in small, focused branches:

- One logical change per branch (e.g., "add dashboard stats API", not "add dashboard").
- Branch names should describe the change: `feat/dashboard-stats`, `fix/article-delete-404`.
- Keep branches short-lived — aim to merge within a day.
- Never push directly to `main`.

---

## 8. Code Review Workflow

All changes go through review:

1. Create a feature branch and implement the change.
2. Ensure the code compiles (`npm run build` passes).
3. Submit a pull request with a clear description of what changed and why.
4. A reviewer checks for correctness, type safety, and adherence to these principles.
5. After approval, merge to `main`.

---

## 9. Git Commit Convention

Use conventional commits for clear, searchable history:

```
<type>(<scope>): <description>

feat(admin): add dashboard statistics API
fix(api): return 404 on article delete when not found
docs: add engineering principles document
chore: create service layer for dashboard queries
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

**Rules:**

- Keep the subject line under 72 characters.
- Use the imperative mood in the description ("add" not "added").
- Reference related issues or ADRs in the body when applicable.
- Sign off commits when required.

---

## Summary

| Principle | Rule |
|---|---|
| Thin API Routes | Routes delegate to services; no business logic |
| Service Layer | Pure functions, plain objects, throw on error |
| Single Responsibility | One file, one job |
| Component Reusability | Props over state, small and composable |
| Type Safety | TypeScript everywhere, no `any` |
| Documentation First | ADRs, API docs, roadmap updated with changes |
| Small Feature Branches | One change per branch, short-lived |
| Code Review | All changes reviewed before merge |
| Git Commits | Conventional commits, clear messages |
