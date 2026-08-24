# CRUD Architecture Checklist

> **Reference implementations:** Categories module, Tags module
> **Purpose:** Blueprint for every future CRUD module (Authors, Sections, Pages, etc.)
> **Last updated:** 2025-07-13

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [File Creation Order](#2-file-creation-order)
3. [Mongoose Model Standards](#3-mongoose-model-standards)
4. [DTO Design Principles](#4-dto-design-principles)
5. [Validation Rules](#5-validation-rules)
6. [Service Layer Principles](#6-service-layer-principles)
7. [API Route Principles](#7-api-route-principles)
8. [Error Handling](#8-error-handling)
9. [Response Handling](#9-response-handling)
10. [Slug Generation](#10-slug-generation)
11. [Duplicate Checking](#11-duplicate-checking)
12. [Soft Delete Strategy](#12-soft-delete-strategy)
13. [Toggle Status Endpoint](#13-toggle-status-endpoint)
14. [TypeScript Guidelines](#14-typescript-guidelines)
15. [JSDoc Standards](#15-jsdoc-standards)
16. [Lean Query Usage](#16-lean-query-usage)
17. [Security Considerations](#17-security-considerations)
18. [Performance Considerations](#18-performance-considerations)
19. [Code Review Checklist](#19-code-review-checklist)

---

## 1. Folder Structure

Every CRUD module follows this tree. Replace `Entity` with the entity name (lowercased for directories, PascalCase for files/types/hooks).

```
models/Entity.ts                          — Mongoose schema
lib/types/entity.ts                       — Domain types + DTOs + filter
lib/validations/entity.ts                 — Validation function + constants
lib/services/entity.service.ts            — Business logic + DB operations
app/api/admin/entity/route.ts             — GET (list) / POST (create)
app/api/admin/entity/[id]/route.ts        — GET (detail) / PUT (update) / DELETE
app/api/admin/entity/[id]/toggle/route.ts — PATCH (toggle active/inactive)
lib/api/entityClient.ts                   — Client API wrapper
lib/hooks/useEntity.ts                    — React hooks (entity-specific)
components/admin/entity/                  — Entity-specific UI components
app/admin/entity/page.tsx                 — Admin list page
```

### Checklist

- [ ] One directory per module under `lib/`, `app/api/`, `components/admin/`
- [ ] Shared components live in `components/admin/shared/` — never duplicate
- [ ] No barrel files for services — import by file path
- [ ] Entity-specific hooks live in `lib/hooks/` alongside shared hooks

---

## 2. File Creation Order

Create files in this order to respect dependencies:

| Step | File | Depends On |
|------|------|------------|
| 1 | `models/Entity.ts` | — |
| 2 | `lib/types/entity.ts` | Model shape |
| 3 | `lib/validations/entity.ts` | Types (DTOs) |
| 4 | `lib/services/entity.service.ts` | Validation + Types |
| 5 | `app/api/admin/entity/route.ts` | Service |
| 6 | `app/api/admin/entity/[id]/route.ts` | Service |
| 7 | `app/api/admin/entity/[id]/toggle/route.ts` | Service |
| 8 | `lib/api/entityClient.ts` | API routes |
| 9 | `lib/hooks/useEntity.ts` | Client API |
| 10 | `components/admin/entity/` | Hooks + Client API |
| 11 | `app/admin/entity/page.tsx` | Components + Hooks |

---

## 3. Mongoose Model Standards

### Schema Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | **Yes** | trim, minlength: 2, maxlength: 80–120 |
| `slug` | String | **Yes** | lowercase, unique, trim, auto-generated |
| `description` | String | No | trim, default: "", maxlength: 500 |
| `isActive` | Boolean | No | default: true |
| *(entity-specific)* | — | — | e.g., `displayOrder`, `color`, `icon` |

### Indexes

```typescript
EntitySchema.index({ slug: 1 });                          // URL lookups
EntitySchema.index({ isActive: 1, name: 1 });             // List active by name
// Add entity-specific indexes (e.g., displayOrder, status)
```

### Model Export Pattern

```typescript
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const EntitySchema = new Schema(
  { /* fields */ },
  { timestamps: true }
);

EntitySchema.index({ slug: 1 });

export type EntityDocument = InferSchemaType<typeof EntitySchema> & {
  _id: string;
};

const Entity =
  (mongoose.models.Entity as Model<EntityDocument> | undefined) ??
  mongoose.model<EntityDocument>("Entity", EntitySchema);

export default Entity;
```

### Checklist

- [ ] All string fields use `trim: true`
- [ ] `slug` is `unique: true`, `lowercase: true`, `required: true`
- [ ] `isActive` defaults to `true`
- [ ] Schema options include `{ timestamps: true }`
- [ ] `EntityDocument` type uses `InferSchemaType` + `_id: string`
- [ ] Model uses singleton pattern (fallback to `mongoose.model`)
- [ ] Index on `slug` is defined
- [ ] Index on `{ isActive: 1, name: 1 }` for sorted listing

---

## 4. DTO Design Principles

### Types to Define

```typescript
// Complete entity type
export type Entity = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // entity-specific fields
};

// Create input — validated DTO, all non-optional fields required
export type EntityCreateInput = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  // entity-specific fields (non-optional)
};

// Update input — all optional for partial updates
export type EntityUpdateInput = {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  // entity-specific fields (optional)
};

// Validation result — discriminated union
export type EntityValidationResult =
  | { success: true; data: EntityCreateInput }
  | { success: false; errors: Record<string, string> };

// Filter — explicit type, no Parameters<> coupling
export type EntityFilter = {
  isActive?: boolean;
};
```

### Rules

- [ ] **No `Omit<>`, `Pick<>`, `Partial<>`** — explicit interfaces only
- [ ] `EntityCreateInput` has non-optional `description` and `isActive` (defaults applied in validation)
- [ ] `EntityUpdateInput` makes all fields optional
- [ ] `EntityFilter` is a separate explicit type — never use `Parameters<typeof service>[0]`
- [ ] Validation result is a discriminated union with `success` literal

---

## 5. Validation Rules

### Validation Function Template

```typescript
import type { EntityCreateInput, EntityValidationResult } from "@/lib/types/entity";

const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  descriptionMax: 500,
} as const;

export function validateEntityInput(
  input: Record<string, unknown>
): EntityValidationResult {
  const errors: Record<string, string> = {};

  // Name
  const name = input.name;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Entity name is required";
  } else if (name.trim().length < LIMITS.nameMin) {
    errors.name = `Entity name must be at least ${LIMITS.nameMin} characters`;
  } else if (name.trim().length > LIMITS.nameMax) {
    errors.name = `Entity name must be at most ${LIMITS.nameMax} characters`;
  }

  // Description
  const description = input.description;
  const trimmedDescription =
    description !== undefined && description !== null
      ? String(description).trim()
      : "";
  if (trimmedDescription.length > LIMITS.descriptionMax) {
    errors.description = `Description must be at most ${LIMITS.descriptionMax} characters`;
  }

  // isActive — strict boolean validation
  const isActive = input.isActive;
  const booleanActive = isActive === false ? false : isActive === true ? true : true;
  if (isActive !== true && isActive !== false) {
    errors.isActive = "isActive must be true or false";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const data: EntityCreateInput = {
    name: name.trim(),
    slug: generateSlug(name.trim()), // auto-generate
    description: trimmedDescription,
    isActive: booleanActive,
  };

  return { success: true, data };
}
```

### Rules

- [ ] Use `LIMITS` constants — never magic numbers in validation logic
- [ ] Auto-generate `slug` from `name` using `generateSlug()`
- [ ] Strict boolean validation for `isActive` — reject non-boolean values
- [ ] Trim all string inputs before storing
- [ ] Provide sensible defaults: `isActive: true`, `description: ""`
- [ ] Return discriminated union: `{ success: true; data }` or `{ success: false; errors }`
- [ ] No Zod/Yup — hand-rolled validation with plain TypeScript

---

## 6. Service Layer Principles

### Exported Functions

Every service must export these functions (minimum):

| Function | Purpose | Returns |
|----------|---------|---------|
| `createTag(input)` | Create new entity | `Entity` |
| `updateTag(id, input)` | Update entity by ID | `Entity` |
| `deleteTag(id)` | Soft-delete (set `isActive: false`) | `Entity` |
| `getTagByIdOrThrow(id)` | Get by ID, throw if absent | `Entity` |
| `getTagById(id)` | Get by ID, return null if absent | `Entity \| null` |
| `getTagBySlug(slug)` | Get by slug | `Entity \| null` |
| `getAllTags(filter)` | List with optional filter | `Entity[]` |
| `toggleTagStatus(id)` | Toggle `isActive` | `Entity` |
| `tagExists(name?, slug?)` | Check existence | `boolean` |
| `generateUniqueSlug(baseSlug)` | Unique slug generation | `string` |

### Private Helpers

| Helper | Purpose |
|--------|---------|
| `toEntity(doc)` | Convert hydrated Mongoose doc → plain `Entity` |
| `toLeanEntity(doc)` | Convert lean Mongoose doc → plain `Entity` |
| `getEntityOrThrow(id)` | Fetch + throw `NotFoundError` |
| `validateEntityOrThrow(input)` | Validate + throw `ValidationError` |
| `escapeRegExp(input)` | Escape regex special characters |

### Rules

- [ ] Every exported function calls `await connectDB()` at the top
- [ ] Use `.lean()` for all read queries
- [ ] Use `HydratedDocument<EntityDocument>` for hydrated docs, `TagLeanObject` for lean docs
- [ ] Define explicit lean object type when Mongoose's inferred type is too loose
- [ ] Soft delete via `isActive: false` — never remove documents
- [ ] Validation happens in the service layer, not in routes
- [ ] Use `Record<string, unknown>` for input parameters
- [ ] Private helpers handle conversion and error throwing
- [ ] No Zod/Yup — hand-rolled validation

---

## 7. API Route Principles

### List Route (`GET /api/admin/entity`)

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const isActiveParam = searchParams.get("isActive");

  const filter: EntityFilter = {};
  switch (isActiveParam) {
    case "true":
      filter.isActive = true;
      break;
    case "false":
      filter.isActive = false;
      break;
  }

  return handleService(async () => {
    const entities = await getAllEntities(filter);
    return successResponse(entities);
  });
}
```

### Create Route (`POST /api/admin/entity`)

```typescript
export async function POST(request: NextRequest) {
  return handleService(async () => {
    const body = await request.json();
    const entity = await createEntity(body);
    return successResponse(entity, 201);
  });
}
```

### Item Route (`GET/PUT/DELETE /api/admin/entity/[id]`)

```typescript
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    const { id } = await params;
    const entity = await getEntityByIdOrThrow(id);
    return successResponse(entity);
  });
}
```

### Rules

- [ ] Always use `handleService()` and `successResponse()` from `@/lib/api/response`
- [ ] POST returns `201` for created resources
- [ ] Use `params: Promise<{ id: string }>` — always `await params`
- [ ] No validation in routes — delegate to service layer
- [ ] Use `switch` for boolean filter parsing (rejects invalid values)
- [ ] Explicit `EntityFilter` type — never `Parameters<typeof service>[0]`
- [ ] GET routes accept `_request` (unused parameter prefixed with underscore)

---

## 8. Error Handling

### Error Hierarchy

```
ValidationError    — Invalid input (400)
NotFoundError      — Entity not found (404)
ConflictError      — Duplicate name/slug (409)
AppError           — Base class (never throw directly)
```

### Usage Pattern

```typescript
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";

// In service layer
if (!doc) {
  throw new NotFoundError(`Entity with id ${id} not found`);
}

if (exists) {
  throw new ConflictError(`An entity with name "${name}" already exists`);
}

const result = validateEntityInput(input);
if (!result.success) {
  throw new ValidationError("Entity input validation failed", {
    details: result.errors,
  });
}
```

### Route-Level Handling

```typescript
export async function POST(request: NextRequest) {
  return handleService(async () => {
    // Service layer throws AppError subclasses
    const entity = await createEntity(body);
    return successResponse(entity, 201);
  });
  // handleService() catches errors and returns appropriate HTTP status
}
```

### Rules

- [ ] Use typed error classes — never `throw new Error(...)` in service layer
- [ ] `NotFoundError` for missing entities
- [ ] `ConflictError` for duplicate name/slug
- [ ] `ValidationError` for validation failures
- [ ] Routes delegate error handling to `handleService()`
- [ ] Error messages are descriptive and include the entity identifier

---

## 9. Response Handling

### Success Response

```typescript
import { successResponse } from "@/lib/api/response";

return successResponse(data, 200);  // or 201 for creation
```

### Service Handler

```typescript
import { handleService } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  return handleService(async () => {
    const entity = await createEntity(body);
    return successResponse(entity, 201);
  });
}
```

### Response Shape

```json
{
  "success": true,
  "data": { /* entity */ }
}
```

### Error Response Shape

```json
{
  "success": false,
  "message": "Entity with id abc123 not found"
}
```

### Rules

- [ ] All API responses use `successResponse()` — never `NextResponse.json()` directly
- [ ] `handleService()` wraps try/catch and returns appropriate HTTP status
- [ ] Success responses include `{ success: true, data }`
- [ ] Error responses include `{ success: false, message }`
- [ ] POST creation returns HTTP 201

---

## 10. Slug Generation

### Process

1. Validate input in `validateEntityInput()`
2. Call `generateSlug(name.trim())` from `lib/slug.ts`
3. In `createEntity()`, check for duplicate slug
4. Call `generateUniqueSlug(slug)` to append suffix if needed
5. Store unique slug in database

### Slug Utility

```typescript
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  if (!baseSlug) {
    throw new ValidationError("Slug cannot be empty");
  }

  await connectDB();

  let candidate = baseSlug;
  let suffix = 1;

  while (await Entity.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }

  return candidate;
}
```

### Rules

- [ ] Use existing `generateSlug()` from `lib/slug.ts`
- [ ] Slug is auto-generated from `name` during validation
- [ ] `generateUniqueSlug()` appends `-1`, `-2`, etc. for duplicates
- [ ] Slug uniqueness check includes entities of any status (active/inactive)
- [ ] Slug is lowercase, hyphenated, no special characters

---

## 11. Duplicate Checking

### Name Duplicate (Case-Insensitive)

```typescript
import { escapeRegExp } from "@/lib/services/entity.service";

const exists = await Entity.exists({
  name: { $regex: new RegExp(`^${escapeRegExp(validated.name)}$`, "i") },
});

if (exists) {
  throw new ConflictError(`An entity with name "${validated.name}" already exists`);
}
```

### Slug Duplicate

Handled by `generateUniqueSlug()` — appends numeric suffix.

### Update Duplicate (Exclude Self)

```typescript
const nameChanged = String(input.name ?? "").trim() !== existing.name.trim();

if (nameChanged) {
  const exists = await Entity.exists({
    _id: { $ne: id },
    name: { $regex: new RegExp(`^${escapeRegExp(validated.name)}$`, "i") },
  });

  if (exists) {
    throw new ConflictError(`An entity with name "${validated.name}" already exists`);
  }
}
```

### Rules

- [ ] Use `escapeRegExp()` to prevent regex injection
- [ ] Case-insensitive matching with `^...$` anchor and `i` flag
- [ ] During update, exclude current entity from duplicate check (`_id: { $ne: id }`)
- [ ] Check exists before creating/updating — not after
- [ ] Use `exists()` instead of `countDocuments()` — more efficient

---

## 12. Soft Delete Strategy

### Implementation

```typescript
export async function deleteEntity(id: string): Promise<EntityType> {
  await connectDB();

  const updated = await Entity.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Entity with id ${id} not found`);
  }

  return toLeanEntity(updated);
}
```

### Rules

- [ ] `deleteEntity()` sets `isActive: false` — never removes the document
- [ ] `getAllEntities()` can filter by `isActive` to exclude soft-deleted entities
- [ ] Soft-deleted entities can be restored via `toggleEntityStatus()`
- [ ] Existing associations (e.g., article-author) are preserved
- [ ] Slug remains unique even for soft-deleted entities (uniqueness check includes all statuses)

---

## 13. Toggle Status Endpoint

### Route

```typescript
// PATCH /api/admin/entity/[id]/toggle
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    const { id } = await params;
    const entity = await toggleEntityStatus(id);
    return successResponse(entity);
  });
}
```

### Service

```typescript
export async function toggleEntityStatus(id: string): Promise<EntityType> {
  await connectDB();

  const existing = await getEntityOrThrow(id);

  const updated = await Entity.findByIdAndUpdate(
    id,
    { isActive: !existing.isActive },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Entity with id ${id} not found`);
  }

  return toLeanEntity(updated);
}
```

### Rules

- [ ] Toggle endpoint uses `PATCH` method
- [ ] Route file: `app/api/admin/entity/[id]/toggle/route.ts`
- [ ] Service function: `toggleEntityStatus(id)`
- [ ] Flips `isActive` from `true` → `false` or `false` → `true`
- [ ] Returns the updated entity
- [ ] Throws `NotFoundError` if entity does not exist

---

## 14. TypeScript Guidelines

### Strict Mode

- [ ] Zero TypeScript errors — verify with `npx tsc --noEmit`
- [ ] No `any` types — use explicit types or `Record<string, unknown>` for boundaries
- [ ] No `as any` casts — use proper type conversions

### Mongoose Typing

```typescript
// Hydrated document (with methods)
import { type HydratedDocument } from "mongoose";
import type { EntityDocument } from "@/models/Entity";

async function getEntityOrThrow(id: string): Promise<HydratedDocument<EntityDocument>> {
  const doc = await Entity.findById(id);
  if (!doc) throw new NotFoundError(`Entity with id ${id} not found`);
  return doc;
}

// Lean document (plain object)
type EntityLeanObject = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
} & Record<string, unknown>;

function toLeanEntity(doc: EntityLeanObject): EntityType {
  return {
    _id: doc._id,
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    isActive: doc.isActive,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}
```

### Date Handling

- [ ] `createdAt`/`updatedAt` in lean type are `Date | string` (Mongoose may return either)
- [ ] Use `instanceof Date` check before calling `.toISOString()`
- [ ] Entity type stores dates as ISO strings (`string`)

### No Utility Type Coupling

- [ ] Define explicit `EntityFilter` type — never use `Parameters<typeof service>[0]`
- [ ] No `Omit<>`, `Pick<>`, `Partial<>` — explicit interfaces only
- [ ] API layer imports types from `lib/types/`, not from service layer

---

## 15. JSDoc Standards

### Function Documentation

Every exported function must have JSDoc with:

- [ ] One-line summary
- [ ] Description (optional, for complex functions)
- [ ] `@param` for each parameter
- [ ] `@returns` describing the return value

```typescript
/**
 * Create a new entity.
 *
 * Validates input, generates a unique slug, and persists the document.
 * Returns the created entity with all fields populated.
 *
 * @param input — Validated input record (must include name, slug, description, isActive).
 * @returns The created entity with all fields populated.
 */
export async function createEntity(
  input: Record<string, unknown>
): Promise<EntityType> {
```

### Type Documentation

```typescript
/**
 * Filter criteria for querying entities.
 *
 * Used by API routes and service queries to apply optional filters
 * without coupling the API layer to the service layer's parameter types.
 */
export type EntityFilter = {
  isActive?: boolean;
};
```

### Rules

- [ ] Every exported function has JSDoc
- [ ] Every exported type has JSDoc
- [ ] Use `@param` and `@returns` tags
- [ ] No `@author`, `@date`, `@license` tags
- [ ] Keep descriptions concise and actionable

---

## 16. Lean Query Usage

### When to Use `.lean()`

- [ ] **All read queries** use `.lean()` — `find().lean()`, `findOne().lean()`, `findById().lean()`
- [ ] **Never use `.lean()` for write operations** — `findByIdAndUpdate()` without `.lean()` returns hydrated doc

### Lean Type Conversion

```typescript
// Define explicit lean object type
type EntityLeanObject = {
  _id: string;
  name: string;
  // ... fields returned by lean query
} & Record<string, unknown>;

// Convert lean doc to entity type
function toLeanEntity(doc: EntityLeanObject): EntityType {
  return {
    _id: doc._id,
    name: doc.name,
    // ... map fields
  };
}

// Usage
const entities = await Entity.find(filter).sort({ name: 1 }).lean();
return entities.map(toLeanEntity);
```

### Rules

- [ ] Use `.lean()` for all read queries
- [ ] Define explicit `EntityLeanObject` type when Mongoose's inferred type is too loose
- [ ] Convert lean docs via `toLeanEntity()` helper
- [ ] Handle `Date | string` for timestamp fields
- [ ] Never use `as unknown as EntityType` — use explicit conversion

---

## 17. Security Considerations

### Regex Injection Prevention

```typescript
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Usage
const regex = new RegExp(`^${escapeRegExp(validated.name)}$`, "i");
```

### Input Validation

- [ ] All string inputs are trimmed
- [ ] All string inputs have maxlength validation
- [ ] Boolean fields are strictly validated (`true` or `false` only)
- [ ] No user input is directly interpolated into regex without `escapeRegExp()`

### API Security

- [ ] No authentication/authorization in this checklist — add when required
- [ ] All API routes use `handleService()` for consistent error handling
- [ ] No raw SQL — Mongoose query builder only
- [ ] No `eval()`, `new Function()`, or dynamic code execution

### Rules

- [ ] Use `escapeRegExp()` for all regex patterns derived from user input
- [ ] Validate at every boundary: validation layer → service layer → database
- [ ] No direct MongoDB operator injection — use Mongoose query builder
- [ ] No file uploads in this checklist — add sanitization when required

---

## 18. Performance Considerations

### Database Queries

- [ ] Use `exists()` instead of `countDocuments()` for existence checks — returns `true/false` without counting
- [ ] Use `.lean()` for all read queries — avoids Mongoose document overhead
- [ ] Use `.sort()` in queries — not in JavaScript
- [ ] Project only needed fields with `.select()` when applicable

### Indexes

```typescript
EntitySchema.index({ slug: 1 });                          // URL lookups
EntitySchema.index({ isActive: 1, name: 1 });             // List active by name
// Add composite indexes for common query patterns
```

### Connection

- [ ] Call `await connectDB()` in every service function — no connection pooling abstraction
- [ ] For bulk operations, consider batching multiple operations in a single service call

### Rules

- [ ] Prefer `exists()` over `countDocuments()` for boolean checks
- [ ] Use `.lean()` for read-only queries
- [ ] Sort in MongoDB, not in JavaScript
- [ ] Add composite indexes for common query patterns
- [ ] No N+1 queries — use `.populate()` or aggregation when joining collections

---

## 19. Code Review Checklist

### Before Merging

- [ ] **Zero TypeScript errors** — run `npx tsc --noEmit`
- [ ] **All exported functions have JSDoc** — summary, `@param`, `@returns`
- [ ] **All exported types have JSDoc** — purpose and usage
- [ ] **No `any` types** — use explicit types or `Record<string, unknown>`
- [ ] **No `as any` or `as unknown as` casts** — use explicit conversion
- [ ] **No `Parameters<typeof>` coupling** — use explicit `EntityFilter` type
- [ ] **No magic numbers** — use `LIMITS` constants in validation
- [ ] **Soft delete** — `deleteEntity()` sets `isActive: false`
- [ ] **Slug uniqueness** — `generateUniqueSlug()` handles duplicates
- [ ] **Case-insensitive duplicate check** — `escapeRegExp()` + regex with `i` flag
- [ ] **Boolean validation** — strict `true`/`false` check for `isActive`
- [ ] **String trimming** — all string inputs trimmed before storage
- [ ] **Date handling** — `instanceof Date` check before `.toISOString()`
- [ ] **Lean queries** — all read queries use `.lean()`
- [ ] **Error classes** — use `NotFoundError`, `ConflictError`, `ValidationError`
- [ ] **Response helpers** — use `handleService()` and `successResponse()`
- [ ] **Route params** — `params: Promise<{ id: string }>` with `await params`
- [ ] **Indexes** — slug index, isActive+name index defined
- [ ] **Shared components** — use `components/admin/shared/`, no duplication
- [ ] **No TODO comments** — implement fully or defer
- [ ] **No unnecessary abstractions** — three similar lines > premature abstraction

### Testing (if applicable)

- [ ] Create endpoint returns 201
- [ ] List endpoint filters by `isActive`
- [ ] Update endpoint rejects duplicate names
- [ ] Delete endpoint sets `isActive: false`
- [ ] Toggle endpoint flips `isActive`
- [ ] Validation rejects invalid input
- [ ] Slug generation handles duplicates

---

## Quick Reference: File Template

```
Step 1:  models/Entity.ts              — Mongoose schema + type + export
Step 2:  lib/types/entity.ts           — Entity, EntityCreateInput, EntityUpdateInput, EntityValidationResult, EntityFilter
Step 3:  lib/validations/entity.ts     — validateEntityInput() + LIMITS
Step 4:  lib/services/entity.service.ts — CRUD + queries + utilities + helpers
Step 5:  app/api/admin/entity/route.ts — GET (list) / POST (create)
Step 6:  app/api/admin/entity/[id]/route.ts — GET / PUT / DELETE
Step 7:  app/api/admin/entity/[id]/toggle/route.ts — PATCH (toggle)
Step 8:  lib/api/entityClient.ts       — Client API wrapper
Step 9:  lib/hooks/useEntity.ts        — React hooks
Step 10: components/admin/entity/      — UI components
Step 11: app/admin/entity/page.tsx     — Admin page
```

---

*This document is a living blueprint. Update it when patterns evolve.*
