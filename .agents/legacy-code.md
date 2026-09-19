# Legacy, Prototype, and Historical Code

## Purpose

This repository contains useful old code and plans, but they are not all valid
examples for new work. Preserve them when they may be extracted or migrated;
keep them out of the default implementation path.

## Do not use for new code

### Archive folders

- `.trash/`
- any nested `*.trash/` directory
- generated `.next/` output
- personal `.data/` and `.upload/` content

Archive code may explain an old design but can contain broken imports, missing
fixtures, and obsolete routes. Do not restore it by copying without verifying
every dependency.

### Authentication

`lib/auth-original/` contains an older Better Auth configuration. The active
server configuration is `lib/auth/auth.ts`, the client is
`lib/auth/auth-client.ts`, and the catch-all route is
`app/api/auth/[...all]/route.ts`.

### Repository base

`lib/db/base.repository.ts` is an older duplicate. New repositories use
`modules/base.repository.ts`, whose tenant field conventions and pagination
behavior are the current domain baseline.

### UI systems

The repository has more than one form/table implementation:

- current shared form primitives in `components/form/`;
- current URL-driven table code in `components/data-table/`;
- dashboard collection/table code in `components/dashboard/collection/`;
- older table examples in `components/tables/`;
- older auth form implementations in `components/forms/`.

When modifying a feature, follow the system already used by that feature. Do
not add another abstraction. A future consolidation must be an explicit task.

### XLSX parsers

Shopee parser generations under `lib/xlsx/shopee/v1/` and `v2/` both exist and
are imported by different workflows. Check imports before changing or deleting
one. Do not assume a v2 type, fixture, or parser can replace v1.

### Prototype and marketing routes

`app/homepage-2/`, `app/test-homepage/`, `app/start-selling/`, and
`app/kitchensink/` are not the canonical dashboard architecture. They may be
useful visual references, but they are not proof of a reusable design system or
production data flow.

`app/products/c02aQS/` is a hardcoded/demo product landing page. It is not a
generic product-page or JSON-layout engine.

### Profit intelligence

`app/api/profit-intelligence/`,
`app/tools/marketplace-profit-intelligence/`, and the related XLSX/model code
form a separate, evolving tool. It has older response shapes and direct model
patterns. Preserve compatibility when touching it, but use the current
dashboard API/module rules for new platform features.

### Old documentation

The following kinds of documents are reference-only unless explicitly updated:

- old `/api/products`, `/engines`, and `/jobs` examples;
- marketplace/layout/A-B-testing PRDs;
- implementation plans that describe files or models no longer present;
- `modules/products/README.md`, whose route/header examples are not the current canonical API contract;
- `.agents2/` and `.memory/` notes when they conflict with current source.

## How to reuse legacy code safely

1. Confirm that the behavior is still required.
2. Identify current imports and runtime usage with `rg`.
3. Compare data fields, tenant semantics, auth behavior, and error contract.
4. Extract only the useful logic into the active boundary.
5. Add tests before changing behavior.
6. Do not silently make a legacy route or response the new standard.

## Cleanup policy

Do not delete legacy code merely because it is old if the user may need it for
data migration or extraction. Do not make it look active by adding new imports.
When a legacy area is proven unused, remove it in a focused cleanup change and
record the reason in the change summary.
