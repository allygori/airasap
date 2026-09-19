# Repository Instructions for AI Coding Assistants

This file is the repository-wide instruction contract. It describes the
implemented codebase and mandatory rules for changes. Detailed guidance lives
in `.agents/*.md`.

## Source of truth and document status

Use this priority when facts conflict:

1. The current source code, tests, `package.json`, `tsconfig.json`, and config files.
2. This file for repository-wide rules.
3. The active guidance in `.agents/`.
4. PRDs, roadmaps, implementation plans, `.memory/`, `.todos/`, and prototype notes.

Documentation must distinguish reality from intent:

- `[CURRENT]` — implemented and used by the application.
- `[TARGET]` — desired architecture or recommendation; do not assume it exists.
- `[LEGACY]` — existing code retained for compatibility or possible extraction; do not copy for new work.
- `[DEPRECATED]` — must not be used for new code.

When documentation and code disagree, inspect the code and tests first. Never
invent a route, module, model, endpoint, or abstraction because an old document
mentions it.

Before changing an area, read the relevant guide:

- React/UI: `.agents/react-components.md`
- TypeScript/style: `.agents/TYPESCRIPT.md`
- Domain boundaries: `.agents/module-boundaries.md`
- API/database/auth/tenant behavior: `.agents/api-and-data-access.md`
- Database fields and schema naming: `.agents/database-schema.md`
- Feature flags: `.agents/feature-flags.md`
- Tests and fixtures: `.agents/testing.md`
- Legacy and transitional code: `.agents/legacy-code.md`
- Change workflow: `.agents/workflows.md`

The complete documentation map is in `.agents/README.md`.

## Current project snapshot

[CURRENT] This repository is `airasap`; the UI and product material may still
use the Pasaria.id/Airasap branding. The implemented product is currently a
seller-operations platform centered on products, orders, inventory, accounting,
reports, marketplace file imports, and dashboard workflows.

[CURRENT] It is a modular monolith: one Next.js App Router application contains
the UI, route handlers, domain services, repositories, MongoDB models, and
infrastructure. `app/` is the routing boundary, `modules/` is the primary
business-domain boundary, and `lib/` contains shared infrastructure.

[CURRENT] There is no complete generic marketplace landing-page builder, JSON
layout engine, A/B testing engine, AI optimization engine, or unified feature
flag service in the current implementation. Those concepts in old PRDs are
future product direction, not available APIs.

## Stack and important versions

Versions below are resolved in `pnpm-lock.yaml` unless noted otherwise:

- Node.js: audited with `v24.19.0`; the repository does not currently declare an `engines` constraint.
- Package manager: `pnpm@11.19.0`.
- Next.js: `16.2.4`, App Router, Turbopack build.
- React and React DOM: `19.2.4`.
- TypeScript: `5.9.3`, strict mode enabled.
- MongoDB driver: `7.2.0`; Mongoose: `9.6.1`.
- Better Auth: `1.6.23`.
- Zod: `4.4.3`.
- Jest: `30.4.2`, using `next/jest`.
- ESLint: `9.39.4`.
- Tailwind CSS: `4.2.4`; shadcn tooling: `4.7.0`.
- Prettier: `3.8.3`.

This is Next.js 16. Use `proxy.ts` for the request proxy convention. Do not
introduce a legacy `middleware.ts`. Read the relevant local Next.js guide in
`node_modules/next/dist/docs/` before using unfamiliar Next.js APIs.

## Non-negotiable implementation rules

- Keep new business logic inside the appropriate domain module.
- Prefer `route -> validation -> tenant/auth context -> service -> repository -> model`.
- Do not access Mongoose directly from presentational React components.
- Do not bypass tenant scoping, authorization, soft-delete rules, or accounting lifecycle guards.
- Never trust client-provided tenant headers as an authorization mechanism.
- A client-side feature flag is never an authorization mechanism.
- Do not add new code under `.trash`, `*.trash`, prototype-only folders, or `lib/auth-original`.
- Do not copy old `/api/products` documentation; the active dashboard API is versioned under `/api/v1/dashboard/...`.
- Do not create a second database connection, auth configuration, response envelope, table system, or form system without documenting the decision.
- Do not use `any` in new code. Use a precise type or `unknown` with narrowing.
- Do not expose raw internal error messages, stack traces, secrets, uploaded file contents, or tenant data in responses/logs.
- Bound pagination, upload size, regex/search inputs, aggregation work, and other user-controlled resources.
- Use `next/link` for internal navigation and keep client boundaries as small as practical.
- Update the relevant `.agents/*.md` guide when a change alters an architectural convention.

## Folder boundaries

