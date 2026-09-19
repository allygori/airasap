# API, Authentication, Tenant, and Data-Access Guidelines

## Route handler responsibility

Route handlers are HTTP adapters. A typical current dashboard route should do
the following:

1. Receive the request and route parameters.
2. Validate body, query, and params with Zod.
3. Resolve the authenticated user and tenant context.
4. Connect through the shared database layer when persistence is needed.
5. Call a domain service.
6. Map the result with the standard response helper.
7. Map known domain errors and hide unexpected internal details.

Do not put multi-step business workflows or raw Mongoose queries in a route
handler unless the route is a documented legacy boundary.

## Validation

Use feature-owned `*.schema.ts` files and `withValidation()` from
`lib/api/validate.ts` where the route matches that wrapper. Validation must
cover:

- JSON body shape and unknown/unsupported fields where appropriate;
- query pagination, sorting, filters, and search limits;
- route parameter syntax, especially ObjectId-like identifiers;
- upload presence, filename/type, size, and expected workbook structure;
- enum values and date/number ranges.

Do not trust TypeScript types as runtime validation. Do not accept arbitrary
sort or filter field names from a caller.

## Response contract

The canonical versioned dashboard envelope is:

```ts
type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

Use `apiSuccess()` and `apiError()` from `lib/api/response.ts`. Keep messages
safe for end users; put diagnostic details in server logs with appropriate
redaction.

The `/api/profit-intelligence/` area still uses older shapes and is a separate
compatibility boundary. Do not standardize it incidentally while changing a
dashboard endpoint. If migrating it, do so as an explicit task with contract
tests.

## Authentication and authorization

- Server auth configuration: `lib/auth/auth.ts`.
- Client auth configuration: `lib/auth/auth-client.ts`.
- Auth route: `app/api/auth/[...all]/route.ts`.
- Browser redirect proxy: `proxy.ts`.

`proxy.ts` currently uses Better Auth cookie presence for navigation redirects.
Cookie presence alone is not authorization. API handlers and services must
resolve the session and enforce the action's authorization requirements.

Do not import server auth into a Client Component. Do not use a user ID,
organization ID, or store ID supplied only by the browser as proof of access.

## Tenant context

Use `getTenantContext()` from `lib/api/tenant-context.ts` or the established
server-side equivalent. The context is derived from the authenticated session
and active organization/store selection.

Current persistence conventions are not identical everywhere:

- Application/domain models commonly use `organization` and optional `store`.
- Better Auth models use `organizationId`.
- Do not mix them in a query without an explicit mapping.

Every tenant-scoped query and mutation must preserve the organization scope and
the optional store scope. The caller must not be able to replace the resolved
scope with arbitrary headers or body fields.

## Database connection and models

- Use the cached connection from `lib/db/connection.ts`.
- Do not create a new `MongoClient` or Mongoose connection per request.
- Use the model-registration guard already used by the project.
- New repositories should extend/use `modules/base.repository.ts`.
- Do not use `lib/db/base.repository.ts` for new work; it is a legacy duplicate.
- Import/register models consistently so tests and route handlers do not create duplicate model errors.

## Repository query rules

- Add tenant and soft-delete filters by default.
- Prefer `.lean()` for read-only queries and return plain objects.
- Never call `.save()` on a `.lean()` result.
- Use explicit updates. Do not use `upsert: true` for ordinary update endpoints.
- Whitelist sort/filter fields and cap `limit`.
- Avoid unbounded `populate`, aggregation, regex, or array operations on user input.
- Use projections when a route does not need the full document.
- Preserve `ClientSession` through nested accounting/inventory/order operations.

## Soft deletion and lifecycle

Many operational models use `deleted_at`. List/detail/update behavior must
match the existing module contract: deleted records are normally excluded and
restore is an explicit operation.

Accounting has additional lifecycle guards, onboarding/cutover state, and
transaction requirements. Do not reduce an accounting workflow to generic CRUD
or bypass `assertAccountingModuleActive` and related guards.

## Error handling

Known domain errors should map to stable error codes/statuses. Accounting
already has `AccountingDomainError` mappings; follow that pattern when adding
accounting behavior.

Avoid:

- returning `error.message` directly in a 500 response;
- using localized message substring checks as error classification;
- returning 500 for predictable validation, auth, not-found, or conflict cases;
- logging full request bodies, uploaded workbooks, tokens, or tenant data;
- catching an error only to discard its cause and stack.

Use `unknown` in catches, preserve causes, and log only the minimum redacted
context needed for diagnosis.

## Client API access

The repository contains multiple fetch patterns. Before adding a new one,
inspect the relevant feature and existing helpers. Do not create a new global
fetch abstraction for one screen. The long-term target is one typed client
boundary with consistent parsing and error behavior, but this is `[TARGET]`,
not a claim about the current codebase.
