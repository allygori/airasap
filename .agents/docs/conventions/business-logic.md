# Business Logic

> This guide sets a target for new and refactored work. The existing codebase contains legacy workflows that do not consistently follow it; their presence does not make them the pattern to copy.

## Purpose and status

- **[CURRENT]** Business capabilities live primarily in `modules/`. API handlers compose validation, trusted request context, and module operations. Finance workflows may use Mongoose sessions and lifecycle guards.
- **[TARGET]** Put each business rule with the capability that owns the decision and the data it changes. Keep UI, HTTP, and persistence details from becoming the hidden owner of a workflow.
- **[TARGET]** Prefer a small, understandable module over a broad “clean architecture” framework. Add abstractions when they make ownership, change locality, or a real integration seam clearer.

Use the labels this way:

- **[CURRENT]** is verified behavior or an existing repository rule.
- **[TARGET]** is the rule to follow for new work and the direction for deliberate refactors.
- **[OPEN]** is a policy or design detail that still needs a decision.

## Where rules belong

Use this as a responsibility guide, not a requirement to create a file for every row:

| Concern | Primary responsibility |
| --- | --- |
| HTTP method, status code, request parsing, and response envelope | Route handler / API edge |
| Shape and basic constraints of external input | Zod schema at the input boundary |
| Authenticated actor and trusted Organization/Store context | Server-side request context and authorization policy |
| Business invariants, allowed transitions, and use-case outcomes | Owning domain module |
| Coordinating a business operation across owned persistence steps | Module use case (commonly a `*.service.ts`) |
| MongoDB queries and persistence mechanics | Repository / data-access code |
| Rendering, local interaction state, and user feedback | UI layer |
| Translating platform files or provider-specific fields into application inputs | Import/integration edge |

**[TARGET]** A route should be a thin composition point: validate the request, obtain trusted context, call the appropriate module operation, and map its result to the HTTP response. It should not be the only place that enforces a rule needed by imports, background work, or another caller.

**[TARGET]** Zod validation answers whether input has the expected shape and primitive constraints. The owning module still checks business rules that depend on current state, permissions, lifecycle, or other records. Do not rely on browser validation for server-side correctness.

## Use-case and invariant design

1. **Name the capability and its owner.** Before writing a rule, identify the module whose business concept and persisted state it governs. If ownership spans modules, use the module-boundary guidance instead of adding a direct cross-module model write.
2. **State the invariant.** Describe what must remain true before and after the operation, including tenant scope, allowed lifecycle state, quantity or balance constraints, and relevant authorization.
3. **Implement the decision in the owning module.** The UI, route, repository, and import adapter may help carry out the operation, but they should not independently reimplement the business decision.
4. **Make state transitions explicit.** Validate the prior state, perform the operation, and represent the resulting state or review condition clearly. Avoid hiding writes or lifecycle changes inside read methods.
5. **Return the outcome callers need.** Give the caller a useful success, not-found, conflict, disabled, or review outcome without exposing database documents or internal error details as an accidental public contract.

**[TARGET]** A module use case may orchestrate several repositories and other modules' documented contracts. Keep the use case cohesive; do not let a generic `BaseService` or utility collection become the real owner of domain rules.

### Example ownership

- **[TARGET]** Orders owns Order intake and Order lifecycle facts. A route or file importer normalizes the source data and invokes an Order use case.
- **[TARGET]** Finance owns accounting postings and Inventory consequences while Finance is active. It decides whether a Finance operation is allowed by its lifecycle and entitlement policy.
- **[TARGET]** A consumer requests a Finance operation through an explicit module seam; it does not write Finance collections directly. Since Finance is optional, core Order intake must continue to work when Finance is disabled or unavailable.
- **[CURRENT]** Orders currently has a direct `OrderFinanceIntegrationService` dependency. This is a seam to improve, not a precedent that every consumer should import optional module internals. See [Module Boundaries](../architecture/module-boundaries.md).

