# AGENTS.md — Current Codebase Context

> Canonical repository guide for AI coding assistants. This file describes the
> code that exists today, not the original Pasaria PRD or the future roadmap.
> It was audited on 2026-09-19. Statements marked `[RECOMMENDATION]` are
> desired improvements and are not necessarily implemented.

## 0. Executive summary

- Repository/package name: `airasap`.
- Product/application branding in the UI and metadata: Pasaria.id/Airasap.
- Architecture: one Next.js App Router monolith containing UI, REST route
  handlers, domain services, Mongoose models, spreadsheet importers, and
  analytics/accounting pipelines.
- The actively implemented product is currently centered on seller operations:
  products, orders, inventory, marketplace reports, accounting, onboarding,
  and Shopee XLSX import/enrichment. The original marketplace + landing-page
  builder/A-B testing vision is only partially represented by demo/marketing
  pages; do not assume those systems exist.
- Current inventory: 54 `page.tsx` files, 66 `route.ts` handlers, 447 `.ts`
  files, 241 `.tsx` files. Jest discovers 22 test suites in the current
  checkout because ignored nested `.trash` tests are still discovered.
- `app/` is the routing boundary. `modules/` is the main domain boundary.
  `lib/` is shared infrastructure. `components/` is shared UI.
- Prefer the current source code and this file over stale examples in
  `.agents/`, `modules/products/README.md`, and the original root README.

## 1. Technology and important versions

Versions below come from `package.json`/`pnpm-lock.yaml`; the runtime versions
were also checked in the current environment.

| Area | Current choice |
| --- | --- |
| Runtime observed | Node `v24.19.0`; `package.json` does not declare an `engines` constraint |
| Package manager | pnpm `11.19.0` (`packageManager` is pinned) |
| Web framework | Next.js `16.2.4`, App Router, Turbopack in the build output |
| UI runtime | React `19.2.4`, React DOM `19.2.4` |
| Language | TypeScript `5.9.3` from the lockfile; `strict: true`, `noEmit: true` |
| Database | MongoDB driver `7.2.0`, Mongoose `9.6.1` |
| Authentication | Better Auth `1.6.23`, MongoDB adapter, organization plugin, custom store plugin |
| Validation | Zod `4.4.3` |
| Styling | Tailwind CSS `4.2.4`, `@tailwindcss/postcss`, `tw-animate-css`, CSS variables in `app/globals.css` |
| Component system | shadcn CLI `4.7.0`, `components.json` style `base-nova`, `@base-ui/react` primitives |
| Icons | Existing code uses both `lucide-react` and Hugeicons; `components.json` says Hugeicons |
| Forms | `@tanstack/react-form` `1.32.0`; shared form hook in `components/form/form.hook.tsx` |
| Tables | `@tanstack/react-table` `8.21.3`; dnd-kit for sortable tables |
| Charts | Recharts `3.8.0` |
| Files | `@vercel/blob` `2.5.0`, local checksum helpers, `xlsx` `0.18.5` |
| Tests | Jest `30.4.2`, `next/jest`, Testing Library packages, Node test environment |
| Quality tools | ESLint `9.39.4` + `eslint-config-next` `16.2.4`; Prettier `3.8.3` + Tailwind plugin |

Important framework conventions:

- This is Next 16. Use `proxy.ts`; do not create a legacy `middleware.ts`
  unless the project deliberately changes its Next version/convention.
- Route handler params are typed as promises in several files, for example
  `{ params }: { params: Promise<{ id: string }> }`.
- There are no Server Actions in the current codebase (`'use server'` was not
  found). Mutations currently go through route handlers or Better Auth client
  APIs.
- The `@/*` TypeScript alias maps to the repository root. Use it for imports
  across top-level folders.

Environment variable names used by the project include:

```text
MONGODB_URI
BETTER_AUTH_SECRET
BETTER_AUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
BLOB_READ_WRITE_TOKEN
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_DESCRIPTION
SHOPEE_ORDER_PROCESSING_FEE
NODE_ENV
```

