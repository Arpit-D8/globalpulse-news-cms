# Category Management — API Test Plan

**Sprint 1, Stage 3.5**  
**Purpose:** Manual backend verification checklist for the Category Management API.  
**Scope:** All `/api/admin/categories` endpoints.  
**Out of scope:** UI integration, automated tests, authentication checks.

---

## Base URL

```
http://localhost:3000/api/admin/categories
```

---

## 1. GET /api/admin/categories

List all categories with optional `isActive` filter.

### 1.1 — List all categories (no filter)

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/categories` |
| **Headers** | `Content-Type: application/json` |

**Expected response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Politics",
      "slug": "politics",
      "description": "...",
      "color": "#6b7280",
      "icon": "",
      "displayOrder": 0,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status code:** `200`

**Validation checks:**
- [ ] Response body has `success: true`
- [ ] `data` is an array
- [ ] Each item has all expected fields (`_id`, `name`, `slug`, `description`, `color`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
- [ ] Results are sorted by `displayOrder` ascending, then `name`

---

### 1.2 — List active categories only

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/categories?isActive=true` |

**Expected response:** Same shape as 1.1, but all items have `isActive: true`.

**Status code:** `200`

**Validation checks:**
- [ ] Every item in `data` has `isActive: true`

---

### 1.3 — List inactive categories only

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/categories?isActive=false` |

**Expected response:** Same shape as 1.1, but all items have `isActive: false`.

**Status code:** `200`

**Validation checks:**
- [ ] Every item in `data` has `isActive: false`

---

### 1.4 — Empty result set

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/categories?isActive=true` (when no active categories exist) |

**Expected response:**

```json
{ "success": true, "data": [] }
```

**Status code:** `200`

**Validation checks:**
- [ ] `data` is an empty array (not `null`)

---

### Edge cases

| Scenario | Expected behavior |
|---|---|
| Unknown query param (e.g. `?foo=bar`) | Ignored; returns all categories |
| `isActive` with invalid value (e.g. `?isActive=maybe`) | Treated as falsy → returns inactive categories |

---

### Failure cases

| Scenario | Expected status | Expected response |
|---|---|---|
| MongoDB connection down | `500` | `{ success: false, message: "..." }` |

---

## 2. POST /api/admin/categories

Create a new category.

### 2.1 — Valid creation

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"name": "Technology", "description": "Tech news", "displayOrder": 5}` |

**Expected response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Technology",
    "slug": "technology",
    "description": "Tech news",
    "color": "#6b7280",
    "icon": "",
    "displayOrder": 5,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Status code:** `201`

**Validation checks:**
- [ ] `success: true`
- [ ] `data.slug` is auto-generated from `name` (lowercase, hyphenated)
- [ ] `data.displayOrder` matches input
- [ ] `data.isActive` defaults to `true`
- [ ] `data.color` defaults to `#6b7280`
- [ ] `data._id` is a non-empty string

---

### 2.2 — Creation with all fields

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"name": "Sports", "description": "Sports coverage", "displayOrder": 3, "color": "#e11d48", "icon": "football", "isActive": true}` |

**Expected response:** Same shape as 2.1, with all provided fields reflected.

**Status code:** `201`

---

### 2.3 — Missing name (required field)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"description": "No name"}` |

**Expected response:**

```json
{ "success": false, "message": "Validation failed: {\"name\":\"Category name is required\"}" }
```

**Status code:** `400`

**Validation checks:**
- [ ] `success: false`
- [ ] `message` contains validation error for `name`

---

### 2.4 — Name too short (below minimum)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"name": "A"}` |

**Expected response:**

```json
{ "success": false, "message": "Validation failed: {\"name\":\"Category name must be at least 2 characters\"}" }
```

**Status code:** `400`

---

### 2.5 — Name too long (exceeds 50 chars)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}` (51+ chars) |

**Expected response:**

```json
{ "success": false, "message": "Validation failed: {\"name\":\"Category name must be at most 50 characters\"}" }
```

**Status code:** `400`

---

### 2.6 — Description too long (exceeds 250 chars)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"name": "Test", "description": "<251 characters of text>"}` |

**Expected response:**

```json
{ "success": false, "message": "Validation failed: {\"description\":\"Description must be at most 250 characters\"}" }
```

**Status code:** `400`

---

### 2.7 — Duplicate slug (name collision)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"name": "Politics"}` (where "Politics" already exists) |

**Expected response:**

```json
{ "success": false, "message": "Validation failed: ..." }
```
or
```json
{ "success": false, "message": "A category with slug \"politics\" already exists" }
```

**Status code:** `400` or `409`

**Validation checks:**
- [ ] Category is not duplicated
- [ ] If auto-suffixed, the new slug is unique (e.g. `politics-1`)

---

