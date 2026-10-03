# Module Boundaries

This guide describes how business capabilities should own their rules and how modules should depend on one another. The current folder structure is a starting point, not proof that every module is cohesive or isolated.

## Status

- **[CURRENT]** describes source structure and dependencies observed today.
- **[TARGET]** describes the recommended direction for new work and future restructuring.
- **[OPEN]** marks choices that need discussion before a more specific contract is adopted.

## Current structure and seams

**[CURRENT]** `modules/` contains domain-oriented folders, including Orders, Products, Stores, Reports, Files, and Finance, plus identity and application-support modules. Their internal layouts and public entry points are inconsistent. Finance has a broad `modules/finance/index.ts`; Products has a smaller `modules/products/index.ts`; Orders has no equivalent module entry point today.

Current cross-module examples include:

- Orders uses Products and Stores, and `OrderFinanceIntegrationService` imports Finance directly. `OrderService` constructs that integration service and passes it into order-import flows. This makes Finance a code-level dependency of Orders even though Finance is intended to be optional per Organization.
- Finance uses Products' public inventory-source contract and also reaches into Organization and Member data for Finance lifecycle/access work.
- Reports reads Orders and Stores data directly in parts of its current implementation.

These are implementation facts to account for during changes. They are not all recommended patterns for new code.

## Module ownership

**[TARGET]** Organize modules around cohesive business capabilities. An owning module is responsible for:

- Its domain language, rules, and invariants.
- Its use cases and lifecycle decisions.
- Its persistence details and data-access rules.
- The contracts that other modules are allowed to use.
- Tests for its own behavior and externally visible contracts.

Not every module needs an identical set of files such as `service`, `repository`, `schema`, and `model`. Add those layers when they clarify a real responsibility. Avoid creating wrappers or one-method modules that move code without making ownership or change locality clearer.

## Public surfaces and dependencies

**[TARGET]** Each module should expose a deliberate, small public surface for its consumers. Consumers should call the module's documented use cases or query contracts; they should not import another module's private models, repositories, or internal helpers. A module entry point such as `index.ts` can provide this surface, but should export only what consumers need—not every internal implementation detail.

Use these dependency rules for new code:

1. Keep the dependency graph acyclic. Lower-level capabilities should not import higher-level workflows that already depend on them.
2. A module owns writes to its data and enforces its invariants. Another module may request a change through an explicit use case; it should not mutate that module's model directly.
3. Cross-module reads should use a documented query contract. A reporting use case that genuinely combines domains may have a read-oriented composition, but should not become a reason for arbitrary model imports throughout the application.
4. Shared infrastructure belongs in `lib/` or another explicitly shared technical area. Shared business rules stay with the domain that owns them; do not create a generic `shared` module to avoid deciding ownership.
5. Keep UI and HTTP concerns at the application edge. Route handlers and pages compose module calls; they should not become the hidden owners of business workflows.

## Optional Finance and integration seams

**[TARGET]** Finance is optional per Organization, and Inventory is part of Finance. Core capabilities such as accepting and storing an Order must not require Finance to be enabled. Finance-specific posting, accounting, and inventory behavior can run only when the Organization has Finance available and the actor is authorized.

The current direct Orders-to-Finance dependency does not meet that target boundary by itself. The requirement is to remove the mandatory dependency from core Order behavior; the exact integration mechanism remains open. A narrow application-level port/adapter is a reasonable first option for this modular monolith. Introduce asynchronous events and an outbox only if retry, delivery, or independent processing requirements justify their added lifecycle and operations.

**[OPEN]** The composition point and recovery contract for optional Finance integration remain undecided. See [Q-007 — Orders-to-Finance failure and recovery contract](../open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract). Preserve core Order intake when Finance is disabled or unavailable.

The existing `FinanceEntitlementService` is not evidence of complete optional-module activation: its current development behavior reports Finance as available. The future per-Organization activation mechanism and its persistence belong in the optional-modules guide and a later ADR if selected.

## Marketplace integrations and future modules

**[CURRENT]** Marketplace data currently enters through file-based workflows. Do not build a generic runtime plugin framework just because multiple integrations may exist in the future.

**[TARGET]** When a second real integration creates a distinct implementation behind the same business capability, define a narrow adapter contract at that seam. Keep provider-specific formats and credentials inside their integration adapters; let domain modules consume normalized business inputs. Until then, a single implementation can remain direct and local.

**[CURRENT]** Finance owns the Organization-wide Supplier directory and the Supplier reference used by new Purchases. This is a bounded Finance capability, not a general Contacts or procurement module. Store/product sourcing and broader procurement relationships remain open in [Q-014](../open-questions.md#q-014--supplier-ownership-and-purchasing-relationship). Settings, Customers, and Marketing remain future capability candidates tracked in [Q-013](../open-questions.md#q-013--settings-ownership-and-scope), [Q-015](../open-questions.md#q-015--customer-ownership-and-data-lifecycle), and [Q-016](../open-questions.md#q-016--marketing-capability-scope-and-optionality).

## Practical review checklist

When adding or changing module code, ask:

1. Which business capability owns this rule and the data it changes?
2. Is this code a consumer of another module's documented contract, or is it reaching into that module's internals?
3. Would disabling an optional module leave core workflows valid?
4. Does this dependency create a cycle or force unrelated modules to load optional behavior?
5. Is a new abstraction needed for real variability or a repeated rule, or would a direct call be easier to understand?
6. Can the module's behavior be tested through its public use case or query surface?

Do not use dependency inversion, events, repositories, factories, or adapters as decoration. Choose the smallest seam that contains a real change boundary.