Never copy values from `.env` into source, documentation, logs, tests, or
responses. `.env*` is ignored by Git.

## 2. Commands

Run from the repository root with pnpm.

```powershell
pnpm install
pnpm dev
pnpm run typecheck
pnpm run lint
pnpm test
pnpm test --runInBand
pnpm test:watch
pnpm run build
pnpm run start
```

Formatting commands:

```powershell
# Current scripts call `npx`, which is not available in the audited Windows
# environment. These direct local-binary commands work in this checkout.
.\node_modules\.bin\prettier.CMD . --check
.\node_modules\.bin\prettier.CMD . --write

# Preferred script fix for a normal pnpm installation:
pnpm exec prettier . --check
pnpm exec prettier . --write
```

The package scripts are:

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start` and requires a successful production build
- `lint`: `eslint`
- `prettier:check`: currently `npx prettier . --check` (the script itself is
  brittle when `npx` is not installed)
- `prettier:write`: currently `npx prettier . --write`
- `test`: `jest`
- `test:watch`: `jest --watch`
- `typecheck:old`: `tsc --noEmit`
- `typecheck`: `next typegen && tsc --noEmit`
- `prepare`: `husky`

Do not use `pnpm test -- --runInBand` in this Windows setup: pnpm forwards the
extra separator as a Jest pattern and produces “No tests found”. Use
`pnpm test --runInBand` or the local Jest binary instead.

### Last audit results

These are observations, not guarantees about a future checkout:

- `pnpm run typecheck`: passed; Next route types were generated successfully.
- `pnpm run lint`: failed with 390 errors and 291 warnings. Main causes are
  explicit `any`, old `children` prop usage, unused imports, and nested legacy
  files that are still linted.
- `pnpm test --runInBand`: 16 suites passed and 6 failed; 35 tests passed and
  1 failed. Failures are described in the testing section below.
- Prettier check via the local binary: 215 files need formatting.
- `pnpm run build`: reached “Creating an optimized production build ...” but
  did not finish during the audit and was stopped. `lib/auth/auth.ts` performs
  a top-level `MongoClient.connect()`, so a reachable MongoDB/auth environment
  is required and is a likely build-time hang point. Treat build status as
  unverified until it completes in the target environment.
- `pnpm list --depth 0` could not open pnpm’s SQLite store in the sandbox; the
  lockfile remains the version source of truth.

## 3. Architecture and request flow

The dominant flow for the dashboard is:

```text
Client Component
  -> fetch('/api/v1/...') or Better Auth client
  -> app/api/.../route.ts
  -> withValidation(...) / Zod
  -> getTenantContext() + db.connect()
  -> domain Service
  -> domain Repository or an explicit domain operation
  -> Mongoose Model / MongoDB
  -> apiSuccess(...) or apiError(...)
