# Database Schema and Field-Naming Guidelines

## Status

This is the active database naming guideline for new application/domain code.
It does not require a broad rename of existing collections or fields.

## Default convention: `snake_case`

Prefer `snake_case` for field names owned by this application, especially in
MongoDB schemas, API/domain DTOs, imported normalized data, and persisted
records:

```ts
type ProductRecord = {
  organization_id: string;
  store_id?: string;
  product_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
};
```

Use the same convention for nested fields unless a boundary requires a
different external name. Prefer names that are explicit and stable:

- `created_at`, `updated_at`, `deleted_at`
- `organization_id`, `store_id`, `user_id`
- `product_id`, `order_id`, `variant_id`
- `is_active`, `is_deleted`, `amount_total`

Do not introduce `camelCase` merely because it is common in JavaScript. Field
naming is a data contract, not a local variable style choice.

## Required exceptions: Better Auth

The Better Auth version used by this project does not support mapping its
persisted field names to the application's preferred `snake_case` names.
Better Auth-owned models and adapter data must therefore preserve the exact
field names required by the library, for example:

```ts
type BetterAuthOwnedFields = {
  userId: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
};
```

This exception applies only to Better Auth integration/storage contracts. Do
not copy its `camelCase` field style into new business-domain models.

When crossing the auth boundary:

- keep Better Auth's exact fields inside the Better Auth adapter/model boundary;
- map to the application's domain context explicitly when needed;
- do not rename Better Auth fields in-place or add a second unofficial auth schema;
- do not mix `organizationId` and `organization_id` in one contract without an explicit mapper;
- document any new Better Auth-required field added by an upgrade.

The distinction is intentional:

```text
Better Auth persistence: organizationId, createdAt, updatedAt
Application domain:      organization_id, created_at, updated_at
                         ↓ explicit adapter/context mapping
```

## Other boundary exceptions

Preserve external names when a third-party API, marketplace workbook, framework
contract, or existing public API requires them. Isolate those names at the
boundary and normalize into the application's preferred convention as soon as
practical.

Examples:

- Shopee/XLSX column labels may be localized or use source-specific names.
- Next.js special file names are framework contracts and are not database fields.
- MongoDB `_id` and Mongoose metadata retain their library-defined names.
- Existing public response fields must not be renamed during an unrelated change.

## Schema design rules

- Keep persistence schema types separate from UI view models when their contracts differ.
- Use explicit mappers for Better Auth, marketplace imports, and external APIs.
- Make tenant ownership fields explicit and preserve the existing project convention for the model being changed.
- Use `deleted_at` for soft deletion where the module already supports it; do not silently hard-delete operational data.
- Keep timestamps and nullable fields explicit in TypeScript and Zod schemas.
- Add indexes based on actual tenant-scoped query patterns, uniqueness requirements, and lifecycle filters.
- Do not add speculative `layout`, `experiment`, or generic JSON fields because an old PRD mentions them.
- Do not rename existing fields solely for style consistency without a migration and compatibility plan.

## Naming review checklist

Before adding or changing a field, ask:

1. Is this field owned by application/domain code? Use `snake_case`.
2. Is it required by Better Auth or another external contract? Preserve the exact required name and isolate it.
3. Is it part of an existing public contract? Preserve it unless the task includes migration/versioning.
4. Is the mapping documented and tested at the boundary?
5. Are tenant, soft-delete, timestamp, nullability, uniqueness, and index implications explicit?

Use current `*.model.ts`, `*.schema.ts`, migrations/data scripts, and tests as
the source of truth for actual fields. This document defines the convention for
new work; it is not a complete database inventory.