These ownership examples do not settle every future domain boundary. **[CURRENT]** Finance owns its Organization-wide Supplier directory and its Purchase reference. Supplier relationships to Stores, products, and future procurement remain open in [Q-014](../open-questions.md#q-014--supplier-ownership-and-purchasing-relationship). Settings, Customers, and Marketing ownership remains open until their behavior and data are defined.

## Business rules versus reusable helpers

- **[TARGET]** Keep a domain rule close to the operation and domain terms that explain it. Reuse should preserve one source of truth for that rule.
- **[TARGET]** Extract a shared helper when multiple callers need the same stable behavior and the helper name communicates that behavior. Similar-looking code is not enough if the rules differ.
- **[TARGET]** Prefer KISS and YAGNI. The Rule of Three may be a useful signal to look for a shared rule, not a requirement to wait for or perform exactly three copies.
- **[TARGET]** Apply SOLID as a design aid: give a module operation a clear responsibility, keep contracts small, and point dependencies toward the owner of the policy. Do not add factories, interfaces, adapters, events, or dependency-injection machinery solely to satisfy a principle.
- **[TARGET]** Apply DRY to knowledge that must remain consistent—such as a calculation or transition rule—not to every repeated line or similar data shape.
- **[TARGET]** Keep pure calculation functions when they make a named rule easier to understand and reuse. Do not extract trivial helpers solely to make a file look layered or a function appear independently testable.

## Persistence, transactions, and retries

- **[CURRENT]** Finance operations may accept and propagate a Mongoose `ClientSession`; some accounting workflows also have lifecycle guards and idempotency keys.
- **[TARGET]** Define the consistency boundary for a use case. If its writes must succeed or fail together, use the repository's supported transaction/session flow and propagate the same session through every participating operation.
- **[TARGET]** A repository persists and retrieves records; it should not make workflow decisions such as whether an Order is eligible to reserve stock or whether an accounting period allows posting.
- **[TARGET]** Make operations idempotent when the caller can legitimately retry them—for example, repeated imports, webhook-like deliveries, or retried posting commands. Scope keys to the tenant and business operation, and reject reuse with materially different input where correctness requires it.
- **[TARGET]** Do not add a transaction, idempotency key, event, or outbox by default. Add it when duplicate work, partial writes, or delivery guarantees are real requirements, then document the guarantee and its limits.
- **[TARGET]** Do not imply atomicity across MongoDB and an external marketplace or file system. Persist enough status or reconciliation information to make partial completion visible and recoverable.
- **[OPEN]** Cross-module failure handling for optional Finance work after an Order is accepted is not settled. Preserve the Order result, make incomplete Finance work observable, and define retry/reconciliation behavior before tightening that integration.

## Tenant and authorization safeguards

- **[CURRENT]** The current repository contract requires tenant-scoped queries and mutations; client-provided tenant identifiers are not trusted authorization.
- **[TARGET]** Every use case that reads or changes tenant data must receive Organization/Store scope from authenticated server context or a trusted internal caller. Do not accept an arbitrary client Organization ID as proof of access.
- **[TARGET]** Enforce authorization on the server at the operation or composition boundary that has enough context to make the decision. A hidden UI control or client-side feature flag is not authorization.
- **[TARGET]** Keep module availability separate from a user's permission. An Organization having Finance enabled does not by itself authorize every member to post or read financial data.
- **[TARGET]** Re-check important state-changing invariants at write time. A page-level check or earlier read can become stale before the mutation runs.
- See [Identity and Access Control](../architecture/identity-and-access-control.md) and [Domain and Tenancy](../architecture/domain-and-tenancy.md) for the related contracts.

## Errors and side effects

- **[TARGET]** Use errors or result variants that distinguish expected business outcomes (for example, invalid transition, unavailable optional module, or stock shortage) from unexpected infrastructure failures.
- **[TARGET]** Translate internal errors to the established API error envelope at the HTTP edge. Do not leak stack traces, raw database messages, tenant data, or secrets to users or logs.
- **[TARGET]** Avoid catch-and-rethrow wrappers that discard error types or merely prepend another message. Catch only when the layer can recover, add useful safe context, or map the error to its contract.
- **[TARGET]** Keep irreversible or external side effects out of constructors, getters, and ordinary read paths. Trigger them from explicit use cases and make their completion or failure visible.
- **[TARGET]** For a workflow with multiple durable steps, record enough progress to determine whether it completed, needs retry, or needs human review.

## Read paths and reporting

- **[TARGET]** A read use case may combine data from multiple modules when the product question genuinely spans them. Keep that composition intentional and read-oriented; it must not bypass tenant scope or become permission to import private repositories everywhere.
- **[TARGET]** Do not force every read through a command-style service or introduce full CQRS as a default. Choose the smallest read contract that gives the UI or report the required view.
- **[CURRENT]** Some Reports code reads Orders and Stores data directly. Treat these paths as existing implementation to review when touched, not as a blanket rule for future cross-module reads.

## Practical review questions

Before considering a business-logic change complete, ask:

1. Which module owns the business decision and the records it changes?
2. What invariant or lifecycle transition does this operation enforce?
3. Is Organization/Store context trusted and applied to every relevant query and write?
4. Is the actor authorized, and is module activation being confused with permission?
5. Can a route, UI, importer, or another module accidentally bypass the same rule?
6. Does this operation need a session, idempotency, explicit retry state, or reconciliation—and what actual failure mode justifies each?
7. Are expected business outcomes distinguishable from unexpected failures without leaking internal details?
8. Does a new abstraction create a useful seam, or just add indirection?
9. Can the important behavior be observed through the owning module's use case or query contract?

## Related guides

- [Module Boundaries](../architecture/module-boundaries.md) — ownership, dependencies, and cross-module seams.
- [Identity and Access Control](../architecture/identity-and-access-control.md) — authentication, tenant context, authorization, and module availability.
- [Domain and Tenancy](../architecture/domain-and-tenancy.md) — Organization, Store, and tenant relationships.