```

Actual architectural patterns:

- **Modular monolith:** domain code is grouped under `modules/`, but all
  domains share one Next.js process and one MongoDB connection.
- **App Router BFF/API:** UI and backend endpoints live in the same app. Most
  dashboard pages are Client Components that fetch internal route handlers.
  There are 33 client `page.tsx` files and 21 server `page.tsx` files in the
  current route tree.
- **Service + repository + model:** the main products, orders, stores,
  inventory, accounting, expenses, files, and organization modules use this
  layering. A route should be a thin adapter; business rules belong in a
  service or domain operation.
- **Zod schema as request contract:** module `*.schema.ts` files define input
  and response schemas; `*.dto.ts` generally re-exports schemas and derives
  types with `z.infer`. Accounting has some older `ReturnType`-based DTOs, so
  do not assume every DTO is Zod-inferred.
- **Mongo aggregation pipeline composition:** `modules/reports/@shared` has
  filters, groups, transforms, lookups, output stages, and an
  `AggregateBuilder`. Reports are primarily computed from orders rather than
  stored report documents.
- **Soft deletion:** several operational models use `deleted_at`; list and
  lookup operations are expected to filter it out unless a restore/admin flow
  explicitly needs deleted data.
- **Accounting lifecycle:** accounting has explicit onboarding, cutover,
  active-state guards, domain error codes, journal entries, inventory
  movements, settlement reconciliation, retries, and Mongo transactions in
  onboarding flows.

Do not infer that the original planned folders `/engines`, `/jobs`, or
`/config` exist. They do not exist in the current source tree.

## 4. Folder structure and responsibilities

### Top-level application folders

| Folder | Responsibility and notes |
| --- | --- |
| `app/` | Next App Router routes, layouts, pages, route handlers, and route-local UI. This is the URL boundary, not the domain layer. |
| `app/(auth)/` | Route group for `/login`, `/register`, and `/forgot-password`; the group name is omitted from URLs. Interactive form pieces live in private `_components/` folders. |
| `app/dashboard/` | Authenticated seller dashboard for overview, products, orders, inventory, reports, and accounting. Most screens fetch `/api/v1/dashboard/...`. |
| `app/api/auth/[...all]/` | Better Auth catch-all handler; exports Better Auth `GET` and `POST`. |
| `app/api/v1/dashboard/` | Current versioned REST surface for tenant-scoped dashboard operations. |
| `app/api/profit-intelligence/` | Separate, unversioned multipart/report API used by the public marketplace profit-intelligence tool. Its response format and auth model differ from `/api/v1`. |
| `app/tools/marketplace-profit-intelligence/` | XLSX upload and report UI; result page is a Server Component that reads the report model directly. |
| `app/products/c02aQS/` | Hardcoded/demo product landing page with local sections and product context; not a generic dynamic product system. |
| `app/homepage-2/`, `app/test-homepage/`, `app/start-selling/` | Marketing/prototype pages with different branding/content generations. Treat them as separate experiments unless the task explicitly targets one. |
| `app/kitchensink/` | Minimal development/demo route. |
| `components/ui/` | Shared primitive components generated/adapted around shadcn/base-ui. Keep these generic; do not add domain fetching here. |
| `components/dashboard/` | Dashboard shell, sidebar, navigation, charts, theme controls, and a second `collection/` table implementation. |
| `components/data-table/` | Generic client data table with URL-driven pagination, sorting, filtering, TanStack Table, and optional dnd-kit sorting. |
| `components/tables/` | Older/sample table implementation used by the overview demo page. Do not assume it is the canonical table system. |
| `components/form/` | Shared TanStack React Form hook, lazy field components, form fields, submit button, and field helpers. |
| `components/forms/` | Older/shared auth form variants. Active auth pages use route-local components under `app/(auth)/.../_components`. Verify usage before reusing these. |
| `components/shared/` | Cross-feature layout/general components. |
| `components/pasaria/`, `components/icons/`, `components/illustrations/`, `components/charts/`, `components/sections/` | Branding, icons, illustrations, charts, and reusable visual sections. Existing icon conventions are mixed. |
| `modules/` | Core domain modules. See the domain map below. |
| `lib/` | Cross-domain infrastructure: DB connection, auth, API validation/response helpers, fetch helpers, file/checksum helpers, formatters, date/number utilities, SKU generation, and XLSX importers. |
| `constant/` | Shared enums/configuration for platforms, Shopee statuses, timezones, menus, accounting templates, and stats. |
| `hooks/` | Small client hooks (`use-mobile`, media query, debounce, isomorphic layout effect). |
| `types/` | Shared type declarations; currently very small (`types/icon.ts`). |
| `scripts/` | Standalone utilities such as `gen-sku.ts`. |
| `public/` | Static Next assets and product/marketing images. |
| `.data/` | Local spreadsheet fixtures and development data; ignored by Git and required by some tests. |
| `.upload/` | Local upload artifacts; ignored by Git. Current file service primarily uploads to Vercel Blob. |
| `.trash/` and nested `*.trash/` folders | Ignored archives/experiments. They are not canonical source, but nested files are still seen by TypeScript, ESLint, and Jest unless explicitly excluded. |
| `.agents/` | Product PRDs, aspirational architecture docs, skills, and planning material. Root `AGENTS.md` is the codebase source of truth. |
| `providers/` | Present but currently empty; the active provider wrapper is `app/providers.tsx`. |

### Domain module map

Most active modules follow this shape:

```text
modules/<domain>/<feature>.
  schema.ts       # Zod request/response schema (when present)
  dto.ts          # exported inferred DTO types (when present)
  model.ts        # Mongoose schema/model
  repository.ts   # data access and tenant filters
  service.ts      # business operations
