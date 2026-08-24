# CRUD Engineering Template

## Purpose

Every CRUD module in this CMS must follow this architecture. The Categories module is the reference implementation — any new entity must be structurally consistent with it.

**Applicable modules:** Categories, Tags, Authors, Articles, and all future entities.

---

## Standard Folder Structure

```
lib/
    models/          ← Mongoose schemas + typed model exports
    services/        ← business logic + database operations
    validations/     ← input validation (stateless, no DB access)
    types/           ← explicit DTO interfaces

app/
    api/
        admin/
            <entity>/
                route.ts           ← collection-level (GET list, POST create)
                [id]/
                    route.ts       ← item-level (GET one, PUT update, DELETE)
                    toggle/        ← status toggle (optional)
                    reorder/       ← ordering operations (optional)

hooks/               ← React Query / SWR data-fetching hooks

components/          ← admin UI components (presentational + container)
```

---

## Required Files Checklist

| # | File | Status |
|---|------|--------|
| 1 | `models/<Entity>.ts` | ☐ |
| 2 | `lib/types/<entity>.ts` | ☐ |
| 3 | `lib/validations/<entity>.ts` | ☐ |
| 4 | `lib/services/<entity>.service.ts` | ☐ |
| 5 | `app/api/admin/<entity>/route.ts` | ☐ |
| 6 | `app/api/admin/<entity>/[id]/route.ts` | ☐ |
| 7 | `app/api/admin/<entity>/[id]/toggle/route.ts` | ☐ |
| 8 | `app/api/admin/<entity>/[id]/reorder/route.ts` | ☐ |
| 9 | `lib/api/<entity>.ts` (client helper) | ☐ |
| 10 | `hooks/use<Entity>.ts` | ☐ |
| 11 | `components/admin/<entity>/` | ☐ |
| 12 | `app/admin/<entity>/page.tsx` | ☐ |

---

## Layer Responsibilities

### Model (`lib/models/`)

| Rule | Detail |
|------|--------|
| **Purpose** | Schema definition only |
| **Contains** | Mongoose `Schema`, typed model export, document type |
| **Never** | Business logic, HTTP handling, validation |

### Validation (`lib/validations/`)

| Rule | Detail |
|------|--------|
| **Purpose** | Validate and sanitise raw input |
| **Contains** | `validate<Entity>Input()` returning `{ success, data, errors }` |
| **Never** | Touch the database, throw exceptions |

### Service (`lib/services/`)

| Rule | Detail |
|------|--------|
| **Purpose** | All business logic and database operations |
| **Contains** | CRUD functions, private helpers, type conversions |
| **Never** | Return `NextResponse`, read `NextRequest`, build HTTP payloads |
| **Must** | Throw `AppError` subclasses (`ValidationError`, `NotFoundError`, `ConflictError`) |

### API Route (`app/api/admin/`)

| Rule | Detail |
|------|--------|
| **Purpose** | Parse HTTP request, delegate to service, return HTTP response |
| **Contains** | `GET`/`POST`/`PUT`/`DELETE` handlers |
| **Must** | Use `handleService()` wrapper, `successResponse()` / `errorResponse()` |
| **Never** | Contain business logic, duplicate validation |

### React Hook (`hooks/`)

| Rule | Detail |
|------|--------|
| **Purpose** | Frontend data fetching and state management |
| **Contains** | `use<Entity>` hook wrapping API calls |

### Components (`components/`)

| Rule | Detail |
|------|--------|
| **Purpose** | UI rendering only |
| **Contains** | Presentational and container components |
| **Never** | Direct API calls (use hooks instead) |

---

## DTO Rules

Use **explicit DTO interfaces**. Never derive DTOs using `Omit`, `Pick`, or utility types.

```typescript
// lib/types/category.ts

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

export interface CategoryUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

export interface ValidationResult<T> {
  success: true;
  data: T;
} | {
  success: false;
  errors: Record<string, string>;
}
```

---

## Validation Rules

```
┌─────────────────────────────────────────────────────────┐
│                    Validation Contract                    │
├─────────────────────────────────────────────────────────┤
│ • Never touches the database                            │
│ • Returns { success, data } or { success, errors }      │
│ • Never throws exceptions                               │
│ • Sanitises input (trim, lowercase, defaults)           │
│ • Service layer wraps result and throws ValidationError │
└─────────────────────────────────────────────────────────┘
```