### 2.8 — Invalid displayOrder (negative)

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/admin/categories` |
| **Body** | `{"name": "Test", "displayOrder": -1}` |

**Expected response:**

```json
{ "success": false, "message": "Validation failed: {\"displayOrder\":\"Display order must be a non-negative integer\"}" }
```

**Status code:** `400`

---

### Edge cases

| Scenario | Expected behavior |
|---|---|
| `name` with leading/trailing spaces | Trimmed before storage |
| `name` with special characters | Slugified (e.g. `"Cinema & Arts"` → `"cinema-arts"`) |
| `displayOrder` as float (e.g. `3.5`) | Rejected by validation |
| `displayOrder` omitted | Defaults to `0` |
| `isActive: false` in body | Category created as inactive |
| Empty body `{}` | Rejected — `name` is required |

---

### Failure cases

| Scenario | Expected status | Expected response |
|---|---|---|
| Invalid JSON body | `400` or `500` | `{ success: false, message: "..." }` |
| MongoDB connection down | `500` | `{ success: false, message: "..." }` |
| Duplicate slug (unique index violation) | `400` or `500` | Error message |

---

## 3. GET /api/admin/categories/[id]

Retrieve a single category by `_id`.

### 3.1 — Valid lookup

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/categories/<valid-id>` |

**Expected response:**

```json
{
  "success": true,
  "data": {
    "_id": "<valid-id>",
    "name": "Politics",
    "slug": "politics",
    "description": "...",
    "color": "#6b7280",
    "icon": "",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Status code:** `200`

**Validation checks:**
- [ ] `success: true`
- [ ] `data._id` matches the requested id

---

### 3.2 — Non-existent id

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/categories/000000000000000000000000` |

**Expected response:**

```json
{ "success": false, "message": "Category with id 000000000000000000000000 not found" }
```

**Status code:** `404`

---

### 3.3 — Invalid ObjectId format

| Field | Value |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/categories/not-an-id` |

**Expected behavior:** Mongoose returns `null` from `findById`.

**Expected response:**

```json
{ "success": false, "message": "Category not found" }
```

**Status code:** `404`

---

## 4. PUT /api/admin/categories/[id]

Update an existing category (partial update).

### 4.1 — Update name and description

| Field | Value |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/admin/categories/<valid-id>` |
| **Body** | `{"name": "National", "description": "National news updated"}` |

**Expected response:**

```json
{
  "success": true,
  "data": {
    "_id": "<valid-id>",
    "name": "National",
    "slug": "national",
    "description": "National news updated",
    "color": "#6b7280",
    "icon": "",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Status code:** `200`

**Validation checks:**
- [ ] `name` and `description` are updated
- [ ] `slug` is regenerated from the new `name`
- [ ] `updatedAt` reflects the change
- [ ] Unchanged fields (`color`, `icon`, `displayOrder`, `isActive`) retain their values

---

### 4.2 — Partial update (only displayOrder)

| Field | Value |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/admin/categories/<valid-id>` |
| **Body** | `{"displayOrder": 10}` |

**Expected response:** Same shape as 4.1, with only `displayOrder` changed.

**Status code:** `200`

---

### 4.3 — Update with invalid name (too short)

| Field | Value |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/admin/categories/<valid-id>` |
| **Body** | `{"name": "X"}` |

**Expected response:**

```json
{ "success": false, "message": "Validation failed: {\"name\":\"Category name must be at least 2 characters\"}" }
```

**Status code:** `400`

**Validation checks:**
- [ ] Category is not modified

---

### 4.4 — Update non-existent id

| Field | Value |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/admin/categories/000000000000000000000000` |
| **Body** | `{"name": "Test"}` |

**Expected response:**

```json
{ "success": false, "message": "Category with id 000000000000000000000000 not found" }
```

**Status code:** `404`

---

### Edge cases

| Scenario | Expected behavior |
|---|---|
| Update with empty body `{}` | Validation uses existing `name`; may succeed or fail depending on current state |
| Update name that creates duplicate slug | Slug is auto-suffixed (e.g. `politics-1`) |
| Update `isActive` to `false` | Allowed; category becomes inactive |

---

## 5. DELETE /api/admin/categories/[id]

Soft-delete a category (sets `isActive: false`).

### 5.1 — Valid delete