```

| Module | Responsibility |
| --- | --- |
| `modules/users`, `accounts`, `organizations`, `members`, `invitations`, `sessions`, `verifications` | Better Auth adapter/domain models and organization/session data. `modules/accounts` is auth account data; it is not the accounting chart of accounts. |
| `modules/stores` | Store/workspace CRUD, active store context, and `channels/` for marketplace channel connections. |
| `modules/products` | Product and embedded variant CRUD, SKU/price/COGS-related fields, soft delete, search, bulk status changes, and mass XLSX product import. |
| `modules/orders` | Order CRUD, marketplace order data, soft delete/restore, search/bulk updates, mass uploads, order enrichment, product matching, and order-to-accounting integration. |
| `modules/inventory` | Inventory items, locations, product/variant mappings, movements, quantity/value tracking, and movement posting. |
| `modules/accounting` | Chart of accounts, journal entries, periods, opening balances, settlements, audit log, lifecycle/onboarding, cutover, historical reconstruction, accounting reports, and order/inventory integration. |
| `modules/expenses` | Organization-scoped expense operations with accounting audit integration. |
| `modules/files` | Tenant-scoped file metadata and Vercel Blob upload/checksum handling. |
| `modules/reports` | Order-based sales/overview/product/customer/order/operation/cancellation/voucher analytics and aggregation pipeline composition. |
| `modules/tools/marketing/profit-intelligence` | Standalone report document model for the public Shopee profit-intelligence tool. Its schema file is currently empty; the model is used directly. |
| `modules/@shared` | Very small/scratch shared area; do not confuse it with `modules/reports/@shared`, which is the active aggregation helper area. |

## 5. Database, authentication, and tenant rules

### Database connection

- `lib/db/connection.ts` owns the cached Mongoose connection and imports
  models up front so populate/model registration is stable during Next hot
  reloads.
- It caches connection state on `global.mongoose`; do not create a new
  connection per request.
- Most API handlers explicitly call `await db.connect()` before using a
  service/repository.
- Mongoose models generally use `models.Name || model(...)` to avoid model
  recompilation errors.

### Authentication

- Server Better Auth config: `lib/auth/auth.ts`.
- Client Better Auth config/hooks: `lib/auth/auth-client.ts`.
- Catch-all endpoint: `app/api/auth/[...all]/route.ts`.
- Organization support comes from Better Auth’s organization plugin.
- Store selection is implemented by the custom Better Auth plugin in
  `lib/auth/plugins/store/server.ts`; it updates active organization/store
  values on the session.
- `proxy.ts` redirects based on the presence of a Better Auth session cookie.
  This is only a route UX gate, not sufficient authorization by itself.

### Tenant context

`getTenantContext()` in `lib/api/tenant-context.ts` calls
`auth.api.getSession({ headers: await headers() })` and returns:

```ts
{
  organizationId: string;
  storeId: string;
  userId: string;
}
```

Rules for new tenant-scoped code:

1. Resolve the session server-side with `getTenantContext()` or an equivalent
   server auth helper.
2. Reject missing organization context before reading or mutating domain data.
3. Pass tenant context into the service/repository constructor.
4. Keep organization filters on every direct model query and validate store
   ownership against the active organization.
5. Do not trust `x-organization-id` or `x-store-id` from the browser as the
   authorization source.

Application-owned Mongoose models use `organization` and sometimes `store`
paths (ObjectId references). Better Auth adapter models use their own
`organizationId`-style fields. Do not mix these names casually.

`lib/db/plugins/multi-tenancy.ts` adds a Mongoose query hook for models that
have an `organization` path. It requires an organization context and forces
the organization filter. Current repositories also add explicit tenant
filters. This defense-in-depth is valuable; do not bypass it.

There are two base repository implementations:

- `modules/base.repository.ts` is the current domain base. It uses
  `organization` and conditionally `store`, supports pagination, and is used
  by the active domain repositories.
- `lib/db/base.repository.ts` is an older duplicate with inconsistent
  `organizationId`/`organization` handling. Do not use it for new modules.

### Transaction and lifecycle rules

- Accounting onboarding uses `mongoose.startSession()` and
  `session.withTransaction(...)`.
- Many accounting/inventory/order methods accept an optional
  `ClientSession`; propagate it through repository calls when an operation is
  part of a transaction.
- Accounting operations must use `assertAccountingModuleActive` and honor
  `AccountingDomainError` codes.
- A production MongoDB deployment must support transactions (replica set or
  equivalent) before relying on these flows.

## 6. Routing and API conventions

### Active route groups

- Public/marketing: `/`, `/start-selling`, `/homepage-2`, `/test-homepage`,
  `/tools/marketplace-profit-intelligence`.
- Auth: `/login`, `/register`, `/forgot-password`.
- Dashboard: `/dashboard/...` for products, orders, inventory, reports,
  accounting, onboarding, and overview.
- Versioned dashboard API: `/api/v1/dashboard/...`.
- Better Auth: `/api/auth/...`.
- Standalone profit-intelligence API: `/api/profit-intelligence/...`.

The old documentation examples `/api/products`, `/api/orders`, `/api/layout`,
and `/api/experiments` are not current routes. The active product endpoint is
`/api/v1/dashboard/products`.

### Versioned API handler pattern

Most current dashboard handlers use:

```ts
export const GET = withValidation(
  { query: QuerySchema },
  async (_request, { validatedQuery }) => {
    const tenantContext = await getTenantContext();
    // check organization/store as required
    await db.connect();
    const result = await new SomeService(tenantContext).get(...);
    return apiSuccess(result);
  }
);
```

`withValidation()` in `lib/api/validate.ts` can parse body, query, and
`context.params`. It converts invalid JSON and `ZodError` into a structured
validation response.

### Response envelope

Use `apiSuccess()` and `apiError()` from `lib/api/response.ts` for new
versioned endpoints:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi input gagal",
    "details": []
  }
}
```

