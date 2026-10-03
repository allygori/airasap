# Open Product and Architecture Questions

> This register preserves unresolved decisions. An `open` or `deferred` item is not an accepted requirement or ADR. Do not infer an answer from existing code unless the item is explicitly marked decided.

## How to use this register

- Give each durable question a stable ID (`Q-###`). Do not reuse an ID after a decision; record the outcome and link any ADR instead.
- `open` means the question is unresolved and can be discussed when relevant.
- `deferred` means it remains unresolved but should wait for a prerequisite, a real use case, or a capability such as external API access.
- `decided` means the decision has been made and the affected guide updated. Link an ADR if the decision has meaningful alternatives, long-term impact, or migration cost.
- Update the affected guides when a question is resolved. Keep the rationale here only when it is still open; the guide should describe the resulting current rule after decision.
- No question requires an answer just to preserve it in this register.

## Organization, membership, and access

### Q-001 — Product catalog ownership across Stores

- **Status:** `open`
- **Question:** Should each Store own independent Product records, or should an Organization maintain a shared catalog with Store/platform listings linked to canonical Products?
- **Why it matters:** The choice affects product identity, duplicate handling, edits across Stores, inventory mappings, reporting, and future channel integrations.
- **Options to explore:** Keep Store-owned catalogs; introduce an Organization catalog with Store listings; or support a gradual link/import model between existing Store Products and a future shared catalog.
- **Affected areas:** Products, Finance Inventory mappings, Orders, Reports, future channel accounts.
- **Guidance:** [Domain and Tenancy](./architecture/domain-and-tenancy.md), [Inventory and Sales Channels](./architecture/inventory-and-channels.md).

### Q-002 — Organization and Store role/permission scope

- **Status:** `open`
- **Question:** Are user roles and permissions attached only to Organization membership, scoped separately per Store, or a combination? Which actions need distinct permissions, and should roles be fixed or configurable?
- **Why it matters:** Users may belong to multiple Organizations and an Organization may have multiple Stores. The access model must support those scopes without granting access based only on an active selection.
- **Options to explore:** A small predefined Organization role set; predefined roles plus explicit Store grants; or configurable roles after real SaaS needs are known.
- **Affected areas:** Better Auth membership, API/server actions, Finance, Store-scoped Products and Orders, audit/access logs.
- **Guidance:** [Identity and Access Control](./architecture/identity-and-access-control.md), [API and Data Access](./conventions/api-and-data-access.md).

### Q-003 — Membership lifecycle and active tenant switching

- **Status:** `open`
- **Question:** How should invitations, role changes, member removal/suspension, ownership transfer, and switching active Organization or Store work?
- **Why it matters:** A selected tenant is context, not proof of authorization. Membership changes must take effect consistently across sessions, routes, imports, and Store-scoped records.
- **Options to explore:** Better Auth's existing organization lifecycle where it fits; application-owned lifecycle rules around it; or a combination with explicit session refresh/revocation behavior.
- **Affected areas:** Better Auth, Organizations, Members, Invitations, tenant context, all protected operations.
- **Guidance:** [Identity and Access Control](./architecture/identity-and-access-control.md), [Domain and Tenancy](./architecture/domain-and-tenancy.md).

### Q-004 — SaaS operator/support access

- **Status:** `deferred`
- **Question:** Will a SaaS operator ever need to access an Organization's data to provide support, and if so, under what authorization, audit, approval, and expiration controls?
- **Why it matters:** Support access can cross normal tenant boundaries and must not silently reuse an Organization member's permissions.
- **Options to explore:** No operator access; time-limited, audited break-glass access; or a restricted support workflow with customer consent and field-level limits.
- **Prerequisite:** A concrete SaaS support model and security requirements.
- **Affected areas:** Authentication/authorization, audit records, tenant data access, SaaS operations.
- **Guidance:** [Identity and Access Control](./architecture/identity-and-access-control.md).

## Optional modules and rollout

### Q-005 — Finance entitlement, activation, and disable behavior

- **Status:** `open`
- **Settled scope:** Optional modules are intended to be enabled or disabled per Organization at runtime; Finance is optional and includes Inventory. See [ADR-0002 — Organization-Scoped Optional Module Activation](../ADR/0002-organization-scoped-module-activation.md).
- **Question:** What is the relationship between an Organization's entitlement/subscription and its choice to enable Finance? After Finance is disabled, what should users be able to read, export, or finish?
- **Why it matters:** Finance is optional per Organization and includes Inventory. Disabling it must not accidentally delete posted accounting or inventory data, strand in-progress work, or bypass authorization.
- **Options to explore:** Whether entitlement gates the Organization's ability to activate Finance or is enforced separately from its runtime toggle. Separately decide whether disabled data is hidden, read-only, exportable, or available for completing in-progress workflows.
- **Affected areas:** Finance, Inventory, Organization settings, access checks, future billing.
- **Guidance:** [Optional Modules and Feature Flags](./architecture/optional-modules-and-flags.md), [Identity and Access Control](./architecture/identity-and-access-control.md).

