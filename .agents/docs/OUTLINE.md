# Documentation and ADR Outline

> **Status: DRAFTED FOR OWNER REVIEW** — this file records the agreed documentation scope, decisions, and unresolved items. It is a navigation/planning aid, not an implementation contract. Source code remains authoritative for current behavior.

## 1. Purpose

Create a small, navigable source of guidance for contributors and AI coding assistants. It should explain what exists today, what is a target, what remains undecided, and where to record durable decisions. Avoid duplicating the same rule across the root `AGENTS.md`, guides, and ADRs.

## 2. Documentation map

```text
AGENTS.md                         # concise repository-wide contract and entry points
.agents/
  README.md                       # navigation, source-of-truth order, status labels
  AGENTS.md                       # compatibility pointer only, if still needed by tools
  docs/
    README.md                     # guide index by task
    OUTLINE.md                    # scope and progress record
    roadmap.md                    # product/architecture direction, without invented dates
    open-questions.md              # canonical register of unresolved decisions
    architecture/
      overview.md
      domain-and-tenancy.md
      identity-and-access-control.md
      module-boundaries.md
      optional-modules-and-flags.md
      inventory-and-channels.md
    conventions/
      business-logic.md
      naming.md
      api-and-data-access.md
      mongodb-and-schema.md
      typescript.md
      react-and-ui.md
      testing-and-reliability.md
    workflows/
      feature-changes.md
      refactoring-and-legacy-cleanup.md
      documentation-and-adr.md
  ADR/
    README.md
    TEMPLATE.md
      0001-organization-inventory-allocation.md
      0002-organization-scoped-module-activation.md
  features/
    finance/                       # existing Finance plans; outside this outline's rewrite
```

The conventions group uses the canonical filenames listed above. Existing placeholder topics are consolidated as follows: `coding.md` points to business logic, naming, and TypeScript; `database.md` points to MongoDB and schema; `error-handling.md` points to business logic and API/data access; `nextjs.md`, `react.md`, and `styling.md` point to React and UI; `testing.md` points to testing and reliability; and `validation.md` points to API and data access. Keep these old paths as short compatibility pointers rather than maintaining duplicate rules. Keep Finance feature plans and ADRs under `.agents/features/` untouched for now, as requested.

Use status labels consistently: `[CURRENT]` describes verified implementation, `[TARGET]` describes an agreed direction that may not be implemented, `[OPEN]` describes an unresolved question, `[LEGACY]` describes code retained but not recommended for new work, and `[DEPRECATED]` describes something that should no longer be used. A roadmap item or user decision must not be presented as a current capability without checking source code.

## 3. Scope of each guide

### Architecture

- **`overview.md`** — current modular-monolith shape; Next.js application, `app/`, `modules/`, `lib/`, MongoDB/Mongoose, request flow, and links to deeper guides. Mark current implementation separately from target architecture.
- **`domain-and-tenancy.md`** — domain relationships and tenant ownership: User membership in multiple Organizations; Organization ownership of Stores/brands; Store ownership of one or more channel accounts, including multiple accounts for the same platform. Distinguish agreed target relationships from current schema support.
- **`identity-and-access-control.md`** — authentication (who the user is) and authorization (what the user may do); current Better Auth integration and tenant-context flow; target Organization membership roles and permissions; enforcement and least-privilege principles. Mark the future RBAC design as target/open until role scope, built-in versus custom roles, permission granularity, and invitation/member lifecycle are decided. Keep module entitlements and feature flags distinct from user permissions.
- **`module-boundaries.md`** — what a business module owns, its public surface, allowed dependencies, cross-module calls, and how to prevent cycles and deep imports. Describe the Orders–Finance coupling as a current seam to improve, not as a desired convention.
- **`optional-modules-and-flags.md`** — organization-level runtime activation of optional modules; distinguish module availability/entitlement, rollout feature flags, and authorization. State that Inventory is part of Finance for the current product direction, so disabling Finance disables its Inventory capabilities.
- **`inventory-and-channels.md`** — organization-level physical stock for consolidated operations; persistent logical allocation to a Store; temporary reservation for an Order; fulfillment, cancellation, adjustments, and returns; one-warehouse assumption with a future multi-warehouse path. State that current marketplace file imports do not provide real-time channel stock accuracy or guarantee oversell prevention. Keep channel pool versus per-account quota and channel-specific warning accuracy open until the operating model and integrations are decided.

### Conventions

Canonical convention guides have been written in `docs/conventions/`. Eight former empty placeholders now contain only links to their canonical replacement; the repository owner plans to remove those pointer files.

- **`business-logic.md`** — domain invariants, use-case orchestration, ownership of business rules, error mapping, idempotency where needed, transaction boundaries, and criteria for introducing abstractions.
- **`naming.md`** — file/folder names, module and domain terms, TypeScript symbols, hooks, tests, and naming consistency. Database field and API wire-format naming remain specified in their respective data/API guides to avoid conflicting rules.
- **`api-and-data-access.md`** — route responsibilities, validation, server-side tenant context, service/repository flow, response conventions, and where authorization checks must be enforced. Link to the architecture identity/access-control guide for policy; do not redefine the role model here.
- **`mongodb-and-schema.md`** — tenant scoping, field naming, indexes, soft deletion, and embed-versus-reference guidance based on boundedness, lifecycle, and access patterns.
- **`typescript.md`** — TypeScript style, strictness, types, imports, and safe handling of unknown values.
- **`react-and-ui.md`** — Server/Client Component guidance, shared UI primitives, and consistent form/table/styling patterns.
- **`testing-and-reliability.md`** — tests around business invariants and module contracts, fixtures, logging/error safety, and bounded resource use.

