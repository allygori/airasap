# Product and Architecture Roadmap

> This is a directional map of product and architecture themes, not a release plan, implementation commitment, or dated schedule. Items marked `[OPEN]` need discussion before they become implementation requirements.

## How to use this roadmap

- **[CURRENT]** describes capabilities or architecture that exist now, based on the active codebase.
- **[TARGET]** describes a future direction agreed or recommended in product/architecture discussions.
- **[OPEN]** describes a choice that still needs an explicit decision.
- No dates, priority order, or delivery estimates are implied here. Sequence work only after scope, dependencies, and capacity are reviewed.
- Detailed implementation plans belong with their feature. Durable architectural choices belong in `.agents/ADR/` after a decision is made.

## Current product baseline

- **[CURRENT]** The product is a seller-operations dashboard built as a Next.js/Mongoose modular monolith.
- **[CURRENT]** Its active business areas include Orders, Products, Stores, Reports, marketplace file workflows, and Finance/accounting. Finance also contains the current inventory implementation.
- **[CURRENT]** Marketplace data arrives through file-based workflows. There is no verified real-time marketplace stock synchronization or guarantee that channel overselling can be prevented.
- **[CURRENT]** Modules are not yet consistently isolated, and there is no general-purpose module activation or feature-flag system. See [Module Boundaries](./architecture/module-boundaries.md) and [Optional Modules and Feature Flags](./architecture/optional-modules-and-flags.md).

## Product and architecture themes

### 1. Clear business and codebase ownership

- **[TARGET]** Keep business rules and persisted writes with the module that owns the capability. Make cross-module contracts deliberate and avoid new dependency cycles or deep imports.
- **[TARGET]** Improve the Orders–Finance seam so core Order intake does not require optional Finance behavior. Define retry and reconciliation behavior for optional follow-on work before making the integration stricter.
- **[TARGET]** Use the conventions and workflows in this documentation set to make new work easier for the owner, future contributors, and AI coding assistants to navigate consistently.
- **[OPEN]** Decide which legacy areas should be refactored first based on actual change frequency, defects, and contributor friction. This roadmap does not set a cleanup priority.

### 2. Organization, Store, and channel-account model

- **[TARGET]** Support a user belonging to multiple Organizations, with an Organization containing multiple Stores/brands and a Store supporting multiple accounts for the same sales platform.
- **[TARGET]** Treat Organization as the tenant/consolidation scope and Store as a brand or sales operation. Verify membership and Store ownership on the server.
- **[OPEN]** Product catalog ownership across Stores and the persisted representation of channel accounts remain undecided. Current Store-scoped Product and Order records do not settle the future model.

### 3. Authentication, authorization, and SaaS readiness

- **[TARGET]** Establish a clear server-side authorization model for Organization members and protected actions before expanding multi-user SaaS use.
- **[TARGET]** Keep authentication, tenant membership, user permissions, Organization module availability, and rollout flags distinct.
- **[OPEN]** Role scope, fixed versus configurable roles, permission granularity, Store-scoped access, invitations, operator support access, subscription/entitlement policy, and billing scope need decisions.
- **[TARGET]** Preserve tenant isolation and auditable access as the product grows beyond a single primary user.

### 4. Optional Finance and inventory capability

- **[TARGET]** Finance can be activated or deactivated per Organization at runtime; Inventory remains part of Finance and is unavailable when Finance is disabled.
- **[TARGET]** The inventory direction distinguishes Organization physical stock, persistent logical allocation to Stores, and temporary Order reservations. Start with one warehouse operationally, while preserving a future multi-warehouse path.
- **[OPEN]** Store allocation persistence, channel-account sharing versus quotas, return handling, shortage reconciliation, and Finance data access after disablement remain undecided.
- **[CURRENT]** Existing Finance inventory records are Organization-scoped and include locations, movements, mappings, and reservations. A persistent Store allocation model and complete multi-warehouse transfer workflow were not verified.
- See [Inventory and Sales Channels](./architecture/inventory-and-channels.md) for the current behavior and target vocabulary.

### 5. Settings and operational capabilities

- **[OPEN]** Settings is a candidate capability spanning user, Organization, Store, and Finance preferences. Decide ownership and authorization separately for each setting before making a broad Settings module.
- **[CURRENT]** Finance includes an Organization-wide Supplier directory linked to new Purchases.
- **[OPEN]** Customer profiles and broad Settings remain future capabilities. Supplier relationships to Stores, products, and full procurement/receiving workflows remain undecided.
- **[OPEN]** Operational features should be placed with the capability that owns their workflow; do not create a new module solely because a navigation section or settings screen exists.

### 6. Marketing and business analysis

- **[TARGET]** Marketing-related capabilities may be explored in the future if they solve an established seller workflow and fit the product's module/dependency model.
- **[OPEN]** Scope, ownership, data sources, integrations, and whether a Marketing capability should be optional have not been decided.

### 7. Marketplace integrations and stock visibility

- **[CURRENT]** File imports do not provide continuous or authoritative marketplace stock data.
- **[TARGET]** If platform APIs become accessible and valuable, add platform-specific adapters that translate external data to explicit application contracts. Keep platform formats out of core Order, Finance, and allocation rules.
- **[OPEN]** Decide channel listing mapping, sync direction, conflict handling, retry behavior, data freshness, warning thresholds, and reconciliation before claiming automatic synchronization or oversell prevention.
- **[TARGET]** Until reliable integration exists, label any channel quantity with its source and observed time; do not present it as a live authoritative balance.

## Dependency map (not a schedule)

Some future work depends on decisions or capabilities elsewhere:

| Future capability | Decisions or foundations it depends on |
| --- | --- |
| Per-Organization runtime module activation | Entitlement versus activation policy, authority to enable modules, behavior when disabled, and server-side enforcement |
| SaaS member roles and permissions | Membership lifecycle, role scope, permission catalog, Store-specific access policy, and audited support model |
| Store allocation and stock warnings | Product-to-inventory ownership, allocation persistence, channel-account pool/quota policy, and source/freshness rules |
| Multi-warehouse Inventory | Location-scoped availability, transfer lifecycle, in-transit handling, reservation location selection, and reconciliation |
| Marketplace stock integration | API access, listing mapping, rate/failure handling, conflict resolution, and user-visible freshness semantics |
| Customer profiles and broad Settings | Domain ownership, lifecycle, Organization/Store scope, relationships to current modules, and optionality requirements |
| Expanded Supplier procurement workflows | Store/product sourcing, receiving, purchase returns, and warehouse relationships |

Dependencies describe questions to resolve and are not a commitment to implement every item.

## Open questions

The canonical question register is [Open Questions](./open-questions.md). Until an item is decided, linked architecture guides may summarize it as `[OPEN]`, but no roadmap bullet or proposed direction should be treated as an accepted ADR or implemented contract.

## Updating this roadmap

Update this page when product direction or major architectural dependencies change. Keep current implementation statements synchronized with code review; keep detailed steps in a feature plan; and record durable decisions in ADRs instead of expanding this page into an implementation checklist.