### Q-006 — Feature-flag scope and ownership

- **Status:** `deferred`
- **Question:** If rollout flags are introduced, should they target environments, Organizations, users, or a combination, and who may change them?
- **Why it matters:** Release rollout is separate from durable module activation and user authorization. Flag evaluation must fail safely and have a removal lifecycle.
- **Prerequisite:** A real staged rollout need; there is no general feature-flag service now.
- **Affected areas:** Application composition, server routes, Organization/user settings, release operations.
- **Guidance:** [Optional Modules and Feature Flags](./architecture/optional-modules-and-flags.md).

### Q-007 — Orders-to-Finance failure and recovery contract

- **Status:** `open`
- **Question:** If an Order is accepted but optional Finance processing is disabled, unavailable, or fails partway, where is the work recorded and how is it retried or reconciled?
- **Why it matters:** Core Order intake should not depend on Finance, while accounting and inventory consequences still need a traceable, recoverable path.
- **Options to explore:** Synchronous best-effort adapter with visible review state; durable pending work/retry record; or an outbox/event approach if independent delivery requirements justify it.
- **Affected areas:** Orders import, Finance sales/accounting, Inventory reservations, module activation, error/reconciliation UI.
- **Guidance:** [Module Boundaries](./architecture/module-boundaries.md), [Business Logic](./conventions/business-logic.md).

## Inventory and channels

### Q-008 — Store allocation persistence and constraints

- **Status:** `open`
- **Question:** How should persistent logical allocations be stored, and what rules govern creating, changing, and releasing a Store's allocation?
- **Why it matters:** Organization physical stock, Store allocation, and Order reservation are separate concepts. Allocation needs to reconcile with on-hand stock, reservations, audit needs, and concurrency.
- **Options to explore:** Separate allocation records; bounded per-item/per-location embedded balances; or another representation chosen from measured query and update patterns. Decide whether allocations can be moved/reduced while reservations exist.
- **Affected areas:** Finance Inventory, Stores, Products, Orders, stock reporting.
- **Guidance:** [Inventory and Sales Channels](./architecture/inventory-and-channels.md), [MongoDB and Schema](./conventions/mongodb-and-schema.md).

### Q-009 — Shared Store pool versus per-account channel quotas

- **Status:** `open`
- **Question:** Do multiple sales accounts/channels in one Store draw from one shared Store allocation, or does each account receive a separate quota?
- **Why it matters:** This affects local availability calculations and warnings when the same item is listed on Shopee, Tokopedia, WhatsApp, offline, or more than one account on the same platform.
- **Options to explore:** Shared pool; explicit per-account quota; or shared local pool with manually tracked channel limits only where operationally needed.
- **Affected areas:** Finance Inventory, channel-account model, stock warnings, future marketplace adapters.
- **Guidance:** [Inventory and Sales Channels](./architecture/inventory-and-channels.md).

### Q-010 — Channel quantity source, freshness, and warnings

- **Status:** `deferred`
- **Question:** What data source and freshness are sufficient for channel-specific low-stock reminders, and how should stale or approximate quantities be presented?
- **Why it matters:** Current imports do not provide continuous channel data, and there is no available API integration to guarantee a channel quantity or prevent overselling.
- **Options to explore:** No channel-specific warning until an integration exists; manually observed quantities with source/time labels; or API-backed quantities with defined freshness and failure states.
- **Prerequisite:** Decide the account stock policy and gain access to reliable platform data before promising automatic synchronization.
- **Affected areas:** Inventory, Reports/notifications, file imports, future platform integrations.
- **Guidance:** [Inventory and Sales Channels](./architecture/inventory-and-channels.md), [Roadmap](./roadmap.md).

### Q-011 — Imported Order, shortage, cancellation, and return reconciliation

- **Status:** `open`
- **Question:** How should Inventory handle Orders imported after their marketplace status has advanced, partial fulfillment, cancellation after reservation, returns/refunds, and channel sales that exceed local available stock?
- **Why it matters:** External status may arrive late or be incomplete. The system must distinguish a local reservation shortage from guaranteed prevention of a sale on a marketplace.
- **Options to explore:** Reserve/release/consume using normalized Order status; record unresolved cases for review; model partial quantities explicitly; define returns as a separate receipt/inspection workflow.
- **Affected areas:** Orders import/status mapping, Finance Inventory reservations and movements, reconciliation UI.
- **Guidance:** [Inventory and Sales Channels](./architecture/inventory-and-channels.md), [Business Logic](./conventions/business-logic.md).

### Q-012 — Multi-warehouse operating model