**Example:**

```typescript
// lib/validations/category.ts

export function validateCategoryInput(
  input: Record<string, unknown>
): ValidationResult<CategoryCreateInput> {
  const errors: Record<string, string> = {};

  // Validate name
  const name = input.name;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.name = "Category name must be at least 2 characters";
  }

  // Validate slug
  const slug = input.slug;
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    errors.slug = "Slug is required";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: input.description ? String(input.description).trim() : "",
      color: input.color ? String(input.color).trim() : "#6b7280",
      icon: input.icon ? String(input.icon).trim() : "",
      displayOrder:
        typeof input.displayOrder === "number"
          ? input.displayOrder
          : 0,
    },
  };
}
```

---

## Service Rules

### Private Helper Functions

Every service must use private helpers for common patterns:

| Helper | Purpose |
|--------|---------|
| `validate<Entity>OrThrow()` | Validates input, throws `ValidationError` on failure |
| `get<Entity>ByIdOrThrow()` | Fetches by ID, throws `NotFoundError` if absent |
| `to<Entity>()` | Converts Mongoose document → plain DTO |
| `toLean<Entity>()` | Converts lean document → plain DTO |
| `generateUnique<EntitySlug>()` | Ensures slug uniqueness |

### Document Conversion

```typescript
function toCategory(doc: CategoryDocument): Category {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    color: doc.color,
    icon: doc.icon,
    displayOrder: doc.displayOrder,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toLeanCategory(
  doc: ReturnType<typeof Category.prototype.toObject>
): Category {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    color: doc.color,
    icon: doc.icon,
    displayOrder: doc.displayOrder,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
```

### Use `lean()` Where Appropriate

Use `.lean()` for read-only queries to avoid Mongoose overhead. Use hydrated documents only when calling Mongoose instance methods.

### Business Logic Only

Services must contain **only** business logic and database operations. No HTTP types, no response building.

---

## API Route Rules

```
Request → handleService(async () => {
             parse request
             call service
             return successResponse()
           })
```

| Rule | Detail |
|------|--------|
| **Wrapper** | Always use `handleService()` |
| **Response** | Always return `successResponse()` |
| **POST status** | Must return `201` |
| **Validation** | Never duplicate — service handles it |
| **Business logic** | Never present — belongs in service |

**Example — Collection Route:**

```typescript
// app/api/admin/categories/route.ts

import { NextRequest } from "next/server";
import { getAllCategories, createCategory } from "@/lib/services/category.service";
import { successResponse, handleService } from "@/lib/api/response";

/**
 * List categories with optional isActive filter.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const isActiveParam = searchParams.get("isActive");

  const filter: Parameters<typeof getAllCategories>[0] = {};
  switch (isActiveParam) {
    case "true":
      filter.isActive = true;
      break;
    case "false":
      filter.isActive = false;
      break;
  }

  return handleService(async () => {
    const categories = await getAllCategories(filter);
    return successResponse(categories);
  });
}

/**
 * Create a new category.
 */
export async function POST(request: NextRequest) {
  return handleService(async () => {
    const body = await request.json();
    const category = await createCategory(body);
    return successResponse(category, 201);
  });
}
```

**Example — Item Route:**

```typescript
// app/api/admin/categories/[id]/route.ts

import { NextRequest } from "next/server";
import {
  getCategoryByIdOrThrow,
  updateCategory,
  deleteCategory,
} from "@/lib/services/category.service";
import { handleService, successResponse } from "@/lib/api/response";

/**
 * Get a single category by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    const { id } = await params;
    const category = await getCategoryByIdOrThrow(id);
    return successResponse(category);
  });
}

/**
 * Update an existing category.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    const { id } = await params;
    const body = await request.json();
    const category = await updateCategory(id, body);
    return successResponse(category);
  });
}

/**
 * Delete a category by ID.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    const { id } = await params;
    const category = await deleteCategory(id);
    return successResponse(category);
  });
}
```

---

## Error Handling

