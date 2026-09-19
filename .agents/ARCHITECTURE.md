# Architecture and Current Codebase Map

## Status

Everything in the current-state sections is `[CURRENT]` unless explicitly
marked `[TARGET]`, `[LEGACY]`, or `[DEPRECATED]`.

## High-level architecture

The application is a modular monolith built on Next.js App Router:

```text
Browser/UI
   ↓ fetch or Better Auth client
Next.js page or route handler
   ↓ validation + auth/tenant context
Domain service/use case
   ↓ repository
Mongoose model
   ↓
MongoDB
```

The UI and HTTP API are in the same Next.js application. The primary domain
boundary is `modules/`; `app/` composes routes and pages; `lib/` provides
infrastructure and cross-cutting helpers.

This is not currently a microservice system. Do not add microservice-shaped
folders such as `engines/` or `jobs/` merely because an old document lists them.

## Stack

Resolved versions:

- Next.js `16.2.4`, App Router, Turbopack build
- React and React DOM `19.2.4`
- TypeScript `5.9.3`, strict mode
- MongoDB driver `7.2.0`, Mongoose `9.6.1`
- Better Auth `1.6.23`
- Zod `4.4.3`
- Jest `30.4.2` with `next/jest`
- ESLint `9.39.4`
- Tailwind CSS `4.2.4`
- shadcn tooling `4.7.0`
- Prettier `3.8.3`

The package manager is `pnpm@11.19.0`. The repository currently has no Node
`engines` field; the audit environment used Node `v24.19.0`.

## Folder responsibilities

### `app/`

Next.js routes, layouts, pages, route handlers, and route-local components.
Use `_components/` for components that belong only to one route subtree.

Important areas:

- `app/(auth)/` — `/login`, `/register`, and `/forgot-password`.
- `app/dashboard/` — seller dashboard pages for products, orders, inventory, reports, accounting, and onboarding.
- `app/api/v1/dashboard/` — current versioned dashboard REST API.
- `app/api/auth/[...all]/` — Better Auth catch-all route.
- `app/api/profit-intelligence/` — separate marketplace file-analysis API with older conventions.
- `app/tools/marketplace-profit-intelligence/` — upload/result UI for the file-analysis tool.
- `app/products/c02aQS/` — hardcoded/demo landing-page-like product UI.
- `app/homepage-2/`, `app/test-homepage/`, `app/start-selling/`, `app/kitchensink/` — prototype, marketing, or showcase areas; see `legacy-code.md` before reusing them.

Next special files retain their framework meaning: `page.tsx`, `layout.tsx`,
`route.ts`, `error.tsx`, `loading.tsx`, `not-found.tsx`, and `proxy.ts`.

### `modules/`

Business domains and application logic. Current domain areas include:

- identity/auth-related models
- organizations, members, invitations, sessions, and stores
- products and variants
- orders and marketplace order enrichment
- inventory, locations, mappings, and movements
- accounting, journal entries, periods, settlements, onboarding, cutover, and reports
- expenses
- files and blob metadata
- reports and aggregation pipelines
- marketplace profit-intelligence data processing

New domain behavior should follow the structure described in
`module-boundaries.md`.

### `components/`

Reusable UI. `components/ui/` contains generic shadcn/base-ui primitives and
must not contain domain workflows. `components/form/` contains TanStack React
Form primitives. Existing table implementations are in
`components/data-table/`, `components/dashboard/collection/`, and the older
`components/tables/`; do not introduce another table system without a decision.

### `lib/`

Infrastructure and shared cross-cutting code: database connection, auth,
tenant context, API response/validation/query helpers, fetchers, file storage,
date/formatting, SKU helpers, and XLSX import utilities.

### Other shared folders

- `constant/` — stable shared constants only.
- `hooks/` — reusable React hooks only.
- `types/` — genuinely cross-domain types; prefer domain-local types otherwise.
- `providers/` — currently not the primary provider location; active providers are composed in `app/providers.tsx`.
- `public/` — static assets.
- `.data/` and `.upload/` — local/imported data; treat as sensitive.

## Route and proxy map

`proxy.ts` currently handles browser navigation redirects for protected
dashboard/onboarding paths and auth paths. It checks Better Auth session cookie
presence; it is not a complete API authorization layer. The API authentication
block in the proxy is commented out, so route handlers and services must enforce
authorization themselves.

The active auth paths are `/login`, `/register`, and `/forgot-password`. Do not
create links to `/signup` or `/auth/signup` without first verifying the route.

## Database and tenant architecture

- `lib/db/connection.ts` owns the cached Mongoose connection and imports models for registration.
- `lib/auth/auth.ts` owns server-side Better Auth configuration.
- `lib/auth/auth-client.ts` owns the browser client.
- `lib/api/tenant-context.ts` derives session, user, organization, and store context.
- `modules/base.repository.ts` is the current repository base.
- `lib/db/base.repository.ts` is a legacy duplicate with different field conventions.
- Application models commonly use `organization` and optional `store`; Better Auth models use `organizationId`.
- The multi-tenancy plugin and repository filters require tenant context for applicable models.

Do not create a new `MongoClient` or Mongoose connection per request. Do not
accept organization/store values from the client as proof of access.

## Current API response families

The versioned dashboard API uses `lib/api/response.ts`:

```ts
{ success: true, data, meta? }
{ success: false, error: { code, message, details? } }
```

The profit-intelligence API still contains older shapes such as `{ error }`,
`{ report }`, and `{ success, sid, reportId }`. Treat that area as an explicit
compatibility boundary; do not copy its response format into new dashboard
routes.

## Reporting architecture

`modules/reports/@shared` contains active aggregation helpers for filters,
groups, transforms, lookups, outputs, and aggregation-builder composition.
Prefer extending these helpers for reporting behavior instead of embedding
large aggregation pipelines in route handlers.

## Accounting architecture

Accounting contains domain lifecycle guards, typed domain error handling,
MongoDB sessions/transactions, onboarding/cutover/reconstruction flows, and
reporting. Preserve the lifecycle guard and optional `ClientSession` when
calling or composing accounting services. Do not treat accounting as a simple
CRUD module.

## Current gaps

The following are not implemented as unified platform abstractions:

- generic JSON-driven landing-page/layout renderer
- A/B testing engine
- AI optimization engine
- unified feature-flag provider
- unified table/form system
- fully consistent auth/tenant guard across every route

These are `[TARGET]` areas. Their documentation must not be written as if the
implementation already exists.
