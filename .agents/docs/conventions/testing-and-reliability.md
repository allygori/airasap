# Testing and Reliability

> Verify business behavior through useful module seams, and make failures safe to retry, diagnose, or recover from. A green test suite is not a substitute for tenant isolation or production safeguards.

## Status and scope

- **[CURRENT]** The project uses Jest through the `test` package script and the Next.js Jest integration. Test files commonly sit beside their module code and use `.test.ts` or `.test.tsx`.
- **[CURRENT]** Tests exist for module services, schemas, repositories, read paths, and reports. Their isolation level is not uniform; some current tests depend on local import data.
- **[TARGET]** Test observable business behavior at the owning module's use case or query contract. Use lower-level unit tests where they isolate a rule that is meaningful on its own.
- **[TARGET]** Keep tests deterministic, tenant-aware, independent of private user data, and explicit about external effects.

## What to verify

Prioritize behavior that can cause business, security, or data-integrity failures:

- Domain invariants and lifecycle transitions, including allowed, rejected, and review-required outcomes.
- Organization and Store isolation, membership checks, authorization, module activation, and feature-flag behavior at their respective scopes.
- Idempotency and duplicate handling for retried imports, repeated requests, or posting workflows.
- Session/transaction propagation when multiple writes must succeed or fail together.
- Boundary conditions for amounts, quantities, dates, missing identifiers, invalid platform data, soft deletion, restore, and partial updates.
- API validation and response mapping for expected errors, unauthorized access, conflicts, and safe internal failures.
- Report and read-query correctness for filters, pagination, aggregation, and empty results.
- UI behavior for loading, empty, error, pending, and success states when the user action needs those distinctions.

Do not add tests only to mirror every implementation line. A focused test should protect a behavior or contract that could break in a meaningful way.

## Test seams and isolation

- **[TARGET]** Prefer testing a module through its use case, documented query contract, or public surface. Avoid asserting private method calls or internal file organization unless the interaction itself is a required contract.
- **[CURRENT]** Some Finance services accept dependency ports so behavior can be exercised with focused repository fakes. This is a useful seam where dependencies represent real persistence or lifecycle collaborators, not a requirement to add an interface for every class.
- Use fakes or mocks at external boundaries such as repositories, clocks, file stores, and marketplace adapters. Keep the business decision under test real.
- Use a test database or isolated persistence integration test when the behavior depends on actual MongoDB semantics such as unique indexes, sessions, query middleware, or aggregation. Keep setup and cleanup scoped to the test.
- Do not make a unit test depend on the developer's `.data/`, `.upload/`, or other local workspace contents. Use small synthetic fixtures checked into an appropriate test-fixture location; never add personal or customer data.
- Keep tests independent of order and wall-clock timing. Fix dates and IDs in fixtures where stable output matters.
- Avoid network calls to marketplaces, email, or other external services in routine tests. Stub the seam or use a controlled contract test with explicit setup.
- Prefer assertions about the outcome and persisted effects over broad snapshots that can change without breaking meaningful behavior.

## Multi-tenancy and authorization test cases

For tenant-protected behavior, include negative cases as well as the successful path:

1. A missing or invalid session cannot read or change protected tenant data.
2. A user who is not a member of the selected Organization cannot access it by guessing an ID.
3. A Store or child resource from a different Organization is rejected.
4. A caller cannot override the Organization/Store filter through body, query, or repository filter input.
5. Organization-wide operations do not accidentally inherit an unrelated active Store filter.
6. Module availability and user permission are independently enforced; client-side flags do not grant access.
7. List, search, export, update, restore, and bulk paths enforce scope consistently.

The exact role and permission matrix remains open. Tests should enforce the policy that has been agreed and should not invent role semantics before that decision.

## Reliability, retries, and recovery

- **[TARGET]** Make retry behavior explicit for operations that may be repeated. Test that an idempotent retry does not create duplicate business effects and that a reused key with different input is handled according to the operation's contract.
- **[TARGET]** Test transaction boundaries when partial writes would violate an invariant. If a workflow crosses MongoDB and a file system or external platform, test each failure/recovery state without claiming cross-system atomicity.
- **[TARGET]** Make partial completion observable. A failure after one durable step should produce a retry, reconciliation, or review path rather than silent data divergence.
- **[TARGET]** Exercise concurrent or repeated updates for operations where stale reads could oversubscribe stock, double-post money, or overwrite a newer state.
- **[TARGET]** Bound user-controlled work and test the limit where it matters: page size, file size, row count, search patterns, and aggregation time/volume.
- **[TARGET]** Keep logs useful but safe. Record a correlation/request identifier and operation context when appropriate; redact secrets, session tokens, raw uploaded data, unnecessary personal data, and cross-tenant payloads.
- **[TARGET]** Return generic safe messages to clients for unexpected failures while retaining enough structured, redacted server diagnostics for investigation.
- Use explicit status and timestamps for external data freshness. For marketplace inventory without API synchronization, tests must not imply that local reservations guarantee channel stock or prevent overselling.

## Fixtures and test data

- Use small, explicit factories/builders when they reduce repeated setup while keeping each test's relevant values visible.
- Make Organization, Store, actor, and resource ownership explicit in tenant-sensitive fixtures.
- Keep fixture defaults valid and minimal. Avoid giant “universal” test objects whose hidden defaults make business conditions hard to see.
- Use deterministic synthetic marketplace rows and files. Include malformed, duplicate, partial, and boundary-case inputs when import behavior needs coverage.
- Clean up database state and temporary files even on failure. Do not let a test operate on a developer's real database or files.
- Keep fixture construction separate from production code unless it represents a real reusable domain factory.

## Running checks

Use the repository's package scripts from the project root. The current documented test command is:

```bash
pnpm test --runInBand
```

Run the narrowest relevant test file first, then broader checks when the change warrants it. Do not report a test as passing unless it was actually run successfully; report environmental or pre-existing failures accurately. Documentation-only edits do not require running the test suite.

## Related guides

- [Business Logic](./business-logic.md) — invariants, transactions, retries, and safe error handling.
- [API and Data Access](./api-and-data-access.md) — tenant scope, authorization, validation, and response contracts.
- [Module Boundaries](../architecture/module-boundaries.md) — testable public module surfaces and cross-module seams.
- [Identity and Access Control](../architecture/identity-and-access-control.md) — auth and module availability semantics.
- [Inventory and Sales Channels](../architecture/inventory-and-channels.md) — current integration limits and future inventory model.
