# Pasaria Accounting Module Implementation Plan

Status: Phase 0 completed; Phase 1 schema/model implementation completed; Phase 2 domain foundation implemented; Phase 3 implemented; Phase 6A implemented.

Pasaria should evolve from a marketplace analytics dashboard into a commerce operating system. The accounting foundation follows the standard accounting-software approach used by QuickBooks, Xero, Accurate Online, and Mekari Jurnal:

```text
Operational modules
  → subledgers
  → general journal
  → general ledger
  → trial balance
  → financial statements
```

The General Ledger is the accounting source of truth. Operational modules retain business detail and later post balanced journal entries into accounting.

## Accounting principles

- Use double-entry accounting.
- Every posted journal must have equal total debits and credits.
- Posted journals are immutable; corrections use reversal/correcting entries.
- Accounting periods can be closed and reject new postings after closing.
- Every journal has a source type, source ID, and idempotency key.
- Inventory has both quantity and value subledgers.
- Store/channel analysis uses dimensions instead of duplicating the Chart of Accounts.
- Business-domain Mongoose models use `organization` as their tenant reference.
- Better Auth internal models continue to use `organizationId`.
- The business supports accrual-capable accounting, with cash flow reported separately.

## Current implementation order

The implementation order is intentionally not strictly numerical:

```text
Phase 0 → Phase 1 → Phase 2 → Phase 3
                              ↘ Phase 6A — operational UI/widgets
                                → Phase 4 — order integration
                                → Phase 5 — settlement/reconciliation
                                → Phase 6B — financial reporting UI
                                → Phase 7 — manual accounting and adjustments
```

Phase 4 can be implemented after Phase 6A because it reuses the posting and
inventory services. Phase 5 follows Phase 4 because marketplace settlement
needs completed-order and marketplace-receivable events.

## Phase 0 — Tenancy alignment

### Scope

Align the existing tenant boundary before adding financial data.

### Completed work

- Verified the project uses `better-auth@1.6.23` and Better Auth Organization Plugin.
- Kept `organizationId` for Better Auth/session tenant context.
- Kept `organization` for Pasaria business-domain Mongoose references.
- Removed unreliable global Mongoose plugin registration from `lib/db/connection.ts`.
- Applied the tenant plugin explicitly to tenant-scoped business models.
- Made tenant-scoped queries fail closed without an organization context.
- Fixed repository creation to write `organization`, not `organizationId`.
- Scoped store lookup, report aggregation, and order bulk writes.

### Acceptance criteria

- All business models use `organization`.
- All repositories take the tenant from `tenantContext.organizationId`.
- No business repository writes `organizationId` to a business model.
- Tenant-scoped queries require an organization context.
- Aggregate and bulk-write paths cannot bypass tenant scope.
- Better Auth internal schema is not changed.

### Follow-up

Add automated tenant-isolation tests for reads, updates, deletes, aggregates, and bulk writes.

## Phase 1 — Accounting foundation schema/model

### Scope

Backend domain models only. No UI, public API, posting automation, order-import changes, or inventory deduction yet.

### Initial structure

```text
modules/
  accounting/
    accounts/{account.schema.ts,account.model.ts,account.dto.ts}
    journal-entries/{journal-entry.schema.ts,journal-entry.model.ts,journal-entry.dto.ts}
    periods/{accounting-period.schema.ts,accounting-period.model.ts,accounting-period.dto.ts}
    opening-balances/{opening-balance.schema.ts,opening-balance.model.ts,opening-balance.dto.ts}
  inventory/
    items/{inventory-item.schema.ts,inventory-item.model.ts,inventory-item.dto.ts}
    locations/{inventory-location.schema.ts,inventory-location.model.ts,inventory-location.dto.ts}
    movements/{inventory-movement.schema.ts,inventory-movement.model.ts,inventory-movement.dto.ts}
  expenses/
    expenses/{expense.schema.ts,expense.model.ts,expense.dto.ts}
```

### Phase 1 supporting primitives

These supporting files belong in Phase 1 because they define the vocabulary and
database contract used by every accounting model:

```text
modules/accounting/
  accounting.constant.ts
  accounts/account.seed.json
```

Phase 1 also includes account type definitions, status definitions, reference
and source types, index definitions, and model-level accounting invariants such
as balanced journal lines and non-negative debit/credit values. The seed JSON
uses `parent_code` for human-readable hierarchy; a future seeder resolves it to
`parent_account` ObjectIds for a specific organization.

### Phase 1 entities

#### Account / Chart of Accounts

```text
organization
code
name
type
subtype
parent_account
normal_balance
is_system
is_postable
is_active
display_order
```

Account types:

```text
asset | liability | equity | revenue
cost_of_sales | expense | other_income | other_expense
```

