# Module Boundaries and Modularity Rules

## Goal

The codebase is a modular monolith. Modularity means business capabilities
have explicit ownership and dependency direction; it does not mean creating a
folder for every abstraction or pretending that modules are already deployable
microservices.

## Dependency direction

For new dashboard functionality, prefer:

```text
app page / route handler
        ↓
module application service or use case
        ↓
repository
        ↓
Mongoose model / infrastructure
```

UI components may call a typed API client or receive data from a page. They
must not import Mongoose models, database connections, or server-only auth.

Routes may do HTTP work: parse the request, invoke validation, resolve auth and
tenant context, call a service, and map the result to a response. They should
not contain multi-step business workflows, database queries, or accounting
rules.

## Module anatomy

Use only the files that the module needs. A typical module can look like:

```text
modules/orders/
  order.types.ts
  order.schema.ts
  order.errors.ts
  order.model.ts
  order.repository.ts
  order.service.ts
  order.mapper.ts
  order.test.ts
  index.ts
```

Existing modules use both singular and plural filenames. Match the local
convention when modifying an existing module; use the documented suffixes for
new files:

- `*.types.ts` — domain types and value shapes.
- `*.schema.ts` — Zod input/contract schemas.
- `*.model.ts` — Mongoose schema/model registration.
- `*.repository.ts` — persistence queries and mutations.
- `*.service.ts` — business operations and orchestration.
- `*.mapper.ts` — conversion between persistence, domain, and response shapes.
- `*.errors.ts` — typed domain errors.
- `*.test.ts` — unit/integration tests near the behavior they verify.
- `index.ts` — intentionally small public API for the module.

Do not create all of these files if the behavior does not need them.

## Public module API

Other modules should import from a module's public entry point or an explicitly
documented public file. Avoid deep imports such as:

```ts
import { internalHelper } from '@/modules/orders/private/internal-helper';
```

Prefer:

```ts
import { orderService } from '@/modules/orders';
```

The public entry point should expose services, input types, and domain errors
that another module is allowed to use. It should not expose raw collection
queries merely for convenience.

## Cross-module communication

- Call another module's service/use case, not its repository or model.
- Keep shared contracts small and explicit.
- Do not import one module's private UI, schema internals, or database helpers.
- If two modules need the same primitive, move only the stable primitive to `lib/` or a deliberately named shared module.
- Do not create `lib/utils/` as a dumping ground for domain logic.
- Avoid circular dependencies. If two modules require each other, introduce a higher-level application workflow, a stable shared contract, or an event boundary.

Cross-module operations that need atomicity should receive and forward the same
Mongoose `ClientSession`. Never silently start a second transaction or ignore a
session passed by a caller.

## Service rules

Services own business rules, invariants, orchestration, and domain errors.
They may call repositories and other public module services. They should not
format HTTP responses or inspect `NextRequest` directly.

Services must:

- receive explicit context and input types;
- enforce authorization-relevant business rules server-side;
- distinguish not-found, conflict, validation, forbidden, and internal errors;
- preserve tenant context;
- avoid accidental upserts for update operations;
- be deterministic where practical and testable without a browser.

Avoid conflict detection based only on localized error-message text such as
`error.message.includes('sudah ada')`. Use typed error codes or database error
classification.

## Repository rules

Repositories own database queries, filtering, pagination, projections, and
persistence mechanics. They must apply tenant and soft-delete filters by
default where the model requires them.

- Use `modules/base.repository.ts` for new domain repositories.
- Do not use the legacy `lib/db/base.repository.ts` for new code.
- Use `.lean()` for read-only results and treat the result as a plain object.
- Do not call document methods such as `.save()` on a value returned by `.lean()`.
- Prefer explicit `findOneAndUpdate`/`updateOne` semantics for updates.
- Do not use `upsert: true` unless creation-on-missing is explicitly required and documented.
- Whitelist sortable/filterable fields.
- Bound page size, aggregation limits, and user-controlled search.
- Escape or otherwise constrain user-provided regular expressions.

## Model rules

Models define persistence shape and indexes. They should not contain request,
session, or UI logic. Keep external/API field mapping explicit when the stored
field names differ from the API contract.

Use existing Mongoose model-registration guards such as
`models.Name || model(...)`; do not create duplicate model registrations.

## Incremental migration strategy

This repository contains direct model access and duplicate patterns. New work
must follow the target boundary even if old code does not. Migrate legacy code
only when touching the feature or when a focused refactor is requested:

1. Identify the current route, service, repository, model, and tests.
2. Add or reuse the public service boundary.
3. Preserve response and data compatibility unless the task explicitly changes it.
4. Add tenant/error/contract tests.
5. Remove the old path only after imports and runtime usage are verified.

Do not perform a broad “move every file into modules” refactor as part of an
unrelated feature.