| Error Type | HTTP Status | When to Use |
|------------|-------------|-------------|
| `ValidationError` | `400` | Input failed validation |
| `NotFoundError` | `404` | Resource does not exist |
| `ConflictError` | `409` | Resource already exists (e.g. duplicate slug) |
| `UnauthorizedError` | `401` | Authentication required |
| `ForbiddenError` | `403` | Insufficient permissions |
| `InternalServerError` | `500` | Unknown / unexpected errors |

**`handleService` behaviour:**

```typescript
// lib/api/response.ts

export async function handleService(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, error.statusCode, error.details);
    }
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("[API Error]", error);
    return errorResponse("Internal Server Error", 500);
  }
}
```

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Failure

```json
{
  "success": false,
  "error": {
    "message": "Category name must be at least 2 characters",
    "details": {
      "name": "Category name must be at least 2 characters"
    }
  }
}
```

---

## Import Order

Imports must follow this exact order:

```typescript
// 1. Framework / third-party
import { NextRequest } from "next/server";

// 2. Models
import Category from "@/models/Category";

// 3. Services
import { getAllCategories, createCategory } from "@/lib/services/category.service";

// 4. Validation
import { validateCategoryInput } from "@/lib/validations/category";

// 5. Types
import type { Category, CategoryCreateInput } from "@/lib/types/category";

// 6. Utilities / API helpers
import { successResponse, handleService } from "@/lib/api/response";

// 7. Errors
import { NotFoundError } from "@/lib/errors";
```

---

## Function Order

Within a service file, functions must follow this order:

```
1. Private helpers (validateEntityOrThrow, getEntityByIdOrThrow, toEntity, toLeanEntity)
2. Create
3. Update
4. Delete
5. Queries (getById, getBySlug, getAll, toggle, reorder)
6. Utility functions (generateUniqueSlug, entityExists)
```

---

## Coding Standards

| Principle | Detail |
|-----------|--------|
| **Explicit types** | No `any`, no implicit `unknown` without narrowing |
| **No clever abstractions** | Readable over concise |
| **Single responsibility** | One concern per function |
| **Small functions** | Maximum ~40 lines per function |
| **Business logic in services** | Routes are thin |
| **Thin controllers** | Routes parse, delegate, respond |
| **JSDoc on exports** | Every exported function has a doc comment |

---

## Naming Convention

| Artifact | Convention | Example |
|----------|-----------|---------|
| Entity type | `PascalCase` | `Category` |
| Create input | `EntityCreateInput` | `CategoryCreateInput` |
| Update input | `EntityUpdateInput` | `CategoryUpdateInput` |
| Validation function | `validate<Entity>Input` | `validateCategoryInput` |
| Validation helper | `validate<Entity>OrThrow` | `validateCategoryOrThrow` |
| Query by ID | `get<Entity>ById` | `getCategoryById` |
| Query by ID (throw) | `get<Entity>ByIdOrThrow` | `getCategoryByIdOrThrow` |
| Create | `create<Entity>` | `createCategory` |
| Update | `update<Entity>` | `updateCategory` |
| Delete | `delete<Entity>` | `deleteCategory` |
| Toggle | `toggle<Entity>Status` | `toggleCategoryStatus` |
| Reorder | `reorder<Entities>` | `reorderCategories` |
| Service file | `<entity>.service.ts` | `category.service.ts` |
| Validation file | `<entity>.ts` | `category.ts` |
| Types file | `<entity>.ts` | `category.ts` |
| Model file | `<Entity>.ts` | `Category.ts` |

---

## Checklist Before Merge

- [ ] TypeScript compiles with zero errors
- [ ] Lint passes with zero warnings
- [ ] No duplicated business logic across layers
- [ ] Correct HTTP status codes (201 for POST, 200 for GET/PUT, 200/204 for DELETE)
- [ ] Correct error handling (ValidationError → 400, NotFoundError → 404, etc.)
- [ ] JSDoc comments on all exported functions
- [ ] File formatting consistent with Prettier / project config
- [ ] Architecture consistent with Categories reference module

---

## Final Principle

> **The Categories module is the reference implementation for every CRUD module in this project.**

If a new module deviates from this template, the deviation must be intentional, documented, and approved. Consistency across modules reduces cognitive load, prevents bugs, and enables any developer to navigate and extend any CRUD module without additional guidance.