Parent accounts should normally be non-postable. Accounts are archived with `is_active: false`, not physically deleted.

#### Journal Entry

```text
organization
entry_number
transaction_date
posting_date
period
description
source_type
source_id
source_event
idempotency_key
status: draft | posted | reversed
posted_at
posted_by
reversal_of
lines
```

Journal lines:

```text
account
debit
credit
description
dimensions
```

Invariants:

```text
total_debit === total_credit
debit >= 0
credit >= 0
one line cannot contain both debit and credit
account must be postable
period must be open
```

Journal lines may be embedded in `JournalEntry` initially. Conceptually, the domain still distinguishes journal headers and journal lines.

#### Accounting Period

```text
organization
period_key
start_date
end_date
status: open | closed
closed_at
closed_by
```

#### Opening Balance

Support opening balances for cash, bank, marketplace receivable, inventory, liabilities, owner capital, and future fixed assets.

#### Accounting dimensions

Do not create separate accounts such as `Shopee Sales`, `TikTok Sales`, and `Website Sales`. Use shared accounts such as `Sales Revenue` with dimensions such as `channel`, `store`, `warehouse`, and `product`.

#### Inventory Item

`Product` currently represents marketplace products. Inventory needs a more general item model for merchandise, packaging, supplies, and future fixed assets.

```text
organization
sku
name
item_type
unit
track_quantity
track_value
inventory_account
cogs_account
reorder_point
is_active
```

Item types: `merchandise`, `packaging`, `supplies`, `fixed_asset`.

#### Inventory Location

`Store` is a sales channel/storefront. It is not the same as a physical inventory location. Inventory locations may include the main warehouse, shelves, or a home storage area.

#### Inventory Movement

```text
organization
inventory_item
location
movement_type
quantity
unit_cost
total_cost
occurred_at
source_type
source_id
reference
```

Movement types: `purchase`, `sale`, `return`, `damage`, `loss`, `adjustment`, `transfer_in`, `transfer_out`, `consumption`.

#### Expense

Expenses reference an expense account rather than relying only on free-text categories. They should later support source documents, payment accounts, vendors, attachments, and journal references.

### Out of scope for Phase 1

- UI
- Public API
- Posting engine
- Automatic journals
- Order import changes
- Automatic stock deduction
- Marketplace settlement integration
- Bank integration
- P&L and cash-flow screens
- Payroll workflows
- Owner distribution workflows

### Completed implementation

- Added Chart of Accounts schema, DTO, and Mongoose model.
- Added Journal Entry schema, DTO, and Mongoose model.
- Added Accounting Period schema, DTO, and Mongoose model.
- Added Opening Balance schema, DTO, and Mongoose model.
- Added Inventory Item schema, DTO, and Mongoose model.
- Added Inventory Location schema, DTO, and Mongoose model.
- Added Inventory Movement schema, DTO, and Mongoose model.
- Added Expense schema, DTO, and Mongoose model.
- Added accounting constants/enums and a realistic Indonesian e-commerce Chart
  of Accounts seed template at `modules/accounting/accounts/account.seed.json`.
- Added Phase 1 model indexes and model/schema-level accounting invariants.
- Registered all Phase 1 models in the Mongoose connection bootstrap.
- Did not add UI, public API, posting automation, or order-import integration.

## Phase 2 — Domain services and posting engine

- Thin repository and service layers for validation and persistence boundaries.
- Posting validation service: postable accounts, open period, balanced lines,
  source/reference integrity, and idempotency.
- Default Chart of Accounts.
- Journal posting service and reversal service.
- Accounting-period validation.
- Idempotency enforcement.
- Audit log.
- Opening-balance initialization.

### Phase 2 implementation status

- Added tenant-scoped repositories for accounts, periods, journal entries, and
  opening balances.
- Added default CoA seeding from `account.seed.json`; seeding is idempotent and
  resolves `parent_code` to organization-specific `parent_account` ObjectIds.
- Added journal posting validation for account ownership, postable/active
  accounts, balanced debit-credit totals, source/reference pairs, date ranges,
  and open periods.
- Added idempotent journal posting and reversal services.
- Added opening-balance initialization that creates and posts its journal entry.
- Added accounting audit logs for journal posting, journal reversal, opening
  balance posting, and period closing.
- Services accept an optional Mongoose `ClientSession` so callers can wrap
  multi-document workflows in a MongoDB transaction when the deployment runs
  with transaction support. No automatic transaction is forced because the
  current project configuration may run without a replica set.

## Phase 3 — Expense, purchase, and inventory workflow

```text
Expense → Journal Entry
Purchase → Inventory Movement → Journal Entry
Packaging consumption → Inventory Movement → Packaging Expense Journal
```