| Field | Value |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/admin/categories/<valid-id>` |

**Expected response:**

```json
{
  "success": true,
  "data": {
    "_id": "<valid-id>",
    "name": "Politics",
    "slug": "politics",
    "description": "...",
    "color": "#6b7280",
    "icon": "",
    "displayOrder": 0,
    "isActive": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Status code:** `200`

**Validation checks:**
- [ ] `success: true`
- [ ] `data.isActive` is `false`
- [ ] Subsequent `GET /api/admin/categories?isActive=false` returns this category
- [ ] Subsequent `GET /api/admin/categories?isActive=true` does NOT return this category

---

### 5.2 — Delete non-existent id

| Field | Value |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/admin/categories/000000000000000000000000` |

**Expected response:**

```json
{ "success": false, "message": "Category with id 000000000000000000000000 not found" }
```

**Status code:** `404`

---

### Edge cases

| Scenario | Expected behavior |
|---|---|
| Delete already-deleted category | Returns updated document with `isActive: false` |
| Articles referencing this category | Category is soft-deleted; articles remain (referential integrity preserved) |

---

## 6. PATCH /api/admin/categories/[id]/toggle

Toggle the `isActive` status of a category.

### 6.1 — Toggle active → inactive

| Field | Value |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/categories/<active-id>/toggle` |

**Expected response:**

```json
{
  "success": true,
  "data": {
    "_id": "<active-id>",
    "name": "Politics",
    "slug": "politics",
    "description": "...",
    "color": "#6b7280",
    "icon": "",
    "displayOrder": 0,
    "isActive": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Status code:** `200`

**Validation checks:**
- [ ] `success: true`
- [ ] `isActive` is flipped from `true` to `false`

---

### 6.2 — Toggle inactive → active

| Field | Value |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/categories/<inactive-id>/toggle` |

**Expected response:** Same shape as 6.1, with `isActive: true`.

**Status code:** `200`

**Validation checks:**
- [ ] `isActive` is flipped from `false` to `true`

---

### 6.3 — Toggle non-existent id

| Field | Value |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/categories/000000000000000000000000/toggle` |

**Expected response:**

```json
{ "success": false, "message": "Category with id 000000000000000000000000 not found" }
```

**Status code:** `404`

---

## 7. PATCH /api/admin/categories/reorder

Reorder multiple categories by setting explicit `displayOrder` values.

### 7.1 — Valid reorder

| Field | Value |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/categories/reorder` |
| **Body** | `{"reorders": [{"id": "id-1", "displayOrder": 2}, {"id": "id-2", "displayOrder": 1}, {"id": "id-3", "displayOrder": 3}]}` |

**Expected response:**

```json
{
  "success": true,
  "data": [
    { "_id": "id-2", "name": "...", "displayOrder": 1, "isActive": true, ... },
    { "_id": "id-1", "name": "...", "displayOrder": 2, "isActive": true, ... },
    { "_id": "id-3", "name": "...", "displayOrder": 3, "isActive": true, ... }
  ]
}
```

**Status code:** `200`

**Validation checks:**
- [ ] `success: true`
- [ ] `data` is sorted by `displayOrder` ascending
- [ ] Each category's `displayOrder` matches the input
- [ ] Only the specified categories are updated

---

### 7.2 — Empty reorders array

| Field | Value |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/categories/reorder` |
| **Body** | `{"reorders": []}` |

**Expected response:**

```json
{ "success": true, "data": [] }
```

**Status code:** `200`

---

### 7.3 — Missing reorders field

| Field | Value |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/categories/reorder` |
| **Body** | `{}` |

**Expected response:**

```json
{ "success": false, "message": "reorders must be an array" }
```

**Status code:** `400`

---

### 7.4 — Non-existent id in reorders

| Field | Value |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/categories/reorder` |
| **Body** | `{"reorders": [{"id": "000000000000000000000000", "displayOrder": 1}]}` |

**Expected behavior:** `bulkWrite` silently ignores non-existent ids.

**Expected response:**

```json
{ "success": true, "data": [] }
```

**Status code:** `200`

**Validation checks:**
- [ ] No error is thrown
- [ ] `data` is empty (no matching documents updated)

---

### Edge cases

| Scenario | Expected behavior |
|---|---|
| Duplicate ids in reorders array | Last write wins (MongoDB bulkWrite behavior) |
| displayOrder as float (e.g. `1.5`) | Accepted by MongoDB (no validation at service level) |
| More ids than exist in database | Only existing ids are updated; non-existent are silently skipped |

---

### Failure cases

| Scenario | Expected status | Expected response |
|---|---|---|
| Invalid JSON body | `400` | `{ success: false, message: "..." }` |
| MongoDB connection down | `500` | `{ success: false, message: "..." }` |

---

## Appendix: Quick Reference

### Endpoint Summary

| Method | Path | Purpose | Success Code | Error Codes |
|---|---|---|---|---|
| `GET` | `/api/admin/categories` | List all (optional `isActive` filter) | `200` | `500` |
| `POST` | `/api/admin/categories` | Create category | `201` | `400` |
| `GET` | `/api/admin/categories/[id]` | Get by id | `200` | `404` |
| `PUT` | `/api/admin/categories/[id]` | Update category | `200` | `400`, `404` |
| `DELETE` | `/api/admin/categories/[id]` | Soft delete | `200` | `404` |
| `PATCH` | `/api/admin/categories/[id]/toggle` | Toggle isActive | `200` | `404` |
| `PATCH` | `/api/admin/categories/reorder` | Bulk reorder | `200` | `400` |

### Response Shape Convention

**Success:**
```json
{ "success": true, "data": <T> }
```

**Error:**
```json
{ "success": false, "message": "<string>" }
```

### Validation Rules Reference

| Field | Type | Min | Max | Required | Default |
|---|---|---|---|---|---|
| `name` | string | 2 chars | 50 chars | Yes | — |
| `slug` | string | — | — | Auto-generated | — |
| `description` | string | — | 250 chars | No | `""` |
| `displayOrder` | integer | 0 | — | No | `0` |
| `color` | string | — | 20 chars | No | `"#6b7280"` |
| `icon` | string | — | 50 chars | No | `""` |
| `isActive` | boolean | — | — | No | `true` |
