# API and Data Access

> This guide describes the target request path for the Next.js App Router and the current versioned dashboard API. It distinguishes input validation, tenant context, authorization, business rules, and persistence.

## Status and scope

- **[CURRENT]** The active dashboard REST API is under `app/api/v1/dashboard/`. Route handlers commonly use `withValidation()`, `getTenantContext()`, a module operation, and `apiSuccess()` / `apiError()`.
- **[CURRENT]** The application uses MongoDB/Mongoose. Business modules own their repositories and models; `modules/base.repository.ts` is the current domain repository base. `lib/db/base.repository.ts` is legacy and must not be used for new modules.
- **[TARGET]** Keep HTTP handling at the route edge, business decisions in the owning module, and persistence details behind repositories or deliberate query contracts.

This guide covers API and server-side data-access conventions. Authentication policy and role design belong to [Identity and Access Control](../architecture/identity-and-access-control.md); domain ownership belongs to [Module Boundaries](../architecture/module-boundaries.md).

## Request path

Use this as the default composition path for a protected dashboard operation:

```text
HTTP request
  -> route handler and Zod validation
  -> authenticated actor + trusted tenant context
  -> authorization and module availability checks
  -> owning module use case or query
  -> tenant-scoped repository / documented read contract
  -> Mongoose model
  -> explicit response mapping
```

This is a responsibility guide, not a requirement to add a layer when it contributes no value. A route can compose several module calls for a real application-level use case, but should not hide domain ownership or write another module's model directly.

## Route handlers and validation

- **[TARGET]** Keep route handlers focused on HTTP concerns: validate inputs, establish server-side context, perform the necessary access checks, call module operations, and map their outcomes to HTTP responses.
- **[CURRENT]** `withValidation()` supports Zod validation of request bodies, query parameters, and route parameters. Use it where the handler fits that flow; validation can also be performed explicitly where the route has special parsing needs.
- **[TARGET]** Treat route params, query strings, JSON, uploaded files, and client-provided identifiers as untrusted input. Validate the shape and primitive constraints at the edge, then let the domain module check rules that depend on current state.
- **[TARGET]** Bound pagination, sort fields, search length, regular expressions, aggregation work, upload size, and other user-controlled resource costs. Allowlist sort and filter fields instead of passing arbitrary query objects to MongoDB.
- **[TARGET]** Keep response and status-code decisions in the route/API mapping. Do not make business services depend on `NextResponse`, request objects, or HTTP status codes unless an explicit framework adapter owns that translation.
- **[CURRENT]** The validation wrapper catches exceptions from its handler callback as well as Zod/JSON parsing errors. Map expected domain outcomes deliberately inside the route composition path so they are not accidentally returned as generic internal errors.

Use dedicated Zod schemas for body, query, and path inputs when their contracts differ. Do not treat a TypeScript cast as validation: a value typed with `as SomeDTO` is safe only after an appropriate runtime schema has parsed it.

## Authentication, tenant context, and authorization

- **[CURRENT]** `getTenantContext()` reads the Better Auth session and returns the active Organization, active Store, and user identifiers. If those session values are absent, the helper currently returns empty identifiers; calling it is not by itself an authentication or authorization check.
- **[TARGET]** Reject missing or invalid authentication before a protected operation proceeds. Verify the actor's membership in the selected Organization and the requested action's authorization; choosing an active Organization or Store does not grant access by itself.
- **[TARGET]** Treat client-provided Organization and Store identifiers as selectors only. Resolve or verify them against the authenticated session, membership, and parent ownership on the server. Never trust a tenant header or request body field as proof of authorization.
- **[TARGET]** For Store-scoped operations, confirm the Store belongs to the selected Organization. For Organization-scoped work such as consolidated Finance operations, do not add a Store filter just because the session has an active Store.
- **[TARGET]** Enforce authorization on every path that can read or mutate the data, including list, search, update, delete, restore, import, export, and background processing paths. Client-side guards are only for user experience.
- **[TARGET]** Keep user permission, Organization module availability, and rollout feature flags as separate checks. Finance being active does not automatically authorize the current member to post or read every Finance record.
- **[OPEN]** The future RBAC role scope and permission matrix remain undecided. Route code should call the agreed policy contract once defined; do not scatter assumptions about role names through handlers.

See [Domain and Tenancy](../architecture/domain-and-tenancy.md) for Organization/Store scope and [Identity and Access Control](../architecture/identity-and-access-control.md) for AuthN/AuthZ concepts and open RBAC decisions.

## Module operations and repositories