- `app/` — Next.js pages, layouts, route handlers, route-local `_components`, and route composition.
- `app/api/v1/dashboard/` — current versioned dashboard REST API.
- `app/api/auth/[...all]/` — Better Auth catch-all handler.
- `app/api/profit-intelligence/` — separate legacy/standalone marketplace file-analysis API; see `.agents/legacy-code.md`.
- `components/ui/` — generic UI primitives; no domain logic.
- `components/form/` — shared TanStack React Form primitives.
- `components/data-table/` and `components/dashboard/collection/` — existing table implementations; do not add another system without a decision.
- `modules/` — business domains and their services, repositories, schemas, models, and tests.
- `lib/` — infrastructure and cross-cutting helpers: database, auth, API, query parsing, file handling, dates, formatting, SKU, and XLSX utilities.
- `constant/`, `hooks/`, `types/` — small shared declarations only; do not place domain workflows here.
- `public/` — static assets.
- `.data/`, `.upload/` — local/imported data; treat as sensitive and never commit new personal data or log its contents.
- `.trash/`, `*.trash/`, `.memory/`, `.todos/`, `.artifacts/` — historical, temporary, or planning material; not implementation examples.

See `.agents/ARCHITECTURE.md` for the complete route/domain map and request
flow. See `.agents/module-boundaries.md` before adding or moving a module, and
`.agents/database-schema.md` before adding or changing persisted fields.

## Authentication, tenant context, and data access

- Server Better Auth configuration is `lib/auth/auth.ts`.
- Client Better Auth configuration is `lib/auth/auth-client.ts`.
- Auth HTTP integration is `app/api/auth/[...all]/route.ts`.
- `lib/api/tenant-context.ts` resolves the current session, organization, store, and user context.
- `lib/db/connection.ts` owns the cached Mongoose connection and model registration.
- `modules/base.repository.ts` is the current domain repository base. `lib/db/base.repository.ts` is legacy and must not be used for new modules.
- Application models commonly use `organization` and optional `store` fields. Better Auth models use `organizationId`; do not mix these conventions without an explicit mapping.
- Queries and mutations must include the tenant context and must not allow a caller to override it.
- Accounting operations may require a Mongoose `ClientSession` and lifecycle guards; preserve both when composing services.

Detailed rules are in `.agents/api-and-data-access.md`.

## API and error conventions

The current versioned API uses:

```ts
// success
{ success: true, data, meta? }

// error
{ success: false, error: { code, message, details? } }
```

Use `apiSuccess()` and `apiError()` from `lib/api/response.ts`, and use
`withValidation()` from `lib/api/validate.ts` where the route fits that
pattern. Validate body, query, and route params with Zod. Keep HTTP concerns in
the route handler and business rules in the module service.

The standalone profit-intelligence API still has older response shapes. Do not
spread those shapes into the versioned dashboard API; migrate deliberately.

## React and TypeScript defaults

- Server Components are the default.
- Add `'use client'` only for state, event handlers, browser APIs, or client hooks.
- Use `type` for new object types unless an `interface` is required by an API or declaration merging.
- Use `const`; avoid `var` and avoid mutable state unless it is necessary.
- Use lower-case kebab/dot-suffix filenames, PascalCase component/class names, and camelCase functions/variables/hooks.
- Use `*.schema.ts` for Zod schemas, `*.service.ts` for business operations, `*.repository.ts` for persistence, and `*.test.ts`/`*.test.tsx` for tests.
- New MongoDB and API/domain fields use `snake_case` by default. Better Auth-owned fields preserve the library-required `camelCase` contract; see `.agents/database-schema.md`.
- Use the `@/*` alias for repository-root imports.

See `.agents/react-components.md` and `.agents/TYPESCRIPT.md` for examples.

## Verified commands

Use pnpm commands from the repository root:

```bash
pnpm dev
pnpm run typecheck
pnpm run lint
pnpm test --runInBand
pnpm run build
pnpm start
pnpm exec prettier . --check
pnpm exec prettier . --write
```

`pnpm test -- --runInBand` is not the preferred form in this Windows setup;
the extra separator can be forwarded as a Jest pattern. The package scripts
for `prettier:check` and `prettier:write` currently invoke `npx`; use
`pnpm exec prettier ...` directly unless those scripts are later corrected.

The last repository audit recorded:

- `pnpm run typecheck` passed.
- `pnpm run lint` failed on existing lint issues, including `any`, unused imports, old component patterns, and nested archive files.
- `pnpm test --runInBand` had 16 passing suites and 6 failing suites; failures included an empty test suite, archive fixtures, and Jest handling of ESM-only `nanoid`.
- Prettier reported 215 files needing formatting.
- `pnpm run build` reached optimized production build creation but was not verified to completion; top-level database/auth initialization is a likely build-time blocker.

Do not silently claim any of these checks pass. If you change the relevant
area, rerun the narrowest useful check and report failures accurately.

## Required AI workflow

1. Inspect the target source and its tests before deciding the pattern.
2. Read the relevant `.agents/*.md` guide.
3. Confirm whether the requested behavior is `[CURRENT]`, `[TARGET]`, or `[LEGACY]`.
4. Reuse an existing module, response envelope, form, table, auth helper, and database connection where applicable.
5. Keep route/UI code thin and put business rules in the domain module.
6. Check tenant isolation, authorization, validation, error mapping, loading/error states, and testability.
7. Run the narrowest relevant typecheck/test first, then broader checks when practical.
8. Review `git diff` and `git diff --check`; ensure no source, fixture, secret, or generated file changed unintentionally.
9. Update documentation only when the documented current behavior or required convention changed.

When uncertain, inspect the repository and state the ambiguity. Do not create
plausible-looking paths or APIs based only on old documentation.
