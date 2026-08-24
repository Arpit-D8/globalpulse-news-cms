# CRUD Module Template

> Reference implementation: **Categories module** (`app/admin/categories/`)
>
> Last reviewed: 2025-07-13

This document defines the standard architecture for every CMS CRUD module (Tags, Authors, Pages, Sections, etc.). Follow it to ensure consistency, predictability, and maintainability across the codebase.

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [API Route Pattern](#2-api-route-pattern)
3. [Service Layer Pattern](#3-service-layer-pattern)
4. [Validation Pattern](#4-validation-pattern)
5. [Error Handling Pattern](#5-error-handling-pattern)
6. [Client API Wrapper](#6-client-api-wrapper)
7. [Shared Hooks](#7-shared-hooks)
8. [Shared UI Components](#8-shared-ui-components)
9. [State Management Flow](#9-state-management-flow)
10. [Optimistic Update Pattern](#10-optimistic-update-pattern)
11. [Naming Conventions](#11-naming-conventions)
12. [File Naming Conventions](#12-file-naming-conventions)
13. [Development Checklist](#13-development-checklist)
14. [Known Inconsistencies](#14-known-inconsistencies)
15. [Engineering Principles](#15-engineering-principles)

---

## 1. Folder Structure

Every CRUD module follows this tree. Replace `Entity` with the entity name (lowercased for directories, PascalCase for files/types/hooks).

```
app/admin/entity/
├── page.tsx                          # List page (controller)
├── route.ts                          # GET (list) / POST (create)
└── [id]/
    ├── route.ts                      # GET (detail) / PUT (update) / DELETE
    └── toggle/
        └── route.ts                  # PATCH (toggle active/inactive)

lib/api/
└── entityClient.ts                   # Client API wrapper

lib/services/
└── entity.service.ts                 # Business logic + DB operations

lib/validations/
└── entity.ts                         # Validation function + result type

lib/types/
└── entity.ts                         # Domain types

lib/hooks/
├── useEntity.ts                      # List + search + optimistic helpers
├── useEntityMutations.ts             # CRUD mutation wrappers
├── useCreateEntity.ts                # Create form state + validation
├── useEditEntity.ts                  # Edit form state + validation
└── useConfirmDialog.ts               # Shared confirm dialog state machine

components/admin/entity/
├── EntityTable.tsx                   # Table with header + empty state
├── EntityRow.tsx                     # Table row with action buttons
├── EntityModal.tsx                   # Modal wrapper (create/edit)
└── EntityForm.tsx                    # Form fields + field-level validation

components/admin/shared/              # Already shared (do NOT duplicate)
├── ConfirmDialog.tsx
├── SearchInput.tsx
├── LoadingState.tsx
├── EmptyState.tsx
└── StatusBadge.tsx
```

### Key principles

- **One module = one directory** under `app/admin/`, `lib/api/`, `lib/services/`, `lib/validations/`, `lib/hooks/`, `components/admin/`.
- **Shared components live in `components/admin/shared/`** — never duplicate them.
- **No barrel files for services** — import by file path (`@/lib/services/entity.service`).
- **No entity-specific shared components** — if a component is used by only one entity, keep it in that entity's directory.

---

## 2. API Route Pattern

### 2.1 File locations

| Operation | Route path | File |
|-----------|-----------|------|
| List (GET) | `GET /api/admin/entity` | `app/api/admin/entity/route.ts` |
| Create (POST) | `POST /api/admin/entity` | `app/api/admin/entity/route.ts` |
| Get by ID (GET) | `GET /api/admin/entity/:id` | `app/api/admin/entity/[id]/route.ts` |
| Update (PUT) | `PUT /api/admin/entity/:id` | `app/api/admin/entity/[id]/route.ts` |
| Delete (DELETE) | `DELETE /api/admin/entity/:id` | `app/api/admin/entity/[id]/route.ts` |
| Toggle (PATCH) | `PATCH /api/admin/entity/:id/toggle` | `app/api/admin/entity/[id]/toggle/route.ts` |

### 2.2 Route handler template

```typescript
import { NextRequest } from "next/server";
import { getAllEntities, createEntity } from "@/lib/services/entity.service";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const isActiveParam = searchParams.get("isActive");
    const filter: { isActive?: boolean } = {};
    if (isActiveParam !== null) {
      filter.isActive = isActiveParam === "true";
    }
    const entities = await getAllEntities(filter);
    return apiSuccess(entities);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return apiError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entity = await createEntity(body);
    return apiSuccess(entity, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return apiError(message, 400);
  }
}
```

### 2.3 Guidelines

- **Always use `apiSuccess` / `apiError` from `@/lib/api-response`** — do NOT create your own response helpers.
- **POST returns 201** for created resources.
- **Use Next.js 15 `params: Promise<{ id: string }>`** — always `await params`.
- **No validation in routes** — delegate to service layer.
- **Manual try/catch** in each route (the `apiHandler` wrapper exists but is not yet adopted by existing routes).
- **Soft delete** — set `isActive: false`, do NOT remove the document.

---

## 3. Service Layer Pattern

### 3.1 File: `lib/services/entity.service.ts`

### 3.2 Template

```typescript
import Entity from "@/models/Entity";
import { connectDB } from "@/lib/mongodb";
import { validateEntityInput } from "@/lib/validations/entity";
import type {
  Entity as EntityType,
  EntityCreateInput,
  EntityUpdateInput,
} from "@/lib/types/entity";

function throwNotFound(id: string): never {
  throw new Error(`Entity with id ${id} not found`);
}

export async function createEntity(
  input: Record<string, unknown>
): Promise<EntityCreateInput> {
  const validation = validateEntityInput(input);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }
  await connectDB();
  const entity = await Entity.create(validation.data);
  return entity.toObject<EntityCreateInput>() as unknown as EntityCreateInput;
}

export async function updateEntity(
  id: string,
  input: Record<string, unknown>
): Promise<EntityType> {
  await connectDB();
  const existing = await Entity.findById(id);
  if (!existing) { throwNotFound(id); }
  const validation = validateEntityInput(input);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }
  const updated = await Entity.findByIdAndUpdate(
    id,
    validation.data,
    { new: true }
  ).lean();
  if (!updated) { throwNotFound(id); }
  return updated as unknown as EntityType;
}

export async function deleteEntity(id: string): Promise<EntityType> {
  await connectDB();
  const updated = await Entity.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).lean();
  if (!updated) { throwNotFound(id); }
  return updated as unknown as EntityType;
}

export async function getEntityById(id: string): Promise<EntityType | null> {
  await connectDB();
  const entity = await Entity.findById(id).lean();
  return (entity ?? null) as EntityType | null;
}

export async function getAllEntities({
  isActive,
}: { isActive?: boolean } = {}): Promise<EntityType[]> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) { filter.isActive = isActive; }
  const entities = await Entity.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  return entities as unknown as EntityType[];
}

export async function toggleEntityStatus(id: string): Promise<EntityType> {
  await connectDB();
  const existing = await Entity.findById(id);
  if (!existing) { throwNotFound(id); }
  const updated = await Entity.findByIdAndUpdate(
    id,
    { isActive: !existing.isActive },
    { new: true }
  ).lean();
  if (!updated) { throwNotFound(id); }
  return updated as unknown as EntityType;
}
```

### 3.3 Guidelines

- **Every function calls `await connectDB()`** at the top — no connection pooling abstraction.
- **Use `.lean()`** for all reads — returns plain objects, no Mongoose overhead.
- **Soft delete** — set `isActive: false` instead of removing the document.
- **Validation in service layer, not in routes** — routes delegate to service.
- **Use `Record<string, unknown>` for input types** — loose typing at the boundary.
- **Helper function `throwNotFound(id)`** — throw with consistent message format: `"Entity with id ${id} not found"`.
- **Bulk operations** — use `bulkWrite` for reorder/mass-update patterns.
- **Return typed results** — cast via `as unknown as EntityType` after `.lean()`.

---

## 4. Validation Pattern

### 4.1 File: `lib/validations/entity.ts`

### 4.2 Template

```typescript
import type { EntityCreateInput } from "@/lib/types/entity";

export function validateEntityInput(
  input: Record<string, unknown>
): import("@/lib/types/entity").EntityValidationResult {
  const errors: Record<string, string> = {};

  const name = input.name;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Entity name is required";
  } else if (name.trim().length < 2) {
    errors.name = "Entity name must be at least 2 characters";
  } else if (name.trim().length > 50) {
    errors.name = "Entity name must be at most 50 characters";
  }

  // Add field validations...

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const trimmedName = String(name).trim();
  const data: import("@/lib/types/entity").EntityCreateInput = {
    name: trimmedName,
    // slug: generateSlug(trimmedName),  // if auto-slug generation
    description: input.description ? String(input.description).trim() : "",
    displayOrder:
      input.displayOrder !== undefined && input.displayOrder !== null
        ? Number(input.displayOrder)
        : 0,
    isActive: input.isActive !== false,
  };

  return { success: true, data };
}
```

### 4.3 Guidelines

- **Return a discriminated union**: `{ success: true; data }` or `{ success: false; errors }`.
- **Auto-generate derived fields** (slug, etc.) during validation.
- **Provide sensible defaults** (isActive: true, displayOrder: 0, color: "#6b7280").
- **Trim all string inputs**.
- **No Zod/Yup** — hand-rolled validation with plain TypeScript functions.
- **Validation lives in the service layer** — routes do NOT validate directly.

---

## 5. Error Handling Pattern

### 5.1 Service layer errors

- **Not found**: `throw new Error("Entity with id ${id} not found")`
- **Validation**: `throw new Error("Validation failed: ${JSON.stringify(errors)}")`
- **Domain conflicts**: `throw new Error("A entity with slug \"${slug}\" already exists")`

### 5.2 API route errors

```typescript
catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Internal Server Error";
  return apiError(message, 500);
}
```

### 5.3 Client API errors

```typescript
const res = await fetch(url);
const json = await res.json();
if (!json.success) {
  const err = new Error(json.message ?? "Failed to fetch entity");
  (err as any).statusCode = res.status;
  throw err;
}
```

### 5.4 Guidelines

- **Use `error instanceof Error`** checks everywhere — never assume error shape.
- **Attach `statusCode` to thrown errors** in the client API for client-side handling.
- **AppError class exists** (`lib/errors/AppError`) but is NOT currently used by the Categories module. Routes use manual try/catch.
- **Consistent response shape**: `{ success: true, data }` or `{ success: false, message }`.

---

## 6. Client API Wrapper

### 6.1 File: `lib/api/entityClient.ts`

### 6.2 Template

```typescript
import type { Entity, EntityCreateInput, EntityUpdateInput } from "@/lib/types/entity";

const BASE = "/api/admin/entity";

export const entityClient = {
  async list(isActive?: boolean): Promise<Entity[]> {
    const url = new URL(BASE, window.location.origin);
    if (isActive !== undefined) {
      url.searchParams.set("isActive", String(isActive));
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Failed to fetch entities: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch entities");
    }
    return json.data ?? [];
  },

  async getById(id: string): Promise<Entity> {
    const res = await fetch(`${BASE}/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch entity: ${res.statusText}`);
    }
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message ?? "Failed to fetch entity");
    }
    return json.data;
  },

  async create(input: EntityCreateInput): Promise<Entity> {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to create entity");
      (err as any).statusCode = res.status;
      throw err;
    }
    return json.data;
  },

  async update(id: string, input: EntityUpdateInput): Promise<Entity> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to update entity");
      (err as any).statusCode = res.status;
      throw err;
    }
    return json.data;
  },

  async toggle(id: string): Promise<Entity> {
    const res = await fetch(`${BASE}/${id}/toggle`, { method: "PATCH" });
    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to toggle entity");
      (err as any).statusCode = res.status;
      throw err;
    }
    return json.data;
  },

  async delete(id: string): Promise<Entity> {
    const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.message ?? "Failed to delete entity");
      (err as any).statusCode = res.status;
      throw err;
    }
    return json.data;
  },
};
```

### 6.3 Guidelines

- **Use `fetch` directly** — no axios/fetch wrapper.
- **Consistent response shape** — check `json.success` on every response.
- **Attach `statusCode`** to thrown errors for client-side handling.
- **`BASE` is hardcoded** to `/api/admin/entity`.
- **No retry logic, no timeout, no abort controller**.
- **Export as a named constant** (`export const entityClient`), not as a function.

---

## 7. Shared Hooks

### 7.1 Hook inventory

| Hook | File | Purpose | Entity-specific? |
|------|------|---------|------------------|
| `useEntity` | `lib/hooks/useEntity.ts` | List + search + optimistic helpers | YES |
| `useEntityMutations` | `lib/hooks/useEntityMutations.ts` | CRUD mutation wrappers | YES |
| `useCreateEntity` | `lib/hooks/useCreateEntity.ts` | Create form state + validation | YES |
| `useEditEntity` | `lib/hooks/useEditEntity.ts` | Edit form state + validation | YES |
| `useConfirmDialog` | `lib/hooks/useConfirmDialog.ts` | Confirm dialog state machine | NO (shared) |

### 7.2 `useConfirmDialog` — the ONLY truly shared hook

```typescript
"use client";

import { useState, useCallback } from "react";

export function useConfirmDialog<T = unknown>() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const openDialog = useCallback((target: T) => {
    setTarget(target);
    setOpen(true);
  }, []);

  const confirm = useCallback(() => {
    setOpen(false);
    setTarget(null);
    setLoading(false);
  }, []);

  const cancel = useCallback(() => {
    setOpen(false);
    setTarget(null);
    setLoading(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setTarget(null);
  }, []);

  return {
    open, target, loading,
    openDialog, confirm, cancel, close, setLoading,
  };
}
```

**API:**
- `openDialog(target)` — open with entity target
- `confirm()` — close on success (resets loading)
- `cancel()` — close on cancel (resets loading)
- `close()` — close without resetting loading
- `setLoading(bool)` — expose loading control to caller

**Presentation details (title, message, variant) are passed as props to `<ConfirmDialog>`, NOT stored in the hook.** The hook manages STATE, not configuration.

### 7.3 Entity-specific hooks

Each entity module creates its own variants of these hooks. The patterns are:

**`useEntity`** — List + search + optimistic helpers
```typescript
export function useEntity() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // fetchEntities via useEffect + entityClient

  // Client-side filtered list
  const filteredEntities = entities.filter(/* search logic */);

  // Optimistic helpers
  const updateLocalEntity = useCallback((id, updates) => { ... });
  const removeEntity = useCallback((id) => { ... });

  return {
    entities: filteredEntities,
    allEntities: entities,
    loading, error, searchQuery, setSearchQuery,
    refresh: fetchEntities,
    updateLocalEntity, removeEntity,
  };
}
```

**`useEntityMutations`** — CRUD mutation wrappers
```typescript
export function useEntityMutations() {
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const create = useCallback(async (input) => { ... });
  const update = useCallback(async (id, input) => { ... });
  const toggle = useCallback(async (id) => { ... });
  const deleteEntity = useCallback(async (id) => { ... });

  return { create, update, toggle, delete: deleteEntity, error, clearError };
}
```

**`useCreateEntity`** — Create form state + validation
```typescript
export function useCreateEntity(onSuccess?: () => void) {
  const [form, setForm] = useState<EntityCreateInput>({ ...defaults });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { create } = useEntityMutations();

  const validate = useCallback((): boolean => { ... });
  const handleSubmit = useCallback(async (e) => { ... });
  const reset = useCallback(() => { ... });

  return { form, setForm, errors, submitting, submitError, handleSubmit, reset };
}
```

**`useEditEntity`** — Edit form state + validation (pre-fills from entity)
```typescript
export function useEditEntity(entity: Entity, onSuccess?: () => void) {
  const [form, setForm] = useState<EntityCreateInput>({
    name: entity.name,
    slug: entity.slug,
    // ... pre-fill from entity
  });

  // Same validation as useCreateEntity (code duplication is acceptable)
  // Explicitly build EntityUpdateInput payload
}
```

### 7.4 Guidelines

- **Entity-specific hooks live in `lib/hooks/`** alongside shared hooks.
- **No abstraction layer** between entity hooks — each entity gets its own set.
- **Validation is duplicated** between server-side (`lib/validations/`) and client-side (`useCreateEntity`/`useEditEntity`) — this is acceptable for now.
- **`useConfirmDialog` is the ONLY shared hook** — all others are entity-specific.
- **Hooks manage their own loading/error state** — no global state management.

---

## 8. Shared UI Components

### 8.1 Already shared (do NOT duplicate)

| Component | File | Purpose |
|-----------|------|---------|
| `ConfirmDialog` | `components/admin/shared/ConfirmDialog.tsx` | Generic confirm dialog with variant support |
| `SearchInput` | `components/admin/shared/SearchInput.tsx` | Search input with icon |
| `LoadingState` | `components/admin/shared/LoadingState.tsx` | Centered spinner with message |
| `EmptyState` | `components/admin/shared/EmptyState.tsx` | Empty list message |
| `StatusBadge` | `components/admin/shared/StatusBadge.tsx` | Active/Inactive badge |

### 8.2 Entity-specific components

| Component | File | Purpose |
|-----------|------|---------|
| `EntityTable` | `components/admin/entity/EntityTable.tsx` | Table with header + empty state |
| `EntityRow` | `components/admin/entity/EntityRow.tsx` | Table row with action buttons |
| `EntityModal` | `components/admin/entity/EntityModal.tsx` | Modal wrapper (create/edit) |
| `EntityForm` | `components/admin/entity/EntityForm.tsx` | Form fields + field-level validation |

### 8.3 Component guidelines

- **All components are presentational** — they receive data and callbacks via props.
- **No hooks inside components** — state lives in hooks, components just render.
- **Entity-specific components use TypeScript interfaces** — define a `EntityTableProps` type.
- **Shared components are fully generic** — no entity-specific logic.
- **Use Tailwind CSS** — consistent styling across all components.
- **Include `aria-label` and `title`** for accessibility.
- **Modal components handle escape/click-outside dismissal** internally.

---

## 9. State Management Flow

### 9.1 Data flow diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Page Component (app/admin/entity/page.tsx)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  State: modalOpen, editingEntity, confirmDialog       │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│         ┌────────────────────┼────────────────────┐          │
│         ▼                    ▼                    ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ useEntity   │    │ useEntity   │    │ useConfirm  │      │
│  │ (list)      │    │ Mutations   │    │ Dialog      │      │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘      │
│         │                   │                                │
│         ▼                   ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  entityClient (lib/api/entityClient.ts)               │  │
│  │  fetch → /api/admin/entity                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│                              ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Routes (app/api/admin/entity/)                   │  │
│  │  try/catch → entity.service → DB                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 State ownership

| State | Owned by | Reason |
|-------|----------|--------|
| List data (`entities`) | `useEntity` | Fetch + cache + filter |
| Loading/error | `useEntity` | Per-hook lifecycle |
| Search query | `useEntity` | Client-side filter |
| Form state | `useCreateEntity` / `useEditEntity` | Per-form lifecycle |
| Field errors | `useCreateEntity` / `useEditEntity` | Per-form validation |
| Submission state | `useCreateEntity` / `useEditEntity` | Per-form loading/error |
| Modal open | Page component | Controls modal visibility |
| Editing entity | Page component | Controls which entity is being edited |
| Confirm dialog | `useConfirmDialog` | Generic state machine |
| Optimistic updates | `useEntity` helpers | Local state mutations |

### 9.3 Guidelines

- **No global state** — all state is hook-local or page-local.
- **No Redux, no Zustand, no Context** — keep it simple.
- **Each hook manages its own loading/error state** — no shared loading indicator.
- **Page component is the controller** — it orchestrates hooks and passes callbacks to components.
- **Components are purely presentational** — they receive data and callbacks via props.

---

## 10. Optimistic Update Pattern

### 10.1 Toggle (inline status change)

```typescript
const handleToggle = useCallback(
  async (entity: Entity) => {
    const newStatus = !entity.isActive;

    // 1. Optimistic local update
    updateLocalEntity(entity._id, { isActive: newStatus });

    try {
      // 2. Persist to server
      await toggleMutation(entity._id);
    } catch {
      // 3. Revert on failure
      updateLocalEntity(entity._id, { isActive: !newStatus });
    }
  },
  [toggleMutation, updateLocalEntity]
);
```

### 10.2 Delete (removal with confirm)

```typescript
const handleDeleteConfirm = useCallback(async () => {
  if (!confirmTarget) return;

  setConfirmLoading(true);
  const id = confirmTarget._id;

  // 1. Optimistic local removal
  removeEntity(id);

  try {
    // 2. Persist to server
    await deleteMutation(id);
    confirmDialogClose();
  } catch {
    // 3. Revert on failure — refetch to restore accurate state
    refresh();
    confirmDialogClose();
  } finally {
    setConfirmLoading(false);
  }
}, [confirmTarget, deleteMutation, removeEntity, refresh, setConfirmLoading, confirmDialogClose]);

const handleDeleteCancel = useCallback(() => {
  // 4. If we already removed optimistically, restore by refetching
  if (confirmTarget) {
    refresh();
  }
  cancelConfirm();
}, [confirmTarget, refresh, cancelConfirm]);
```

### 10.3 Guidelines

- **Optimistic updates happen in the page component**, NOT in the hooks.
- **Toggle reverts by flipping the field back** (same field, opposite value).
- **Delete reverts by refetching the entire list** (simpler than tracking removed item).
- **Always call `refresh()` on cancel if an optimistic delete was performed**.
- **Use `useConfirmDialog` for delete confirmation** — not for toggle.
- **No rollback transactions** — optimistic updates are best-effort.

---

## 11. Naming Conventions

### 11.1 General

| Concept | Convention | Example |
|---------|-----------|---------|
| Entity name (PascalCase) | `Entity` | `Category`, `Tag`, `Author` |
| Entity name (lowercase) | `entity` | `category`, `tag`, `author` |
| Plural | `entities` | `categories`, `tags`, `authors` |
| Variable | camelCase | `entityList`, `entityName` |
| Function | camelCase | `getEntityById`, `createEntity` |
| Type/Interface | PascalCase | `Entity`, `EntityCreateInput` |
| Constant | UPPER_SNAKE | `BASE_URL` (if needed) |

### 11.2 Hook naming

| Hook | Pattern | Example |
|------|---------|---------|
| List hook | `useEntity` | `useCategory` |
| Mutations hook | `useEntityMutations` | `useCategoryMutations` |
| Create hook | `useCreateEntity` | `useCreateCategory` |
| Edit hook | `useEditEntity` | `useEditCategory` |
| Confirm dialog | `useConfirmDialog` | (shared, not per-entity) |

### 11.3 Function naming

| Operation | Service function | Client method | API route |
|-----------|-----------------|---------------|-----------|
| List | `getAllEntities` | `list()` | `GET /api/admin/entity` |
| Create | `createEntity` | `create()` | `POST /api/admin/entity` |
| Get by ID | `getEntityById` | `getById()` | `GET /api/admin/entity/:id` |
| Update | `updateEntity` | `update()` | `PUT /api/admin/entity/:id` |
| Delete | `deleteEntity` | `delete()` | `DELETE /api/admin/entity/:id` |
| Toggle | `toggleEntityStatus` | `toggle()` | `PATCH /api/admin/entity/:id/toggle` |

### 11.4 Variable naming

```typescript
// Singular for single entity, plural for lists
const entity = await getEntityById(id);
const entities = await getAllEntities();

// Boolean flags use isActive, isPublished, etc.
const isActive = entity.isActive;

// Callbacks use handle prefix
const handleEdit = (entity: Entity) => { ... };
const handleDelete = (entity: Entity) => { ... };

// State uses descriptive names
const [modalOpen, setModalOpen] = useState(false);
const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
```

---

## 12. File Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| API routes | `route.ts` | `app/api/admin/entity/route.ts` |
| Service | `entity.service.ts` | `lib/services/category.service.ts` |
| Client API | `entityClient.ts` | `lib/api/categoryClient.ts` |
| Validation | `entity.ts` | `lib/validations/category.ts` |
| Types | `entity.ts` | `lib/types/category.ts` |
| Hooks | `useEntity.ts` | `lib/hooks/useEntity.ts` |
| Components | `EntityComponent.tsx` | `components/admin/entity/EntityTable.tsx` |
| Shared components | `ComponentName.tsx` | `components/admin/shared/ConfirmDialog.tsx` |
| Model | `Entity.ts` | `models/Category.ts` |

### Guidelines

- **All files use lowercase with hyphens or camelCase** — no spaces, no underscores.
- **Service files use `.service.ts` suffix** — distinguishes from client code.
- **Client API files use `Client` suffix** — `entityClient.ts`.
- **Validation files use entity name only** — `entity.ts` (not `entityValidation.ts`).
- **Types files use entity name only** — `entity.ts`.
- **Components use PascalCase** — `EntityTable.tsx`, `ConfirmDialog.tsx`.
- **Route files are always named `route.ts`** — Next.js convention.

---

## 13. Development Checklist

Every new CRUD module MUST pass all items before being considered complete.

### API Layer

- [ ] **Thin API routes** — routes only delegate to service layer (no business logic)
- [ ] **Manual try/catch** in each route handler
- [ ] **Uses `apiSuccess` / `apiError` from `@/lib/api-response`**
- [ ] **POST returns 201** for created resources
- [ ] **Soft delete** — sets `isActive: false`, does NOT remove document
- [ ] **Next.js 15 `params: Promise<{ id: string }>`** — params are awaited
- [ ] **Toggle endpoint** at `[id]/toggle/route.ts` (PATCH)

### Service Layer

- [ ] **Service file exists** at `lib/services/entity.service.ts`
- [ ] **Calls `await connectDB()`** at the top of every function
- [ ] **Uses `.lean()`** for all read queries
- [ ] **Validation in service layer** — routes do NOT validate directly
- [ ] **`throwNotFound(id)` helper** with consistent message format
- [ ] **All CRUD functions exported** — `create`, `update`, `delete`, `getById`, `getAll`, `toggle`

### Validation

- [ ] **Validation file exists** at `lib/validations/entity.ts`
- [ ] **Returns discriminated union** — `{ success: true; data }` or `{ success: false; errors }`
- [ ] **Auto-generates derived fields** (slug, etc.) during validation
- [ ] **Provides sensible defaults** (isActive: true, displayOrder: 0)
- [ ] **Trims all string inputs**

### Types

- [ ] **Type file exists** at `lib/types/entity.ts`
- [ ] **`Entity` type** — full entity shape
- [ ] **`EntityCreateInput` type** — omits server-managed fields
- [ ] **`EntityUpdateInput` type** — partial, allows optional slug override
- [ ] **`EntityValidationResult` type** — discriminated union

### Client API

- [ ] **Client file exists** at `lib/api/entityClient.ts`
- [ ] **All CRUD methods implemented** — list, getById, create, update, toggle, delete
- [ ] **Checks `json.success`** on every response
- [ ] **Attaches `statusCode`** to thrown errors
- [ ] **`BASE` is hardcoded** to `/api/admin/entity`

### Hooks

- [ ] **`useEntity`** — list + search + optimistic helpers
- [ ] **`useEntityMutations`** — CRUD mutation wrappers
- [ ] **`useCreateEntity`** — create form state + validation
- [ ] **`useEditEntity`** — edit form state + validation (pre-fills from entity)
- [ ] **`useConfirmDialog`** — used for delete confirmation (shared hook)

### UI Components

- [ ] **`EntityTable`** — table with header + empty state
- [ ] **`EntityRow`** — table row with action buttons
- [ ] **`EntityModal`** — modal wrapper (create/edit)
- [ ] **`EntityForm`** — form fields + field-level validation
- [ ] **Shared components used** — ConfirmDialog, SearchInput, LoadingState, EmptyState, StatusBadge
- [ ] **No duplicated shared components** — use existing ones from `components/admin/shared/`

### State Management

- [ ] **Loading state** — shows `LoadingState` while fetching
- [ ] **Error state** — shows error message on fetch failure
- [ ] **Empty state** — shows `EmptyState` when list is empty
- [ ] **Optimistic updates** — toggle updates locally, delete removes locally
- [ ] **Revert on failure** — toggle flips back, delete refetches

### TypeScript

- [ ] **Full TypeScript coverage** — no `any` types (except in casts after `.lean()`)
- [ ] **Type-safe API client** — all methods have return types
- [ ] **Type-safe hooks** — all state has explicit types
- [ ] **Type-safe components** — all props have interface types
- [ ] **`tsc --noEmit` passes** — no new TypeScript errors

### Accessibility

- [ ] **`aria-label` on interactive elements** — buttons, inputs
- [ ] **`aria-modal="true"` on modals**
- [ ] **`role="dialog"` on modals**
- [ ] **Escape key closes modals**
- [ ] **Click-outside closes modals**

---

## 14. Known Inconsistencies

The following inconsistencies exist in the Categories reference implementation. They are documented here so future modules can avoid them or fix them incrementally.

### 14.1 Two response utility files exist

| File | Exports | Used by |
|------|---------|---------|
| `lib/api-response.ts` | `apiSuccess`, `apiError`, `handleService` | API routes |
| `lib/api/response.ts` | `successResponse`, `errorResponse` | `apiHandler` (unused by routes) |

**Impact**: Confusion about which to use. The routes use `apiSuccess`/`apiError` from `@/lib/api-response`, NOT the `apiHandler` wrapper.

**Recommendation**: Consolidate to a single file. Deprecate `lib/api-response.ts` in favor of `lib/api/response.ts` + `apiHandler`.

### 14.2 `apiHandler` wrapper exists but is not used

The `apiHandler` factory in `lib/api/apiHandler.ts` provides automatic error handling with `AppError` support, but the Categories routes use manual try/catch blocks instead.

**Impact**: Inconsistent error handling across the codebase. Routes that use `apiHandler` would be thinner and more consistent.

**Recommendation**: Migrate all routes to use `apiHandler` with `AppError` subclasses for domain errors.

### 14.3 Validation is duplicated in three places

| Location | Purpose |
|----------|---------|
| `lib/validations/entity.ts` | Server-side validation (service layer) |
| `lib/hooks/useCreateEntity.ts` | Client-side validation (create form) |
| `lib/hooks/useEditEntity.ts` | Client-side validation (edit form) |

**Impact**: Rules must be updated in three places when validation changes. Risk of drift between server and client rules.

**Recommendation**: Extract validation rules to a shared constants file or use a validation library that works on both sides (e.g., Zod).

### 14.4 Service layer uses `Record<string, unknown>` for input

All service functions accept `Record<string, unknown>` instead of typed input objects.

**Impact**: No compile-time safety at the service boundary. Validation happens inside the service but the input type is loose.

**Recommendation**: Use typed input parameters (`EntityCreateInput`, `EntityUpdateInput`) at the service function signature level.

### 14.5 No barrel files for services

`lib/services/index.ts` does not exist. Services are imported by full file path.

**Impact**: Longer import paths, harder to refactor (renaming requires updating all imports).

**Recommendation**: Create `lib/services/index.ts` barrel file for cleaner imports.

### 14.6 `AppError` class exists but is not used

`lib/errors/AppError.ts` defines a structured error class with `statusCode`, `errorCode`, and `isOperational` fields, but the Categories module does not use it.

**Impact**: Dead code. The `apiHandler` supports `AppError` but no routes use it.

**Recommendation**: Either adopt `AppError` across all routes or remove it if not needed.

### 14.7 No pagination in list hooks

`useEntity` fetches ALL entities at once and filters client-side. No pagination or server-side filtering.

**Impact**: Performance degrades as entity count grows. Not suitable for large datasets.

**Recommendation**: Add server-side pagination to `getAllEntities` and `useEntity` for entities with >100 items.

### 14.8 Model file location

The Mongoose model (`models/Category.ts`) lives in the root `models/` directory, not alongside the entity module.

**Impact**: Models are shared across modules but not co-located with their business logic.

**Recommendation**: Keep models in `models/` for now (shared resource), but document the convention.

---

## Appendix A: Quick Start Checklist

When starting a new CRUD module, copy this checklist:

```markdown
## Entity: [Name]

### Files to create
- [ ] `app/api/admin/entity/route.ts`
- [ ] `app/api/admin/entity/[id]/route.ts`
- [ ] `app/api/admin/entity/[id]/toggle/route.ts`
- [ ] `app/admin/entity/page.tsx`
- [ ] `lib/api/entityClient.ts`
- [ ] `lib/services/entity.service.ts`
- [ ] `lib/validations/entity.ts`
- [ ] `lib/types/entity.ts`
- [ ] `lib/hooks/useEntity.ts`
- [ ] `lib/hooks/useEntityMutations.ts`
- [ ] `lib/hooks/useCreateEntity.ts`
- [ ] `lib/hooks/useEditEntity.ts`
- [ ] `models/Entity.ts`
- [ ] `components/admin/entity/EntityTable.tsx`
- [ ] `components/admin/entity/EntityRow.tsx`
- [ ] `components/admin/entity/EntityModal.tsx`
- [ ] `components/admin/entity/EntityForm.tsx`

### Files to reuse (DO NOT create)
- [ ] `lib/hooks/useConfirmDialog.ts` (already exists)
- [ ] `components/admin/shared/ConfirmDialog.tsx` (already exists)
- [ ] `components/admin/shared/SearchInput.tsx` (already exists)
- [ ] `components/admin/shared/LoadingState.tsx` (already exists)
- [ ] `components/admin/shared/EmptyState.tsx` (already exists)
- [ ] `components/admin/shared/StatusBadge.tsx` (already exists)
- [ ] `lib/api-response.ts` (already exists)
- [ ] `lib/mongodb.ts` (already exists)
- [ ] `lib/slug.ts` (already exists, if slug generation needed)

### Verification
- [ ] `tsc --noEmit` passes (no new errors)
- [ ] All API routes return `{ success, data }` shape
- [ ] All client methods check `json.success`
- [ ] Loading state shows during fetch
- [ ] Error state shows on fetch failure
- [ ] Empty state shows when list is empty
- [ ] Optimistic updates work (toggle + delete)
- [ ] Confirm dialog works for delete
- [ ] Modal opens/closes correctly
- [ ] Form validation works (client + server)
- [ ] Accessibility: aria-labels, escape key, click-outside
```

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Entity** | A CMS resource (Category, Tag, Author, Page, etc.) |
| **Service layer** | `lib/services/` — business logic + DB operations |
| **Client API** | `lib/api/entityClient.ts` — fetch wrapper for client components |
| **Optimistic update** | Update local state before server confirms, revert on failure |
| **Soft delete** | Set `isActive: false` instead of removing the document |
| **Discriminated union** | A type with a common field that distinguishes variants (e.g., `success: true` vs `success: false`) |
| **`.lean()`** | Mongoose method that returns plain JavaScript objects instead of Mongoose documents |
| **`apiHandler`** | Factory function that wraps route handlers with automatic error handling |
| **`AppError`** | Structured error class with `statusCode`, `errorCode`, `isOperational` |

---

## 15. Engineering Principles

This section documents the architectural philosophy behind the CRUD template. These principles guide design decisions for new modules and refactors to existing ones. They are not rules — they are heuristics that have emerged from repeated patterns across the Categories module.

### 15.1 Composition over inheritance

Favor composition. The codebase does not use class hierarchies or inheritance chains. Hooks compose small, focused functions; components compose shared pieces. If you find yourself reaching for inheritance, stop — composition is simpler and more testable.

### 15.2 Behavior reuse over code reuse

Reuse behavior, not code. Two hooks that happen to share a `fetch` call should not be merged into a shared function unless the fetch logic itself is genuinely complex. Copy-paste is preferable to an abstraction that couples unrelated modules.

### 15.3 Do not abstract prematurely

Every shared abstraction in this codebase has a cost: it must be understood, maintained, and justified. Create shared code only when you have seen the pattern repeat **at least twice** across **different entities**. The Categories module was the first — it did not earn shared status by virtue of being well-written. Future modules must earn it by repeating the pattern independently.

### 15.4 Entity-agnostic shared components

Every shared component must work with any entity without modification. If a "shared" component contains entity-specific logic (a hardcoded entity name, an entity-specific prop, an entity-specific callback shape), it does not belong in `components/admin/shared/`.

### 15.5 Shared hooks encapsulate reusable behavior

Every shared hook must encapsulate behavior that is genuinely reusable across entities. The `useConfirmDialog` hook qualifies because every CRUD module needs a confirm dialog state machine. A hook that only makes sense for one entity does not belong in `lib/hooks/` as a shared file.

### 15.6 Thin API routes

API routes are dispatchers, not decision-makers. A thin route:
- Parses input (query params, body)
- Delegates to the service layer
- Wraps the result in a response

If a route contains more than 10 lines of business logic, move that logic to the service layer.

### 15.7 Business logic belongs in services

The service layer is the single source of truth for domain rules. Routes do not validate. Components do not fetch directly from the database. Services sit in the middle, owning all domain logic.

### 15.8 Validation belongs in validators

Validation logic lives in `lib/validations/`. Routes delegate to validators. Hooks may duplicate validation for immediate client feedback, but the validator is the authoritative source. If a validation rule changes, the validator is the first file to update.

### 15.9 Errors should be domain-specific

Error messages should describe the domain problem, not the implementation detail. `"A category with slug \"tech\" already exists"` is better than `"UniqueIndexError: E11000"`. When the `AppError` class is adopted (see Section 14.2), errors will carry structured codes that map to domain concepts.

### 15.10 UI should remain declarative

Components should be declarative: given props, they render output. Side effects (fetching, mutating) live in hooks. If a component contains both rendering logic and side effects, extract the side effects into a hook. The page component is the controller; components are the view.

### 15.11 Optimistic updates only when rollback is possible

Optimistic updates improve perceived performance, but only when failure can be cleanly reversed. A toggle can flip back. A delete can refetch. An operation that triggers cascading side effects (e.g., deleting a category that has 500 associated articles) should not be optimistic — it should be pessimistic (wait for server confirmation).

### 15.12 Simplicity beats cleverness

The codebase should be boring. If a solution requires a diagram to explain, it is too clever. Prefer explicit over implicit. Prefer verbose over concise. A developer should be able to understand a module by reading the page component and the service file — nothing more.

### 15.13 Favor readability over fewer lines of code

A function that is 30 lines long and obvious is better than a function that is 8 lines long and requires re-reading. Named intermediate variables, explicit type annotations, and clear control flow are investments in future maintainability.

### 15.14 Avoid generic abstractions that hide intent

Generic utilities (e.g., a `fetchWithInterceptors`, a `useGenericCrud` hook) hide intent by operating at a level of indirection. When something goes wrong, the debugging path is longer. The codebase prefers specific, named functions (`getAllCategories`, `createCategory`) over generic ones (`executeCrudOperation`).

### 15.15 Before creating a shared abstraction

Before introducing any new shared code (a shared hook, a shared component, a shared utility, a barrel file), mentally evaluate these questions:

- [ ] **Has this pattern repeated at least twice across different entities?** (Not "will it be needed" — has it actually appeared.)
- [ ] **Is the abstraction entity-agnostic?** (Can it work with any entity without modification?)
- [ ] **Does the benefit of sharing outweigh the cost of explaining it?** (Every shared file must be documented and understood by every developer.)
- [ ] **Could the consuming modules just copy the code instead?** (Duplication is cheaper than a wrong abstraction.)
- [ ] **Is this abstraction adding a new concept developers must learn?** (If yes, justify it.)
- [ ] **Can I explain this abstraction in one sentence?** (If not, it is too complex.)
- [ ] **Is this abstraction reversible?** (Can I remove it without breaking existing modules?)

If you cannot answer **yes** to at least the first three questions, do not create the abstraction. Let the pattern earn its place by repeating independently in two different modules.

---

## Appendix B: Glossary