- **[TARGET]** Call the owning module's use case or documented query contract. Do not import another module's private model, repository, or helper to perform a write.
- **[TARGET]** Repositories own persistence mechanics: applying tenant filters, building Mongoose queries, using indexes and sessions, and mapping storage details where needed. They do not decide whether a business transition or operation is allowed.
- **[CURRENT]** The current `modules/base.repository.ts` adds Organization scope and adds Store scope when the model declares a `store` path. Repository callers must still choose the correct business scope and verify parent ownership; a base filter is not a substitute for authorization.
- **[TARGET]** Make tenant context explicit at the repository or module-operation boundary. Do not allow request payloads to override trusted tenant fields when creating or updating records.
- **[TARGET]** Do not access Mongoose from presentational React components or use a client component as a persistence layer. Server Components and route handlers should still call module-owned server operations rather than duplicating domain rules.
- **[TARGET]** For cross-module reads, use a documented query contract or a deliberate read composition for a specific product question. Avoid arbitrary deep imports of another module's repository.
- **[CURRENT]** Finance operations may need a `ClientSession` and lifecycle guards. If a workflow composes such operations, propagate the same session and preserve the guard checks through all participating repositories.

## Request and response contracts

**[CURRENT]** The versioned dashboard API uses this success envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` is optional and is currently used for pagination. Error responses use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A safe, user-facing explanation",
    "details": []
  }
}
```

- Use `apiSuccess()` and `apiError()` from `lib/api/response.ts` for the versioned dashboard API.
- Use status codes to reflect the outcome: successful reads, successful creation, invalid input, unauthenticated access, forbidden access, missing resources, conflicts, and unexpected failures should remain distinguishable.
- Return stable error codes and safe messages. Do not expose raw Mongoose errors, stack traces, secrets, uploaded contents, or tenant data in response bodies.
- **[TARGET]** Map domain outcomes to HTTP at the route edge. Preserve useful distinctions such as not found, conflict, unavailable optional module, and review-required conditions without coupling the module to HTTP.
- Keep API field names consistent with the established wire contract. **[CURRENT]** Repository-wide guidance says new API/domain fields use `snake_case`; Better Auth-owned contracts preserve their required `camelCase`. Database field naming and migrations are further specified in [MongoDB and Schema](./mongodb-and-schema.md).
- Do not copy legacy standalone API envelopes into the versioned dashboard API. In particular, the separate `app/api/profit-intelligence/` flow has legacy response shapes and should be migrated deliberately rather than treated as the default.

## Files, imports, and data handling

- Put request schemas near the owning module or route contract using the repository's `*.schema.ts` convention; avoid maintaining unrelated copies of the same constraints.
- Keep platform-specific file parsing and external field names at the import boundary. Convert them into a clear application input before invoking domain use cases.
- Apply the same tenant, authorization, and validation safeguards to bulk operations as to single-record operations. Define duplicate handling and idempotency where a retry can repeat a write.
- Treat `.data/` and `.upload/` contents as sensitive. Do not log or return uploaded file contents, secrets, or personal data. Bound upload size and processing cost.
- Shape response data deliberately. Avoid exposing internal persistence fields, session details, or raw Mongoose documents as an accidental long-term API contract.
- Do not add a second database connection, response envelope, repository base, or query system without an explicit architecture decision.

## Practical review checklist

For a new or changed endpoint/data path, verify:

1. The route validates body, query, and path data before use.
2. Authentication, active Organization membership, Store ownership, action authorization, and module availability are checked at the correct scopes.
3. Every query and mutation is tenant-scoped, and no untrusted field can override that scope.
4. Business invariants live in the owning module, not only in the route or UI.
5. Pagination, search, sorting, aggregation, uploads, and bulk operations have safe bounds.
6. Mongoose sessions, lifecycle guards, idempotency, and soft-delete rules are preserved where the use case requires them.
7. Expected outcomes map to stable HTTP statuses and safe error envelopes.
8. Cross-module access uses a deliberate public contract rather than another module's private persistence layer.
9. Response fields are intentional, and uploaded or tenant-sensitive data is not exposed in logs or responses.

## Related guides

- [Business Logic](./business-logic.md) — use-case ownership, invariants, transactions, retries, and error mapping.
- [Naming Conventions](./naming.md) — route, schema, service, repository, and symbol naming.
- [Identity and Access Control](../architecture/identity-and-access-control.md) — authentication, authorization, and module availability.
- [Domain and Tenancy](../architecture/domain-and-tenancy.md) — Organization and Store ownership rules.
- [Module Boundaries](../architecture/module-boundaries.md) — public module surfaces and cross-module dependencies.
- [MongoDB and Schema](./mongodb-and-schema.md) — persisted field names, indexes, embedding, and schema lifecycle conventions.
