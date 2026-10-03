# Finance

> Feature guide based on the current Finance module. Finance is an optional Organization capability; its Inventory capability is part of Finance. These guides describe the implemented behavior and point to the accepted target direction without presenting that direction as finished code.

## Scope and status

- **[CURRENT]** Finance is implemented under `modules/finance` as one business module with capabilities for onboarding, accounting, sales posting, inventory, suppliers, purchases, expenses, cash management, and reporting/read models.
- **[CURRENT]** Finance records are scoped to an Organization. Some operations also retain Store, channel, Order, or source-file dimensions. A selected Store is not the Finance tenant boundary.
- **[CURRENT]** Finance lifecycle state is stored on the Organization and has `not_started`, `in_progress`, `blocked`, and `active` states. Most operational workflows require `active`.
- **[CURRENT]** Finance and Accounting configuration is also nested on the Organization and some fields are written by onboarding. **[TARGET]** The final Settings phase plans to move Finance-specific configuration behind Finance-owned operations after separating it from lifecycle state; see [Settings implementation plan](../settings/implementation-plan.md) and [Q-013](../../docs/open-questions.md#q-013--settings-ownership-and-scope).
- **[CURRENT]** `FinanceEntitlementService` currently makes Finance available to every Organization in this development behavior. This is separate from lifecycle readiness and is not a general module entitlement or activation service.
- **[TARGET]** Finance may be enabled or disabled per Organization at runtime, and disabling Finance also disables Inventory. This target is accepted in [ADR-0002](../../ADR/0002-organization-scoped-module-activation.md); data access and in-progress workflow behavior after disablement remain open in [Q-005](../../docs/open-questions.md#q-005--finance-entitlement-activation-and-disable-behavior).

## Capability guides

- [Setup and onboarding](setup-and-onboarding.md) — Finance access/readiness, lifecycle, opening balances, calendar timezone, and bank-account setup.
- [Accounting](accounting.md) — chart of accounts, journal lifecycle, periods, ledger, subledgers, and financial statements.
- [Sales](sales.md) — marketplace Order posting, offline sales, and released-funds reconciliation.
- [Inventory](inventory.md) — current inventory capability and its relationship to the agreed stock model.
- [Suppliers](suppliers.md) — Organization-wide Finance supplier directory and its Purchase relationship.
- [Purchases and expenses](purchases-and-expenses.md) — purchase posting, stock receipts, and expense/outflow journals.
- [Cash management](cash-management.md) — cash/bank accounts, transfers, cash loans, and owner withdrawals.

## Important module boundaries

- **Orders owns** imported Order facts and lifecycle. Its current import service calls a Finance adapter directly for sales, reservation, and released-funds workflows. Failures can happen after the Order has been saved. The recovery/composition contract remains [Q-007](../../docs/open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract); see the [Orders guide](../orders/README.md).
- **Finance Accounting owns** posted journals and accounting balances. Finance operational workflows should compose the journal service rather than write journal records directly.
- **Finance Inventory owns** inventory items, locations, movements, reservations, and product mappings. It currently reads Product sources from Products; Product quantity is not its stock ledger. Persistent Store allocations remain a target design question; see [Inventory and Sales Channels](../../docs/architecture/inventory-and-channels.md).
- **Products owns** current Store-scoped catalog/listing records and cost inputs. Catalog ownership across Stores remains [Q-001](../../docs/open-questions.md#q-001--product-catalog-ownership-across-stores).
- **Reports** and Finance financial statements have different sources and meanings. Operational Reports aggregate Orders; Finance statements read posted accounting data.

## Source entry points

- [Finance module exports](../../../modules/finance/index.ts) and [client-safe exports](../../../modules/finance/client.ts)
- [Finance lifecycle](../../../modules/finance/finance-lifecycle.service.ts) and [entitlement behavior](../../../modules/finance/finance-entitlement.service.ts)
- [Versioned Finance API routes](../../../app/api/v1/dashboard/finance/)
- [Optional module and feature-flag guidance](../../docs/architecture/optional-modules-and-flags.md), [module boundaries](../../docs/architecture/module-boundaries.md), and [business logic conventions](../../docs/conventions/business-logic.md)
