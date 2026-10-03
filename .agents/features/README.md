# Feature Documentation

This directory describes product capabilities and their current user-facing/business behavior. It complements, rather than duplicates, shared architecture and convention guidance.

## Feature guides

- [Orders](orders/README.md) — imported marketplace Orders, lifecycle, product matching, and Finance integration.
- [Products](products/README.md) — Store-scoped catalog records, variants, cost history, imports, and the current Inventory source contract.
- [Reports](reports/README.md) — Store-scoped analytics aggregated from Orders.
- [Files](files/README.md) — file metadata and the current upload/storage helpers used by import workflows.
- [Stores](stores/README.md) — Organization-owned Store records and the current Store/channel-account boundary.
- [Settings](settings/README.md) — planned Settings hub, phased implementation, and User/Organization/Store/Finance ownership boundaries.
- [Authentication and Organization Access](authentication-and-access/README.md) — current Better Auth sign-in/onboarding flows and the unimplemented member/invitation management and future RBAC policy.
- [Finance](finance/README.md) — optional Organization capability, with guides for setup, accounting, sales, inventory, suppliers, purchases/expenses, and cash management.

## Writing and maintenance rules

- Describe observed behavior as `[CURRENT]`; use `[TARGET]` only for an agreed direction. Link unresolved decisions to their stable IDs in [Open Questions](../docs/open-questions.md).
- Inspect active code and routes before adding or revising a claim. Source code and configuration remain authoritative when a guide is stale.
- Keep one guide focused on a cohesive capability or workflow. Split a large domain by business capability, not by every source file or CRUD endpoint.
- Explain ownership, important state transitions, inputs/outputs, limitations, and meaningful cross-module dependencies. Avoid duplicating shared tenancy, UI, API, or coding rules; link to the canonical guide instead.
- Update the relevant feature guide alongside a change that materially changes its workflow or business rules.
- Keep Finance-specific feature guides under `finance/`. General cross-cutting decisions belong in `.agents/ADR/`; existing Finance-specific plans and ADRs remain where they are unless deliberately reorganized.