Example inventory purchase:

```text
Dr Inventory Asset
    Cr Cash / Accounts Payable
```

### Phase 3 implementation status

- Added `ExpenseService` with draft, post, and record workflows. Posting
  creates `Dr Expense / Cr Payment Account`; when no payment account is
  supplied, account `2100 Utang Usaha` is used.
- Added `InventoryMovementService` with purchase and packaging-consumption
  workflows.
- Purchase posting creates `Dr Inventory Asset / Cr Cash, Bank, or Accounts
  Payable` and links the journal entry back to the movement.
- Packaging consumption calculates weighted-average cost from posted movement
  history, validates available quantity, creates `Dr HPP Bahan Packing
  Terpakai / Cr Persediaan Bahan Packing`, and links the journal entry back to
  the movement.
- Added inventory and expense repositories, journal references, idempotency,
  tenant-scoped validation, and audit log events.
- Purchase and consumption services accept an optional `ClientSession`; callers
  should use a MongoDB transaction when atomic multi-document behavior is
  required and transaction support is enabled.

## Phase 6A — Operational UI and widgets

Potential widgets:

- Buy packaging materials.
- Buy inventory.
- Record expense.
- Contribute capital.
- Withdraw owner funds.
- Pay supplier.
- Record salary.
- Adjust inventory.
- Record marketplace payout.
- Transfer between accounts.

Widgets are interfaces for source transactions. They must not bypass domain services or write journal lines directly.

### Phase 6A implementation status

- Added the `/dashboard/accounting` Finance Desk using the existing
  Shadcn/Base UI components.
- Added tenant-scoped bootstrap and setup endpoints for default CoA, current
  accounting period, accounts, inventory items, and inventory locations.
- Added operational API endpoints for expense posting, inventory purchase, and
  packaging consumption.
- Added UI flows for `Catat expense`, `Beli inventory`, and `Pakai packaging`.
- The UI displays the active period and setup state, and sends all writes
  through Phase 2–3 domain services.
- Added Accounting navigation entry in the dashboard sidebar.

Phase 6A deliberately does not provide direct journal or ledger input. That
belongs to Phase 7.

## Phase 4 — Order integration

Orders progress through:

```text
imported → matched → validated → completed
→ stock movement posted → sales journal posted
```

Importing the same file twice must not create duplicate stock movements or journals.

Order recognition and marketplace settlement are separate events:

```text
Order completed:
Dr Marketplace Receivable
    Cr Sales Revenue

Marketplace settlement:
Dr Bank
Dr Marketplace Fee
    Cr Marketplace Receivable
```

## Phase 5 — Cash, settlement, and reconciliation

- Financial accounts.
- Cash and bank accounts.
- Marketplace receivable.
- Settlement records.
- Bank reconciliation.
- Shopee balance reconciliation.
- Transaction matching.

## Phase 6B — Financial reporting UI

After Phases 4 and 5, add ledger detail, trial balance, P&L, cash-flow, stock
valuation, marketplace receivable, settlement, and reconciliation screens.

## Phase 7 — Manual accounting and adjustments

Users may create manual journal entries, but they must always enter through the
same journal posting service used by operational workflows:

```text
Manual Journal Entry
  → double-entry validation
  → open-period validation
  → posted journal
  → derived General Ledger
  → trial balance and financial statements
```

The General Ledger is not a direct input table. It is derived from posted
journals. Phase 7 may include manual journals, capital contributions, owner
withdrawals, salary/compensation, account transfers, adjustments, approval
controls, and journal reversal.

## Recommended decisions before Phase 1

1. Use accrual-capable accounting with cash flow reported separately.
2. Use IDR first.
3. Use `organization` on business-domain models.
4. Use store/channel as dimensions, not separate accounts.
5. Make posted journals immutable and correct them through reversal.

## References

- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [Better Auth MongoDB Adapter](https://better-auth.com/docs/adapters/mongo)
- [Xero Chart of Accounts](https://central.xero.com/s/article/View-your-chart-of-accounts)
- [Xero General Ledger](https://www.xero.com/us/guides/general-ledger-accounting/)
- [QuickBooks Inventory Asset and COGS](https://quickbooks.intuit.com/learn-support/en-us/help-article/inventory-management/understand-inventory-assets-cost-goods-sold/L2WiXgAAE_US_en_US)
- [Accurate Online Account Mapping](https://help.accurate.id/product/accurate-online/fitur-aol/pengaturan/preferensi/cara-mengatur-akun-perkiraan-preferensi/)
- [Mekari Jurnal Integration Mapping](https://help-center.mekari.com/hc/id/articles/55471711421849-Bagaimana-Mengintegrasikan-Mekari-POS-F-B-dengan-Mekari-Jurnal)
