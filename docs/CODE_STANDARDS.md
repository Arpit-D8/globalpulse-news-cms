# Code Standards — VIDARBHA PRINT CMS

> **Repository:** `news-website`
>
> **Effective date:** 2025-07-13
>
> **Applies to:** All code in this repository unless explicitly exempted.
>
> **Reference:** The Categories module (`app/admin/categories/`) is the reference implementation.

This document defines the official coding standards for the VIDARBHA PRINT CMS repository. Every rule states **what** the rule is and **why** it exists. These standards exist to make the codebase predictable, reviewable, and maintainable by multiple contributors over time.

---

## Table of Contents

1. [Project Philosophy](#1-project-philosophy)
2. [File Naming Conventions](#2-file-naming-conventions)
3. [Folder Structure Rules](#3-folder-structure-rules)
4. [Import Order Standards](#4-import-order-standards)
5. [Component Standards](#5-component-standards)
6. [Hook Standards](#6-hook-standards)
7. [Service Layer Standards](#7-service-layer-standards)
8. [API Route Standards](#8-api-route-standards)
9. [Validation Standards](#9-validation-standards)
10. [Error Handling Standards](#10-error-handling-standards)
11. [TypeScript Standards](#11-typescript-standards)
12. [React Standards](#12-react-standards)
13. [Naming Conventions](#13-naming-conventions)
14. [State Management Rules](#14-state-management-rules)
15. [Async/Await Rules](#15-asyncawait-rules)
16. [API Response Format](#16-api-response-format)
17. [Logging Rules](#17-logging-rules)
18. [Documentation & JSDoc Standards](#18-documentation--jsdoc-standards)
19. [Performance Guidelines](#19-performance-guidelines)
20. [Accessibility Requirements](#20-accessibility-requirements)
21. [Code Review Checklist](#21-code-review-checklist)
22. [Pull Request Checklist](#22-pull-request-checklist)

---

## 1. Project Philosophy

### 1.1 Boring code is good code

If a developer cannot understand a module by reading the page component and the service file, the code is too clever. Prefer obvious solutions over elegant ones.

**Why:** This codebase will be maintained by multiple contributors over years. Predictability matters more than ingenuity.

### 1.2 Composition over inheritance

Do not use class hierarchies, mixins, or inheritance chains. Compose behavior from small, focused functions and components.

**Why:** Inheritance couples children to parents. Composition couples nothing. The codebase has zero class-based inheritance and should stay that way.

### 1.3 Behavior reuse over code reuse

Reuse behavior, not code. Two hooks that both call `fetch` should not be merged into a shared function unless the fetch logic itself is genuinely complex. Duplication is cheaper than a wrong abstraction.

**Why:** Shared code has a maintenance cost. It must be understood, documented, and tested by every consumer. Create shared code only when a pattern has repeated **at least twice** across **different entities**.

### 1.4 Do not abstract prematurely

Every shared abstraction must earn its place. The Categories module was the first CRUD module — it did not earn shared status by virtue of being well-written. Future modules must independently repeat the pattern before it becomes shared.

**Why:** Premature abstractions create unnecessary complexity. They lock you into design decisions before you understand the problem space.

### 1.5 Simplicity beats cleverness

A function that is 30 lines long and obvious is better than a function that is 8 lines long and requires re-reading.

**Why:** Future maintainers will thank you. Code is read far more often than it is written.

---

## 2. File Naming Conventions

### 2.1 Components

Use **PascalCase** with a descriptive suffix.

```
CategoryTable.tsx
ConfirmDialog.tsx
SearchInput.tsx
```

**Why:** PascalCase signals "this is a React component" at a glance. The suffix describes purpose.

### 2.2 Hooks

Use **PascalCase** with the `use` prefix.

```
useCategories.ts
useConfirmDialog.ts
useCreateCategory.ts
```

**Why:** React's naming convention for hooks. The `use` prefix makes it impossible to forget when calling hooks (React lint rules enforce this).

### 2.3 Services

Use **camelCase** with the `.service.ts` suffix.

```
category.service.ts
dashboard.service.ts
```

**Why:** The `.service.ts` suffix distinguishes service files from client code, API routes, and utilities.

### 2.4 Types and Validations

Use the **entity name only** (lowercase).

```
lib/types/category.ts
lib/validations/category.ts
```

**Why:** The directory already conveys the purpose. The filename needs only the entity name.

### 2.5 API Routes

Always named **`route.ts`**. Directories use **kebab-case**.

```
app/api/admin/categories/route.ts
app/api/admin/categories/[id]/route.ts
app/api/admin/categories/[id]/toggle/route.ts
```

**Why:** `route.ts` is the Next.js convention. Kebab-case directories match URL slugs.

### 2.6 Models

Use **PascalCase**, singular.

```
models/Category.ts
models/Article.ts
```

**Why:** Mongoose models represent singular domain entities. PascalCase matches the TypeScript type.

### 2.7 Utility Files

Use **lowercase** with optional hyphens.

```
lib/slug.ts
lib/mongodb.ts
lib/constants.ts
```

**Why:** Utility files are generic — no entity context needed.

### 2.8 Error Classes

Use **PascalCase** with a descriptive name.

```
lib/errors/AppError.ts
lib/errors/ValidationError.ts
lib/errors/NotFoundError.ts
```

**Why:** They are classes. PascalCase signals this.

---

## 3. Folder Structure Rules

### 3.1 One module per entity

Every CRUD entity gets its own directory under each layer:

```
app/admin/categories/        # Page + API routes
lib/api/categoryClient.ts    # Client API wrapper
lib/services/category.service.ts  # Business logic
lib/validations/category.ts  # Validation
lib/types/category.ts        # Types
lib/hooks/useCategories.ts   # Hooks
components/admin/categories/ # Components
models/Category.ts           # Mongoose model
```

**Why:** Co-locating all entity-related code makes it impossible to miss a file when copying or deleting a module.

### 3.2 Shared code lives in `shared/` directories

Components shared across entities go in `components/admin/shared/`. Hooks shared across entities go in `lib/hooks/` with a shared name (not entity-prefixed).

**Why:** Shared code must be discoverable. A single `shared/` directory per layer prevents duplication.

### 3.3 No barrel files

Do not create `index.ts` files for re-exporting. Import by full file path.

```typescript
// ✅ Good
import { getAllCategories } from "@/lib/services/category.service";

// ❌ Bad
import { getAllCategories } from "@/lib/services";
```

**Why:** Barrel files break renaming. Tools like ESLint and bundlers cannot trace imports through re-exports. The extra typing cost is negligible.

### 3.4 Models live in root `models/`

Mongoose models are shared resources. They live in the root `models/` directory, not alongside their entity module.

**Why:** A model may be used by multiple services, routes, and hooks. Co-locating it with one entity would create circular dependencies.

---

## 4. Import Order Standards

Imports must follow this order, separated by blank lines:

1. **`"use client"` directive** (if present) — always first, no blank line before it
2. **React / framework imports**
3. **`@/` alias imports** (grouped by sub-path)
4. **Third-party imports**
5. **Relative imports**

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Category } from "@/lib/types/category";
import { categoryClient } from "@/lib/api/categoryClient";
import { useCategories } from "@/lib/hooks/useCategories";

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { CategoryRow } from "./CategoryRow";
import { EmptyState } from "@/components/admin/shared/EmptyState";
```

**Why:** Developers scan imports to understand a file's dependencies. A consistent order means every developer looks in the same place.

---

## 5. Component Standards

### 5.1 Function components only

Do not use class components. Do not use `React.createClass`.

```typescript
// ✅ Good
export function CategoryTable({ categories, onEdit }: CategoryTableProps) {
  return <table>...</table>;
}

// ❌ Bad
class CategoryTable extends React.Component { ... }
```

**Why:** Function components with hooks are simpler, shorter, and the only pattern supported in React Server Components.

### 5.2 Props types use `type`, not `interface`

```typescript
type CategoryTableProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggle: (category: Category) => void;
};
```

**Why:** `type` is consistent with the rest of the codebase. `interface` and `type` are functionally equivalent for objects, but consistency reduces cognitive load.

### 5.3 `"use client"` placement

The `"use client"` directive must be the **very first line** of the file. No imports, no comments, no blank lines before it.

```typescript
"use client";

import { useState } from "react";
```

**Why:** Next.js parses this directive at the top of the file. Anything before it will cause the directive to be ignored.

### 5.4 Components are declarative

Components receive data and callbacks via props. They do not contain side effects. Side effects live in hooks.

```typescript
// ✅ Good — component just renders
export function CategoryRow({ category, onEdit }: CategoryRowProps) {
  return <tr>...</tr>;
}

// ❌ Bad — component fetches data
export function CategoryRow({ category }: CategoryRowProps) {
  const [articleCount, setArticleCount] = useState(0);
  useEffect(() => {
    fetch(`/api/admin/categories/${category._id}/articles`).then(r => r.json()).then(d => setArticleCount(d.count));
  }, [category._id]);
  return <tr>...</tr>;
}
```

**Why:** Separation of concerns. Components render. Hooks manage state and side effects. Mixing them makes components hard to test and hard to reuse.

### 5.5 No inline styles

Use Tailwind CSS classes. Do not use inline `style` objects or CSS-in-JS.

```typescript
// ✅ Good
<div className="flex items-center gap-2 text-red-700">

// ❌ Bad
<div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c" }}>
```

**Why:** Tailwind is the only CSS system in this project. Mixing systems creates inconsistency and bundle bloat.

### 5.6 Accessibility is mandatory

Every interactive element must have an `aria-label` or associated `<label>`. Modals must have `aria-modal="true"` and `role="dialog"`.

```typescript
// ✅ Good
<button aria-label="Delete category" onClick={onDelete}>
<label htmlFor="category-name">Category Name</label>
<input id="category-name" />

// ❌ Bad
<button onClick={onDelete}>
<input />
```

**Why:** Accessibility is not optional. Screen reader users depend on proper ARIA attributes. Legal compliance (WCAG) is also a concern.

---

## 6. Hook Standards

### 6.1 Hook naming

Use **PascalCase** with the `use` prefix.

```typescript
export function useCategories() { ... }
export function useCategoryMutations() { ... }
export function useConfirmDialog<T = unknown>() { ... }
```

**Why:** React's hook naming convention. ESLint enforces the `use` prefix.

### 6.2 Client hooks must start with `"use client"`

```typescript
"use client";

import { useState } from "react";

export function useCategories() { ... }
```

**Why:** Client hooks use browser APIs (`useState`, `useEffect`, `fetch`). They cannot run on the server.

### 6.3 Return plain objects

Hooks return plain objects with named properties. Do not return tuples.

```typescript
// ✅ Good
return {
  categories: filteredCategories,
  loading,
  error,
  refresh: fetchCategories,
};

// ❌ Bad
return [categories, loading, error, fetchCategories];
```

**Why:** Named properties are self-documenting. Destructuring is explicit: `const { categories, loading } = useCategories()`.

### 6.4 Wrap callbacks in `useCallback`

Every callback returned by a hook must be wrapped in `useCallback` with an explicit dependency array.

```typescript
const refresh = useCallback(() => {
  fetchCategories().then(...).catch(...);
}, []);
```

**Why:** Without `useCallback`, the callback is recreated on every render, which breaks `useEffect` dependency checks and causes unnecessary re-renders.

### 6.5 Generic hooks must default their type parameter

```typescript
export function useConfirmDialog<T = unknown>() { ... }
```

**Why:** Callers can omit the type argument: `const dialog = useConfirmDialog()`. Without the default, the caller must always write `useConfirmDialog<SomeType>()`.

### 6.6 Do not put hooks inside components

Hooks live in `lib/hooks/`. Components consume hooks via props.

**Why:** Hooks must be called at the top level of a component (or another hook). Putting a hook definition inside a component violates React's rules of hooks.

---

## 7. Service Layer Standards

### 7.1 Export named functions

Do not export classes. Do not export default. Export named async functions.

```typescript
// ✅ Good
export async function createCategory(input: Record<string, unknown>) { ... }
export async function getAllCategories(filter?: { isActive?: boolean }) { ... }

// ❌ Bad
export default class CategoryService { ... }
export const categoryService = { create: async () => { ... } };
```

**Why:** Named functions are tree-shakeable, testable, and easy to import selectively.

### 7.2 Every function calls `await connectDB()`

Each service function is responsible for its own database connection.

```typescript
export async function getCategoryById(id: string) {
  await connectDB();
  const category = await Category.findById(id).lean();
  return category as unknown as Category | null;
}
```

**Why:** No connection pooling abstraction exists. Each function is independent and testable in isolation.

### 7.3 Use `.lean()` for all reads

```typescript
const categories = await Category.find(filter).lean();
```

**Why:** `.lean()` returns plain JavaScript objects. Mongoose documents carry overhead (change tracking, getters, setters) that is unnecessary for read-only operations.

### 7.4 Soft delete, never hard delete

Set `isActive: false`. Do not remove the document.

```typescript
export async function deleteCategory(id: string) {
  await connectDB();
  const updated = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).lean();
  return updated as unknown as Category;
}
```

**Why:** Soft deletes preserve data integrity. Articles tagged with a deleted category should not break. Soft deletes can be reversed.

### 7.5 Validation in the service layer, not in routes

Routes delegate to the service. The service validates input.

```typescript
// ✅ Good — service validates
export async function createCategory(input: Record<string, unknown>) {
  const validation = validateCategoryInput(input);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }
  // ...
}

// ❌ Bad — route validates
export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.name) { return apiError("Name is required", 400); }
  // ...
}
```

**Why:** The service layer is the single source of truth. If routes validate, rules can drift between routes.

### 7.6 Use `Record<string, unknown>` for input parameters

```typescript
export async function createCategory(input: Record<string, unknown>): Promise<CategoryCreateInput> { ... }
```

**Why:** The service receives raw data from the API route. `Record<string, unknown>` accurately represents untrusted input. Validation narrows the type inside the function.

### 7.7 Helper functions stay local

Helper functions like `throwNotFound` are defined inside the service file and are not exported.

```typescript
function throwNotFound(id: string): never {
  throw new Error(`Category with id ${id} not found`);
}
```

**Why:** Helpers are implementation details. Exporting them couples them to callers who should not depend on them.

---

## 8. API Route Standards

### 8.1 Thin routes

Routes are dispatchers. They parse input, delegate to the service, and wrap the result. No business logic belongs in routes.

```typescript
// ✅ Good — thin route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await createCategory(body);
    return apiSuccess(category, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return apiError(message, 500);
  }
}

// ❌ Bad — fat route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) { return apiError("Name is required", 400); }
    if (body.name.length < 2) { return apiError("Name too short", 400); }
    // ... more validation ...
    const category = await Category.create(body);
    return apiSuccess(category, 201);
  } catch (error: unknown) { ... }
}
```

**Why:** Fat routes duplicate validation logic, make routes hard to test, and create inconsistency when multiple routes validate the same data.

### 8.2 Manual try/catch in each route

Do not use the `apiHandler` wrapper (it exists but is not adopted). Write explicit try/catch blocks.

```typescript
export async function GET() {
  try {
    const data = await getServiceData();
    return apiSuccess(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return apiError(message, 500);
  }
}
```

**Why:** Explicit try/catch is easier to debug. The error handling is visible in the route file. The `apiHandler` abstraction hides this logic.

### 8.3 Use `error: unknown`, not `error: any`

```typescript
// ✅ Good
catch (error: unknown) {

// ❌ Bad
catch (error: any) {
```

**Why:** `unknown` forces proper type checking (`error instanceof Error`). `any` disables type checking and hides bugs.

### 8.4 Next.js 15 params are promises

Always `await params`.

```typescript
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

**Why:** Next.js 13+ makes `params` a promise. Forgetting `await` produces a string that looks like `[object Promise]`.

### 8.5 Prefix unused parameters with `_`

```typescript
export async function GET(_request: NextRequest, { params }: { ... }) {
```

**Why:** Signals intentional non-use. Prevents ESLint `no-unused-vars` warnings.

### 8.6 POST returns 201

```typescript
return apiSuccess(category, 201);
```

**Why:** HTTP 201 Created is the correct status for a newly created resource.

---

## 9. Validation Standards

### 9.1 Hand-rolled validation only

Do not use Zod, Joi, Yup, or any external validation library. Use plain TypeScript functions with `if` statements.

```typescript
export function validateCategoryInput(
  input: Record<string, unknown>
): CategoryValidationResult {
  const errors: Record<string, string> = {};

  const name = input.name;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Category name is required";
  } else if (name.trim().length < 2) {
    errors.name = "Category name must be at least 2 characters";
  } else if (name.trim().length > 50) {
    errors.name = "Category name must be at most 50 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { name: String(name).trim(), ... } };
}
```

**Why:** The codebase has no validation library dependency. Hand-rolled validation is transparent, debuggable, and has zero runtime overhead. Adding Zod would introduce a new dependency with no clear benefit.

### 9.2 Return discriminated unions

```typescript
type CategoryValidationResult =
  | { success: true; data: CategoryCreateInput }
  | { success: false; errors: Record<string, string> };
```

**Why:** Discriminated unions are type-safe. Callers must check `success` before accessing `data`. TypeScript prevents the wrong path.

### 9.3 Trim all string inputs

```typescript
const trimmedName = String(name).trim();
```

**Why:** Users accidentally type leading/trailing spaces. Trimming prevents dirty data in the database.

### 9.4 Provide sensible defaults

```typescript
isActive: input.isActive !== false,  // defaults to true
displayOrder: input.displayOrder ?? 0,  // defaults to 0
```

**Why:** Forms may not send every field. Defaults prevent `undefined` values from reaching the database.

### 9.5 Auto-generate derived fields

Generate slugs, timestamps, and other derived values during validation.

```typescript
const data: CategoryCreateInput = {
  name: trimmedName,
  slug: generateSlug(trimmedName),
  // ...
};
```

**Why:** The caller should not be responsible for generating slugs. Validation is the right place because it is the boundary between untrusted input and trusted data.

---

## 10. Error Handling Standards

### 10.1 Throw plain `Error` objects

Do not use the `AppError` class hierarchy (it exists but is not adopted). Throw plain `Error` with descriptive messages.

```typescript
// ✅ Good
throw new Error(`Category with id ${id} not found`);
throw new Error(`Validation failed: ${JSON.stringify(errors)}`);

// ❌ Bad
throw new NotFoundError(`Category with id ${id} not found`);
```

**Why:** The service layer throws plain `Error` objects. Routes catch them with `error instanceof Error`. The `AppError` hierarchy is dead code — do not add to it.

### 10.2 Consistent error message format

Not found errors follow this pattern:

```typescript
`${Entity} with id ${id} not found`
```

**Why:** Consistent messages make logs searchable. A grep for `"not found"` catches all not-found errors.

### 10.3 Route-level error handling

Always use the `error instanceof Error` check:

```typescript
catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Internal Server Error";
  return apiError(message, 500);
}
```

**Why:** `error` in a catch block can be anything (a string, a number, an object). The `instanceof` check prevents `.message` from returning `undefined`.

### 10.4 Client API errors attach `statusCode`

```typescript
const err = new Error(json.message ?? "Failed to fetch");
(err as any).statusCode = res.status;
throw err;
```

**Why:** The client needs the HTTP status code to decide how to handle the error (e.g., 409 = conflict, 404 = not found).

---

## 11. TypeScript Standards

### 11.1 Strict mode is mandatory

The `tsconfig.json` has `strict: true`. Do not disable it. Do not use `@ts-ignore` or `@ts-nocheck`.

**Why:** Strict mode catches bugs at compile time. Disabling it for one file weakens the entire project.

### 11.2 Use `type`, not `interface`

```typescript
// ✅ Good
export type Category = {
  _id: string;
  name: string;
};

// ❌ Bad
export interface Category {
  _id: string;
  name: string;
}
```

**Why:** `type` and `interface` are functionally equivalent for object shapes. `type` is more flexible (can express unions, intersections, mappers). Consistency matters.

### 11.3 Use `import type` for type-only imports

```typescript
import type { Category } from "@/lib/types/category";
```

**Why:** `import type` is erased at compile time. It prevents circular import errors and makes intent explicit.

### 11.4 Use `unknown`, not `any`

```typescript
// ✅ Good
const error: unknown = new Error("boom");

// ❌ Bad
const error: any = new Error("boom");
```

**Why:** `unknown` is type-safe. You must check the type before using it. `any` disables all type checking.

### 11.5 Double-cast after `.lean()` is acceptable

```typescript
return entities as unknown as Category[];
```

**Why:** `.lean()` returns `Omit<hydratedDocument, ...>` which is not assignable to the plain `Category` type. The double-cast is a necessary evil. This is the only place in the codebase where double-casting is acceptable.

### 11.6 Use `Omit` and `Partial` for derived types

```typescript
export type CategoryCreateInput = Omit<Category, "_id" | "createdAt" | "updatedAt">;
export type CategoryUpdateInput = Partial<Omit<CategoryCreateInput, "slug">> & { slug?: string };
```

**Why:** Derived types stay in sync with the base type. If `Category` gains a field, `Omit` automatically excludes it from the input type.

### 11.7 Use `never` for throw helpers

```typescript
function throwNotFound(id: string): never {
  throw new Error(`Category with id ${id} not found`);
}
```

**Why:** `never` tells TypeScript that this function never returns normally. After calling `throwNotFound()`, TypeScript treats the code as unreachable.

---

## 12. React Standards

### 12.1 Functional components only

No class components. No `React.createClass`.

**Why:** Class components are deprecated. They do not support hooks, do not work with Server Components, and add unnecessary boilerplate.

### 12.2 JSX uses `react-jsx` runtime

The `tsconfig.json` sets `"jsx": "react-jsx"`. Do not import `React` solely for JSX.

```typescript
// ✅ Good
export function CategoryTable({ categories }: CategoryTableProps) {
  return <div>{categories.length}</div>;
}

// ❌ Bad — unnecessary import
import React from "react";
export function CategoryTable({ categories }: CategoryTableProps) {
  return <div>{categories.length}</div>;
}
```

**Why:** The `react-jsx` runtime eliminates the need for `import React`. It is configured in `tsconfig.json`.

### 12.3 Keys in lists must be stable

Use database IDs, not array indices, as keys.

```typescript
// ✅ Good
{categories.map(category => (
  <CategoryRow key={category._id} category={category} />
))}

// ❌ Bad
{categories.map((category, index) => (
  <CategoryRow key={index} category={category} />
))}
```

**Why:** Array indices change when items are reordered or deleted. Using them as keys causes React to re-render the wrong elements.

### 12.4 Conditional rendering

Use `&&` for boolean checks. Use ternaries for value selection. Use early returns for empty states.

```typescript
// ✅ Good — early return for empty state
if (!categories.length) {
  return <EmptyState title="No categories" message="Create your first category" />;
}

// ✅ Good — boolean check
{isActive && <StatusBadge active={isActive} />}

// ✅ Good — ternary
return loading ? <LoadingState /> : <CategoryTable />;

// ❌ Bad — truthy check on number
{categories.length && <span>{categories.length} categories</span>}
```

**Why:** `count && component` renders the number when count > 0. Use `count > 0 && component` or a ternary instead.

### 12.5 Form handling

Use uncontrolled forms where possible. Use `htmlFor` on labels. Use `noValidate` to disable browser validation (hand-rolled validation is used instead).

```typescript
<form noValidate onSubmit={handleSubmit}>
  <label htmlFor="category-name">Category Name</label>
  <input id="category-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
  {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
</form>
```

**Why:** `noValidate` suppresses the native browser tooltip (which does not match the app's design). Hand-rolled errors are styled consistently.

---

## 13. Naming Conventions

### 13.1 Variables and functions

Use **camelCase**.

```typescript
const categoryList = [];
function getCategoryById(id: string) { ... }
```

**Why:** camelCase is the JavaScript standard. It signals "this is a variable or function."

### 13.2 Types and interfaces

Use **PascalCase**.

```typescript
type Category = { ... };
type CategoryTableProps = { ... };
```

**Why:** PascalCase signals "this is a type." It matches the component naming convention.

### 13.3 Hooks

Use **PascalCase** with the `use` prefix.

```typescript
function useCategories() { ... }
function useConfirmDialog<T = unknown>() { ... }
```

**Why:** React convention. ESLint enforces the `use` prefix.

### 13.4 Boolean variables

Use descriptive prefixes: `is`, `has`, `has`, `should`, `can`.

```typescript
const isActive = true;
const hasError = false;
const shouldRender = true;
```

**Why:** Booleans are verbs. The prefix makes the intent obvious at the call site.

### 13.5 Callbacks

Use the `handle` prefix for event handlers passed as props.

```typescript
const handleEdit = (category: Category) => { ... };
const handleDelete = () => { ... };
```

**Why:** The `handle` prefix signals "this is an event handler, not a business logic function."

### 13.6 Pluralization

Singular for single entities, plural for lists.

```typescript
const category = await getCategoryById(id);
const categories = await getAllCategories();
```

**Why:** The variable name conveys the shape of the data. No need to check the type.

---

## 14. State Management Rules

### 14.1 No global state

Do not use Redux, Zustand, Context, or any global state library. All state is hook-local or page-local.

**Why:** Global state adds complexity that this CMS does not need. The admin panel is small. Hook-local state is easier to debug and refactor.

### 14.2 No React Context

Do not use `useContext` or `createContext`. Pass data via props and callbacks.

**Why:** Context creates invisible data flow. Props make dependencies explicit. For this codebase, the prop drilling depth is shallow enough that context adds cost without benefit.

### 14.3 Loading and error state live in hooks

Each hook manages its own `loading` and `error` state.

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Why:** Loading and error states are tied to the data-fetching lifecycle. Co-locating them with the data makes the hook self-contained.

### 14.4 Modal state lives in the page component

Modal open/close state and the currently editing entity live in the page component, not in hooks.

```typescript
const [modalOpen, setModalOpen] = useState(false);
const [editingCategory, setEditingCategory] = useState<Category | null>(null);
```

**Why:** The page component orchestrates hooks and components. Modal state is page-specific, not reusable across pages.

### 14.5 Optimistic updates happen in the page component

Optimistic updates are managed in the page component using helpers from the data hook.

```typescript
const handleToggle = useCallback(async (category: Category) => {
  const newStatus = !category.isActive;
  updateLocalCategory(category._id, { isActive: newStatus });
  try {
    await toggleMutation(category._id);
  } catch {
    updateLocalCategory(category._id, { isActive: !newStatus });
  }
}, [toggleMutation, updateLocalCategory]);
```

**Why:** The page component owns the user interaction. The hook provides helpers; the page decides when to use them.

---

## 15. Async/Await Rules

### 15.1 Use `async/await`, not `.then()`

```typescript
// ✅ Good
const data = await fetch("/api/data").then(r => r.json());

// ❌ Bad
fetch("/api/data").then(r => r.json()).then(data => { ... });
```

**Why:** `async/await` is easier to read, easier to debug (stack traces are clearer), and integrates naturally with `try/catch`.

### 15.2 Always `await` params in routes

```typescript
const { id } = await params;
```

**Why:** Next.js 13+ makes `params` a promise. Forgetting `await` produces `[object Promise]`.

### 15.3 Use `Promise.all` for parallel queries

```typescript
const [total, published, drafts] = await Promise.all([
  Article.countDocuments({}),
  Article.countDocuments({ status: "published" }),
  Article.countDocuments({ status: "draft" }),
]);
```

**Why:** Parallel queries are faster than sequential ones. `Promise.all` waits for all to complete or fails fast on the first error.

### 15.4 Do not fire-and-forget without handling

Every `await` must be in a `try/catch` or chained with `.catch()`.

```typescript
// ✅ Good
try {
  await deleteCategory(id);
} catch (error) {
  setError(error instanceof Error ? error.message : "Delete failed");
}

// ❌ Bad — unhandled promise rejection
await deleteCategory(id);
```

**Why:** Unhandled promise rejections cause runtime errors and data corruption.

---

## 16. API Response Format

### 16.1 Success responses

```typescript
{
  "success": true,
  "data": { ... }
}
```

### 16.2 Error responses

```typescript
{
  "success": false,
  "message": "Category not found"
}
```

### 16.3 Use `apiSuccess` and `apiError` helpers

```typescript
import { apiSuccess, apiError } from "@/lib/api-response";

return apiSuccess(categories);
return apiError("Category not found", 404);
```

**Why:** Consistent response shapes make client-side parsing predictable. The helpers eliminate boilerplate.

### 16.4 Client API checks `json.success`

Every client API method must check `json.success` before using `json.data`.

```typescript
const json = await res.json();
if (!json.success) {
  throw new Error(json.message ?? "Request failed");
}
return json.data;
```

**Why:** `json.success` is the discriminator between success and error responses. Skipping the check means error messages are silently ignored.

---

## 17. Logging Rules

### 17.1 No `console.log` in production code

Do not leave `console.log` statements in the codebase. Use `console.error` for errors only.

**Why:** `console.log` pollutes the browser console and the server console. It is a debugging artifact, not a production logging mechanism.

### 17.2 `console.error` for unexpected errors

```typescript
console.error("[apiHandler] Unexpected error:", error);
```

**Why:** `console.error` is visible in the browser console (red text) and can be captured by error monitoring tools.

### 17.3 No structured logging library

Do not add Winston, Pino, or any logging library. The codebase is small enough that `console.error` is sufficient.

**Why:** Logging libraries add dependencies, configuration, and operational complexity. This CMS does not have the scale to justify them.

---

## 18. Documentation & JSDoc Standards

### 18.1 JSDoc for public functions

Exported functions in service files and shared hooks should have JSDoc comments.

```typescript
/**
 * Create a new category.
 *
 * @param input - Raw category input (validated inside this function).
 * @returns The created category.
 * @throws Error if validation fails or the category already exists.
 */
export async function createCategory(input: Record<string, unknown>): Promise<CategoryCreateInput> {
```

**Why:** JSDoc provides inline documentation that IDEs surface on hover. It is the first thing a developer sees when importing the function.

### 18.2 JSDoc for shared hooks

```typescript
/**
 * Generic confirm-dialog state machine.
 *
 * Manages open/close, target entity, and loading state so that calling
 * components do not need to juggle four separate useState calls.
 *
 * @typeParam T - The type of the entity being confirmed on deletion.
 */
export function useConfirmDialog<T = unknown>() {
```

**Why:** Shared hooks are consumed by multiple modules. JSDoc explains the contract without requiring a separate documentation file.

### 18.3 No JSDoc for private helpers

Local helper functions (e.g., `throwNotFound`) do not need JSDoc. Their name and usage make their purpose obvious.

**Why:** Over-documentation creates noise. JSDoc is for public APIs, not implementation details.

### 18.4 Doc comments over code comments

Prefer JSDoc (`/** ... */`) over inline comments (`//`) for documenting function contracts. Use inline comments only for explaining **why**, not **what**.

```typescript
// ✅ Good — explains why
// Revert on failure — refetch to restore accurate state
refresh();

// ❌ Bad — explains what (the code already says this)
// Call refresh
refresh();
```

**Why:** "What" is in the code. "Why" is not. Comments should fill the gap between what the code does and why it does it.

---

## 19. Performance Guidelines

### 19.1 Use `.lean()` for all reads

```typescript
const categories = await Category.find({}).lean();
```

**Why:** `.lean()` returns plain objects. Mongoose documents carry overhead (change tracking, getters, setters) that is unnecessary for read-only operations.

### 19.2 Fetch all data in the hook, filter client-side

The `useCategories` hook fetches all categories and filters client-side. Do not add server-side pagination unless the entity has >100 items.

**Why:** The admin panel is small. Server-side pagination adds complexity (page state, total count, skip/limit parameters) that is not needed for <100 items.

### 19.3 Use `useCallback` for callbacks passed to components

```typescript
const handleEdit = useCallback((category: Category) => {
  setEditingCategory(category);
  setModalOpen(true);
}, []);
```

**Why:** Without `useCallback`, the callback is recreated on every render, which causes child components to re-render unnecessarily.

### 19.4 Use `useMemo` for expensive computations

```typescript
const sortedCategories = useMemo(() => {
  return [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
}, [categories]);
```

**Why:** Sorting an array is cheap. But if the computation involves mapping, filtering, and formatting a large dataset, `useMemo` prevents redundant work.

### 19.5 Do not optimize prematurely

Measure first. If there is no performance problem, do not add `useMemo`, `useCallback`, or lazy loading.

**Why:** Premature optimization adds complexity without benefit. Optimize when you have data (slow render, high CPU, slow network), not when you have a hunch.

---

## 20. Accessibility Requirements

### 20.1 Every interactive element must be keyboard-accessible

Buttons must be `<button>`, not `<div onClick>`. Inputs must have associated `<label>` elements.

```typescript
// ✅ Good
<button onClick={onDelete}>Delete</button>
<label htmlFor="category-name">Name</label>
<input id="category-name" />

// ❌ Bad
<div onClick={onDelete}>Delete</div>
<input />
```

**Why:** Keyboard users cannot click. Screen reader users cannot see visual cues. Accessibility is not a feature — it is a requirement.

### 20.2 Modals must have ARIA attributes

```typescript
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Create Category</h2>
```

**Why:** `role="dialog"` tells screen readers that this is a dialog. `aria-modal="true"` announces that focus is trapped inside. `aria-labelledby` connects the dialog to its title.

### 20.3 Escape key must close modals

Modals must close when the user presses Escape.

**Why:** Escape is the universal "dismiss" key. Users expect it to work consistently.

### 20.4 Click-outside must close modals

Clicking outside the modal backdrop must close the modal.

**Why:** Users expect to dismiss dialogs by clicking away. It is a standard UX pattern.

### 20.5 Color is not the only signal

Do not use color alone to convey meaning. Always pair color with an icon, text, or shape.

```typescript
// ✅ Good
<span className="text-green-600 font-bold">✓ Active</span>

// ❌ Bad
<span className="text-green-600">●</span>
```

**Why:** Color-blind users cannot distinguish color-only signals. Pair color with text or icons.

---

## 21. Code Review Checklist

Reviewers should verify these items:

### Structure
- [ ] File is in the correct directory (following the folder structure rules)
- [ ] File naming follows conventions (PascalCase for components, camelCase for hooks/services)
- [ ] No barrel files created (`index.ts` re-exports)
- [ ] No duplicated shared components (check `components/admin/shared/` first)

### TypeScript
- [ ] No `any` types (except double-cast after `.lean()`)
- [ ] Uses `type`, not `interface`
- [ ] Uses `import type` for type-only imports
- [ ] Uses `unknown`, not `any`, for error types
- [ ] All props have interface types
- [ ] All hooks return typed objects

### Components
- [ ] Function component (no class components)
- [ ] `"use client"` is the first line (if present)
- [ ] Props types use `type`
- [ ] No inline styles (Tailwind only)
- [ ] `aria-label` on interactive elements
- [ ] `aria-modal="true"` and `role="dialog"` on modals
- [ ] Labels have `htmlFor` matching input `id`
- [ ] No `console.log` statements

### Hooks
- [ ] PascalCase with `use` prefix
- [ ] `"use client"` at the top (if client hook)
- [ ] Returns plain object (not tuple)
- [ ] All callbacks wrapped in `useCallback`
- [ ] Generic hooks default their type parameter (`T = unknown`)

### Service Layer
- [ ] Named async functions (no classes, no defaults)
- [ ] Calls `await connectDB()` at the top
- [ ] Uses `.lean()` for reads
- [ ] Soft delete (sets `isActive: false`)
- [ ] Validation in service, not in routes
- [ ] Local helper functions (not exported)

### API Routes
- [ ] Thin route (delegates to service, no business logic)
- [ ] Manual try/catch (not `apiHandler` wrapper)
- [ ] Uses `error: unknown` (not `error: any`)
- [ ] Awaits `params`
- [ ] Prefixes unused params with `_`
- [ ] POST returns 201

### Validation
- [ ] Hand-rolled validation (no Zod/Joy/Yup)
- [ ] Returns discriminated union
- [ ] Trims all string inputs
- [ ] Provides sensible defaults
- [ ] Auto-generates derived fields (slug, etc.)

### Error Handling
- [ ] Throws plain `Error` (not `AppError` subclasses)
- [ ] Consistent not-found message format
- [ ] Route catches with `error instanceof Error`
- [ ] Client API attaches `statusCode` to errors

### Performance
- [ ] No premature optimization
- [ ] `useCallback` on callbacks passed to components
- [ ] `.lean()` on all read queries
- [ ] `Promise.all` for parallel queries

### Accessibility
- [ ] Keyboard-accessible interactive elements
- [ ] ARIA attributes on modals
- [ ] Escape key closes modals
- [ ] Click-outside closes modals
- [ ] Color is not the only signal

---

## 22. Pull Request Checklist

Authors should verify these items before requesting a review:

### Before submitting
- [ ] `tsc --noEmit` passes with no new errors
- [ ] No `console.log` statements in production code
- [ ] No `any` types (except where explicitly allowed)
- [ ] All new files follow naming conventions
- [ ] All new files are in the correct directory
- [ ] No duplicated shared components
- [ ] No barrel files created

### Testing
- [ ] Manual testing completed for all paths (success, failure, edge cases)
- [ ] Loading state is visible during fetch
- [ ] Error state shows on failure
- [ ] Empty state shows when list is empty
- [ ] Optimistic updates work (toggle flips back on failure, delete refetches on failure)
- [ ] Confirm dialog works (open, confirm, cancel)
- [ ] Modal opens/closes correctly
- [ ] Form validation works (client-side and server-side)
- [ ] Accessibility: keyboard navigation works, ARIA attributes present

### Documentation
- [ ] New exported functions have JSDoc comments
- [ ] New shared hooks have JSDoc comments
- [ ] Complex logic has inline `// Why:` comments
- [ ] No unnecessary comments explaining `// what` (the code already says this)

### Code quality
- [ ] Code is boring (no clever solutions)
- [ ] No premature abstraction (shared code only if repeated twice)
- [ ] Functions are thin (routes delegate to services)
- [ ] Components are declarative (no side effects)
- [ ] Hooks manage their own state (no global state)
- [ ] Import order is correct
- [ ] Naming conventions are followed

### Git
- [ ] Commit message follows conventional format (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
- [ ] Commit message explains **why**, not **what**
- [ ] No merge conflicts with `main`

---

*End of document.*