Common codes are `BAD_REQUEST`, `VALIDATION_ERROR`, `NOT_FOUND`,
`UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, and `INTERNAL_ERROR`.

The unversioned profit-intelligence endpoints intentionally have a different
legacy contract (`{ error }`, `{ report }`, `{ success, sid, reportId }`) and
use direct Mongoose operations. Do not mix that contract into `/api/v1`.

### Proxy protection

`proxy.ts` currently protects paths beginning with `/dashboard` and
`/onboarding`, and redirects authenticated users away from `/login`,
`/signup`, and `/forgot-password`. The actual auth page is `/register`, not
`/signup`, so this is a known route mismatch. There are also old links to
`/auth/signup` and `/login-2` in prototype/shared code.

The API-secret protection block in `proxy.ts` is commented out. API handlers
must therefore perform their own session and tenant checks. Never assume the
proxy protects API authorization.

## 7. Naming and implementation conventions

These are the conventions actually visible in the active code, plus rules to
follow for new work.

### Files and symbols

- Route files use Next special names: `page.tsx`, `layout.tsx`, `route.ts`,
  `error.tsx`.
- Domain files use lower-case kebab/dot suffixes:
  `inventory-item.service.ts`, `product.repository.ts`,
  `accounting-ledger-ui.tsx`, `report.client.tsx`, `product.form.tsx`.
- Components and classes use PascalCase: `ProductForm`, `ProductService`,
  `ProductModel`.
- Functions, variables, hooks, and methods use camelCase.
- Mongo fields and API/domain DTO fields mostly use snake_case:
  `created_at`, `deleted_at`, `product_id`, `store_id`.
- Schemas are PascalCase with `Schema` suffix. DTO types use `DTO` suffix.
- Prefer `type` for new object/type declarations. Existing code still has
  interfaces in generic utilities/components; do not churn unrelated legacy
  interfaces.
- Prefer `unknown` in catches and external payload boundaries; avoid new
  `any`. Existing code has substantial `any` usage and lint currently fails.
- Prefer `const`; ESLint already reports some old `let` declarations that are
  never reassigned.

### React and Next

- Keep pages/layouts as Server Components by default. Add `'use client'` only
  when hooks, browser APIs, event handlers, or client-only libraries require
  it. Put interactive leaves in route-local `_components/` where practical.
- Use `next/link` for internal navigation. Raw `<a>` tags are appropriate for
  external URLs or same-page anchors; a current lint error comes from an
  internal `<a href="/">`.
- Use `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`) in
  Client Components. Do not import the old Pages Router APIs.
- Use `notFound()` for missing server-rendered resources where the route
  defines a not-found experience. Only two segment-level `error.tsx` files
  currently exist (`dashboard/products` and `dashboard/orders`); add a
  boundary deliberately when adding a critical segment.

### Forms and UI

- Shared forms use `@tanstack/react-form` through `components/form/form.hook.tsx`
  (`useAppForm`, `withForm`, `withFieldGroup`) and lazy field components.
- Put domain/request validation in a module `*.schema.ts`; keep a
  route-specific presentation schema next to the route when it is not a
  domain contract.
- Use Tailwind utilities and the existing CSS tokens in `app/globals.css`.
  Use `cn` from `lib/utils/ui` when conditional class composition is needed.
- Reuse `components/ui` primitives before introducing another primitive
  library. The repository currently mixes Hugeicons and Lucide; follow the
  local area unless intentionally standardizing icons.
- Do not put API calls, tenant logic, or business calculations into generic
  `components/ui` primitives.

### Data access

- New domain operations should be `route -> service -> repository -> model`.
- Use `.lean()` for read-only repository results and return plain DTO-shaped
  data. If a document must be mutated with `.save()`, do not first turn it
  into a lean object.
- Reuse `lib/api/query-builder.ts` for bounded pagination/search where it fits;
  its default limit is 10 and max limit is 100.
- Whitelist sortable/filterable fields and bound every user-controlled limit.

## 8. Error handling conventions and current problems

Current conventions:

- API routes return `apiSuccess`/`apiError` in the versioned API.
- `withValidation` handles malformed JSON and Zod validation failures.
- Accounting routes map `AccountingDomainError` codes to 403/409/422/404 as
  appropriate.
- Client pages typically catch fetch/auth errors, set local error state, and
  sometimes show a Sonner toast.
- Segment error boundaries log in `useEffect` and offer a retry button.

Current problems to account for when editing:

- Many services use `catch (error: any)` and rethrow a new `Error` with an
  Indonesian message. This loses the original type/stack and makes route
  mapping fragile.
- Several routes infer conflicts by checking whether `error.message` contains
  `sudah ada`; use typed domain errors or Mongo duplicate-key detection in new
  code.
- Some routes return `error.message` directly in a 500 response. Do not expose
  raw internal/database messages in new code.
- `withValidation` catches unhandled handler exceptions and returns a generic
  500. If a route needs status-specific behavior, catch typed domain errors
  inside the handler before they reach the wrapper.
- `console.log`/`console.error` are widespread, including DTO/file logging.
  Avoid logging secrets, file contents, PII, or full database documents.
- The current code sometimes uses 400 for missing tenant context and
  sometimes 403. Preserve the local contract when modifying an endpoint, but
  `[RECOMMENDATION]` standardize missing/invalid authentication as 401/403.

## 9. Testing conventions and known failures

Jest configuration is in `jest.config.js`:

- Uses `next/jest` with project directory `./`.
- Test environment is `node`, even though Testing Library is installed.
- Coverage provider is V8.
- MongoDB/Mongoose/BSON packages are allowed through the transform ignore
  exception, but `nanoid` ESM is not handled.
- Default Jest test matching is active and therefore includes nested ignored
  `.trash` tests.

Existing tests cover:

- Shopee XLSX v1/v2 readers and parsers.
- Order service and product matching.
- Product service.
- Report aggregation/product/overview/cancellation behavior.
- Accounting types.

The current full test run fails for these concrete reasons:

1. `lib/xlsx/shopee/v1/profit-intelligence/v1/order/parser.test.ts` is a
   suite with no test case.
2. `app/products/c02aQS/components/sections/.trash/test.tsx` imports a removed
   `components/basic/modal/modal` module.
3. Two v2 released-funds tests expect a July 2026 XLSX fixture under ignored
   `.data/` that is not present.
4. `modules/products/product.service.test.ts` and
   `modules/orders/order.service.test.ts` fail to load because Jest treats
   `nanoid@5` ESM as CommonJS (`Cannot use import statement outside a module`).

Rules for new tests:

- Do not place test files under `.trash` or other ignored archive folders.
- Prefer deterministic in-memory/unit fixtures over personal `.data` files.
- Mock external Blob/auth/database boundaries for unit tests.
- Add a deliberate Jest transform/module mapping or mock for ESM-only
  packages such as `nanoid` before adding tests that import them.
- Test domain errors and tenant isolation, not just the happy-path response.
- Use route-level tests for validation/response envelopes and service-level
  tests for business rules.

## 10. Anti-patterns and traps to avoid

1. **Following stale API docs.** Do not implement `/api/products` or header-
   based tenant authorization because old docs show it. Current dashboard APIs
   are under `/api/v1/dashboard` and derive context from Better Auth session.
2. **Treating the proxy cookie check as authorization.** Always authorize in
   the server route/service and enforce organization/store scope.
3. **Bypassing tenant filters.** Never call a domain model with a user-provided
   organization/store filter without validating it against the active session.
4. **Using the wrong base repository.** `modules/base.repository.ts` and
   `lib/db/base.repository.ts` are duplicates with different field semantics.
   New domain code belongs on the current `modules` base or a deliberate
   domain-specific repository.
5. **Direct Mongoose access in new dashboard routes.** The profit-intelligence
   tool is an existing exception; new tenant-scoped features should use a
   service/repository layer.
6. **Accidental upserts.** `modules/base.repository.ts` has
   `upsert: true` in its generic `update`; this can create a record when the
   target is missing. Several domain repositories also use upsert for
   idempotent operations. Review the business intent before reusing it for a
   normal update.
7. **Calling `.save()` on a lean object.** `ProductRepository.save()` is marked
   TODO and merges an object returned by a lean query before calling `.save()`;
   do not copy this pattern. Prefer an atomic, tenant-scoped update.
8. **Unbounded or unsafe search.** Some product/query helpers build regexes
   directly from user input and some older methods do not enforce the shared
   maximum limit. Escape/validate search input and whitelist fields.
9. **Mixing API envelopes.** Keep the legacy profit-intelligence contract
   isolated from the standardized versioned API.
10. **Assuming comments are implementation.** Many files contain large
    commented-out migrations/old handlers. Read executable code and tests
    before treating a comment as a supported contract.
11. **Reusing `.trash` or `auth-original` accidentally.** These are retained
    for reference/possible extraction, not the current implementation.
12. **Importing server auth into client code.** `lib/auth/auth.ts` opens a
    MongoDB client at module initialization; use `lib/auth/auth-client.ts` in
    Client Components.
13. **Creating new top-level Mongo connections.** Reuse `lib/db/connection.ts`
    and its hot-reload-safe cache.
14. **Logging full payloads.** Product/order/file payloads can contain PII,
    addresses, uploaded data, or secrets.
15. **Using internal `<a>` navigation.** Use `Link` for internal routes to
    satisfy the Next lint rule and preserve client navigation.
16. **Copying old form syntax.** Many auth/order forms still pass `children`
    as a prop, which is a current lint error. Nest children between component
    tags in new code.
17. **Assuming the landing-page builder exists.** There is no current generic
    JSON layout engine, A/B testing engine, or AI optimization engine in the
    source tree.

## 11. Legacy and experimental areas

Treat these as opt-in targets; do not refactor them during unrelated work:

- `lib/auth-original/`: duplicate older Better Auth configuration.
- `*.trash/` and root `.trash/`: archived implementation attempts and broken
  experiments. They are ignored but still affect tools because of broad globs.
- `components/dashboard/collection/`, `components/tables/data-table.tsx`,
  and `components/forms/`: overlapping/older UI systems; verify imports before
  choosing one.
- `lib/xlsx/shopee/v1/` and `v2/`: both are active in different import/enrich
  paths. Do not remove one without tracing all callers.
- `app/homepage-2/`, `app/test-homepage/`, `app/start-selling/`,
  `app/products/c02aQS/`, and `app/kitchensink/`: public prototypes/demo
  routes, not evidence of a completed generic marketplace/landing-page
  engine.
- `modules/products/README.md`: useful historical CRUD notes, but its routes,
  header authorization, handler naming, and response examples are stale.
- `lib/fetcher/index.ts` and `lib/fetcher/tenant-fetcher.ts`: shared fetch
  helpers exist but have no current call sites. Do not assume all clients use
  them; most active pages call `fetch` directly.
- `.agents/*.md`: PRD/roadmap/aspirational architecture. Consult for product
  intent only after checking the current code.

## 12. Recommended cleanup backlog

These recommendations are intentionally separate from the current behavior.

### P0 — correctness/security

- Make Better Auth/Mongo initialization lazy or otherwise build-safe; avoid a
  top-level external DB connection during module import.
- Add one reusable server auth/tenant guard and apply it consistently to every
  dashboard API route.
- Decide whether profit-intelligence is public. If it is not public, add auth,
  tenant ownership, and access checks to its unversioned endpoints.
- Replace unsafe generic update/upsert behavior with explicit not-found
  handling and idempotent operations only where intended.
- Exclude nested `.trash` directories from TypeScript, ESLint, Jest, and
  Prettier, or move archived source outside the project tree.
- Fix the `/register` vs `/signup` and prototype `/auth/signup`/`/login-2`
  route-link mismatch.

### P1 — maintainability

- Introduce typed domain/application errors with a central error-to-response
  mapper; preserve causes and stop mapping by message substring.
- Remove new `any`; type `withValidation` params/context, repository payloads,
  external XLSX rows, and client fetch responses.
- Fix the Prettier scripts to call `pnpm exec prettier` rather than `npx`.
- Centralize client API fetching around one typed helper, or remove unused
  helpers and make the chosen convention explicit.
- Add Jest handling for `nanoid` ESM and replace personal fixture paths with
  checked-in/minimal fixtures or mocks.
- Standardize API status codes and error envelopes.

### P2 — architecture and UX

- Choose one canonical table system and one canonical auth form system; keep
  old variants in an explicit archive.
- Add `loading.tsx`, `not-found.tsx`, and consistent error boundaries for
  important dashboard segments.
- Standardize the icon library and document when Hugeicons vs Lucide is used.
- Add contract tests for tenant isolation, accounting idempotency, inventory
  movement posting, and report date/timezone semantics.
- Only introduce a generic landing-page/layout/A-B-test engine after its data
  model and runtime boundaries are defined in code.

## 13. Safe workflow for an AI coding assistant

Before changing code:

1. Identify whether the target is an active route/module or a prototype/
   legacy area.
2. Read the route handler, the related `*.schema.ts`, service, repository,
   and model before changing a contract.
3. Preserve session-derived tenant scoping and any accounting lifecycle/
   transaction requirement.
4. Prefer a small, local change over introducing a new abstraction or library.
5. Do not modify `.env`, ignored fixtures, or unrelated `.trash` files.

After changing code:

1. Run `pnpm run typecheck`.
2. Run the smallest relevant Jest file, then `pnpm test --runInBand` when
   practical.
3. Run `pnpm run lint` and report pre-existing failures accurately.
4. Run `pnpm run build` when the change affects route imports, server code,
   auth, database access, or Next configuration.
5. Confirm the response envelope, tenant boundary, and client loading/error
   behavior for any API/UI change.