- **Status:** `deferred`
- **Question:** When the product supports more than one physical warehouse, are Store allocations organization-wide or location-specific, and how are transfers, in-transit stock, and reservation location selection represented?
- **Why it matters:** A logical Store allocation is not a physical transfer. Multi-warehouse support needs a location-aware lifecycle without confusing the two.
- **Prerequisite:** The initial product assumes one warehouse. Revisit when a real multi-location workflow is needed.
- **Affected areas:** Finance Inventory, stock reads, purchasing/receiving, fulfillment, transfers.
- **Guidance:** [Inventory and Sales Channels](./architecture/inventory-and-channels.md), [MongoDB and Schema](./conventions/mongodb-and-schema.md).

## Future business capabilities

### Q-013 — Settings ownership and scope

- **Status:** `open`
- **Current baseline:** `/dashboard/settings` is a hub with Profile, Organization name, and active Store name/code/timezone editing. Better Auth owns User and core Organization identity; Finance/Accounting lifecycle/configuration values are currently nested on the Organization record and partly written by onboarding. Organization logo editing is open because the current avatar field emits data URLs and private file storage has no authenticated read route.
- **Agreed initial direction:** **[CURRENT]** `/dashboard/settings` is a hub that composes owner-specific screens and APIs. It does not own a generic Settings document or mixed-domain write endpoint. Profile and Organization identity remain in Better Auth; a `modules/users/` module is not needed for basic account fields. **[TARGET]** Finance-specific configuration moves behind Finance ownership in the final phase.
- **Open decisions:** Decide the Organization logo's browser-readable private-file delivery contract; inventory which Organization subfields represent Finance lifecycle versus editable Finance configuration; decide the Finance-owned persistence shape and update rules; decide whether Appearance preferences are browser-local or User-synced; define access requirements if multiple members are introduced.
- **Why it matters:** A broad Settings module can become a second home for unrelated business behavior, duplicate Auth identity, and mix User/Organization/Store scopes. Moving Finance fields also risks bypassing onboarding, posting, and accounting lifecycle rules.
- **Affected areas:** Better Auth User/Organization, Settings UI, Stores, Finance/Accounting, appearance preferences, future module activation.
- **Guidance:** [Settings overview](../features/settings/README.md), [implementation plan](../features/settings/implementation-plan.md), [ownership and API contracts](../features/settings/ownership-and-api.md), [Domain and Tenancy](./architecture/domain-and-tenancy.md), and [Module Boundaries](./architecture/module-boundaries.md).

### Q-014 — Supplier ownership and purchasing relationship

- **Status:** `open`
- **Current baseline:** Finance owns a basic Organization-scoped Supplier directory with contact fields and active/inactive status. New Purchases may select an active Supplier and retain a name snapshot plus the Supplier reference. This initial scope does not create Store-specific supplier records or a procurement lifecycle.
- **Question:** How should Suppliers relate to Stores, Products, warehouses, and expanded purchasing/receiving workflows?
- **Why it matters:** Supplier data could be Organization-wide while purchase operations or delivery destinations may be Store- or warehouse-scoped.
- **Options to explore:** Keep the directory Organization-wide and add Store/location dimensions to workflow records; add Store-specific availability; or extend the model only when a concrete sourcing/receiving workflow requires it.
- **Affected areas:** Finance purchases, Inventory receiving, product sourcing, future procurement.
- **Guidance:** [Finance Suppliers](../features/finance/suppliers.md), [Roadmap](./roadmap.md), [Domain and Tenancy](./architecture/domain-and-tenancy.md).

### Q-015 — Customer ownership and data lifecycle

- **Status:** `open`
- **Question:** Is a Customer a shared Organization-level identity across Stores/channels or a Store-owned record, and what personal data, consent, retention, and duplicate-resolution policies apply?
- **Why it matters:** Customer analysis and future marketing depend on identity matching across channels, while customer records may contain sensitive personal data.
- **Options to explore:** Store-local customer records; Organization-level customer profiles with Store/channel references; or defer persistent Customer profiles until a defined workflow needs them.
- **Affected areas:** Orders, Reports, future Customers and Marketing, privacy/data retention.
- **Guidance:** [Roadmap](./roadmap.md), [Domain and Tenancy](./architecture/domain-and-tenancy.md).

### Q-016 — Marketing capability scope and optionality

- **Status:** `deferred`
- **Question:** Which seller workflow would a future Marketing capability own, what data/integrations would it need, and should it be a module that can be disabled per Organization?
- **Why it matters:** “Marketing” can span reports, campaigns, customer data, and channel integrations. A module boundary should follow a real cohesive capability rather than a broad navigation label.
- **Prerequisite:** Define a concrete user problem and required data sources before designing a module.
- **Affected areas:** Reports, Customers, channel integrations, future Marketing.
- **Guidance:** [Module Boundaries](./architecture/module-boundaries.md), [Roadmap](./roadmap.md).

## Resolving a question

1. Review the affected current behavior and domain constraints before choosing an option.
2. Record the decision and consequences in the relevant living guide.
3. Update this item to `decided`, summarize the chosen direction, and link any ADR.
4. Create an ADR when the decision has meaningful alternatives, long-term consequences, or migration cost. Do not create an ADR merely because a question appears in this register.