### Roadmap and open questions

- **`roadmap.md`** — high-level future capability themes and dependencies, labeled `[TARGET]` or `[OPEN]`. It is directional, not a release commitment or implementation plan; avoid dates unless they are explicitly agreed. Link to detailed feature plans rather than copying them.
- **`open-questions.md`** — canonical register for unresolved product and architecture questions. Give each item an ID, question, reason it matters, known options, affected docs/modules, and a status such as `open`, `deferred`, or `decided`. Relevant guides should link to the ID instead of duplicating its full rationale. When a durable decision is reached, update the guide and write an ADR if the choice warrants one.

### Workflows

- **`feature-changes.md`** — how to locate the owning module, trace current behavior, implement through established seams, and update related guidance.
- **`refactoring-and-legacy-cleanup.md`** — how to classify current/legacy code, establish a safe change boundary, and remove unused or duplicate code without treating historical material as a design source.
- **`documentation-and-adr.md`** — when to update a living guide versus write an ADR, and how to link the two.

## 4. Module and business-logic principles

These principles summarize the direction captured in the canonical architecture and convention guides. Read those guides for the detailed rules and current exceptions; use the principles to support clear business logic, not as an acronym checklist.

1. **Organize around business capabilities.** A module owns its business rules, invariants, use cases, and persistence contract; technical folders do not own workflows by themselves.
2. **Keep boundaries explicit and dependencies acyclic.** Consumers use a module's intended public surface; they do not reach into its models or repositories. Avoid circular dependencies.
3. **Keep framework and I/O concerns at the edges.** Routes, React components, Mongoose models, and marketplace adapters translate inputs/outputs; business decisions live with the owning capability.
4. **Make optionality real.** Core capabilities must not require an optional module at runtime. Module activation, rollout flags, and authorization remain separate decisions.
5. **Use DRY for shared knowledge, not superficial similarity.** Prefer KISS and YAGNI; wait for a stable repeated rule before extracting shared machinery (Rule of Three is a useful heuristic).
6. **Apply SOLID pragmatically.** Favor focused responsibilities, small contracts, and dependency direction that supports testing. Do not introduce patterns merely to satisfy a checklist.
7. **Make tenant scope explicit and server-trusted.** Resolve organization membership and Store scope from authenticated server context; never treat a client-selected tenant identifier as authorization.
8. **Choose MongoDB document boundaries from lifecycle and access patterns.** Embed bounded values that are read and changed with their parent; keep independently growing or high-churn records independently addressable.
9. **Test behavior at useful seams.** Focus on domain invariants and public module contracts, not only isolated helpers.
10. **Reuse established UI systems.** Domain screens compose the shared UI, forms, and tables instead of creating parallel design patterns.

## 5. Decisions and open questions to preserve

### Working agreements from discussion

- Documentation is written in English.
- A user may belong to multiple Organizations. An Organization may have multiple Stores/brands; a Store may have multiple accounts for the same sales platform.
- Optional modules are intended to be enabled or disabled per Organization at runtime. Finance is optional, and Inventory is considered part of Finance.
- Inventory's conceptual target is organization-level physical stock, Store allocation, and Order reservation. For now assume one warehouse; do not preclude multiple warehouses later.
- Marketplace API integrations are not available in the current setup. Do not promise current real-time channel stock accuracy, automatic sync, or prevention of overselling.
- MongoDB embedding is appropriate for bounded data when its lifecycle and access pattern fit; it is not a blanket rule for all arrays.

### Keep explicitly open

- Whether a Store's sales accounts share an allocation pool or have separate channel quotas.
- What source and freshness future channel-specific low-stock reminders can rely on before/after API integrations.
- The final ownership and sharing model for the product catalog across Stores.
- Organization membership role scope and permission matrix, including whether roles are predefined or customizable and whether grants can be Store-scoped.
- Ownership and boundaries for future Settings, Suppliers, Customers, and Marketing capabilities.

Track these items in `open-questions.md` and link them from the relevant architecture guide and roadmap. Do not make an open question look like an accepted ADR.

Open questions should be recorded as open product/architecture questions in the relevant guide until there is a decision worth preserving as an ADR.

## 6. ADR policy and decision status

Keep ADRs in `.agents/ADR/`, as a sibling to `.agents/docs/`. The ADR index should explain statuses (`proposed`, `accepted`, `rejected`, `superseded`) and link to the current guide. Each ADR should capture context, decision drivers, considered options, decision, consequences, and supersession links.

Create an ADR only for a durable choice with meaningful alternatives or migration cost—not for every coding convention or implementation detail. The accepted decisions are:

- [ADR-0001 — Organization-level physical inventory and Store allocation](../ADR/0001-organization-inventory-allocation.md).
- [ADR-0002 — Organization-scoped optional module activation](../ADR/0002-organization-scoped-module-activation.md).

Other candidate topics remain open and must not be presented as accepted decisions:

- The Orders–Finance integration seam.
- Product catalog ownership across Stores.
- Channel-account stock publication and reconciliation after integrations become feasible.

The Finance-specific implementation plans and ADRs under `.agents/features/finance/` remain out of scope for this pass.
