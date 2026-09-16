# Pasaria Accounting Module Implementation Plan

Status: Phase 0 completed; Phase 1 schema/model implementation completed; Phase 2 domain foundation implemented; Phase 3 implemented; Phase 6A implemented; Phase 4 implemented; Phase 5 settlement foundation implemented.

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
- Store/workspace and platform analysis uses dimensions instead of duplicating the Chart of Accounts.
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
                                → Phase 7A — store-aware accounting foundation
                                → Phase 7B — store/platform-aware source postings
                                → Phase 7C — store-aware reporting and controls
                                → Phase 7D — manual accounting and adjustments
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

Do not create separate accounts such as `Shopee Sales`, `TikTok Sales`, and
`Website Sales`. Use shared accounts such as `Sales Revenue` with dimensions
such as `store`/workspace, `platform`, `inventory_location`, and `product`.

The business meaning of these terms is:

```text
organization
  └── store/workspace/brand
        ├── Shopee platform
        ├── Tokopedia platform
        ├── Website platform
        └── WhatsApp platform
```

`organization` remains the tenant and accounting-book boundary. A `store` is
the operating workspace or brand inside the organization; it may sell through
multiple platforms. `platform` identifies the sales channel or integration,
not a separate accounting book.

The old required `platform` field has been removed from the `Store` schema and
model. `Store` now represents the workspace or brand only. A future platform
or channel-connection concept will hold Shopee, Tokopedia, Website, WhatsApp,
and other integration identifiers and metadata; accounting code should not
treat platform as a property of `Store`.

For accounting, the intended policy is:

- Order and settlement: store/workspace and platform are required.
- Inventory movements: store/workspace is required when stock is attributable
  to a workspace; the physical inventory location is tracked separately.
- Expense: store/workspace is optional only when the expense is explicitly
  organization-wide; otherwise it must be attributed to a workspace.
- Manual journal: the user must choose a workspace scope or
  organization-wide scope.
- Reports default to organization-wide consolidation and allow filtering by
  store/workspace and platform.

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

Inventory locations are not stores/workspaces and are not sales channels.
They are physical or logical stock locations such as a main warehouse, shelf,
or home storage area. The current implementation uses the
`inventory_locations` collection and the `type` values `warehouse`,
`store_room`, and `other`. There is currently no separate `warehouse` module
or `warehouses` collection.

A separate warehouse module is not required yet. `InventoryLocation` is the
right abstraction while the business has a simple stock structure. A future
warehouse module becomes justified when locations need their own addresses,
managers, transfer workflows, receiving/shipping operations, or workspace
ownership rules. In that case, `warehouse` may become a richer entity while
`inventory_locations` remains the bin/shelf/sub-location layer.

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
  accounting period, accounts, inventory items, and inventory locations. The
  setup action is idempotent and also ensures a default `MAIN` / `Gudang Utama`
  inventory location exists.
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

### Phase 4 implementation status

- Added order accounting state fields: `pending`, `posted`, and `blocked`, with
  references to the sales journal and inventory movements.
- Completed orders imported through the Shopee order import or completed-order
  enrichment attempt accounting integration automatically.
- Added `POST /api/v1/dashboard/orders/[id]/accounting` as an explicit retry
  endpoint for orders blocked by incomplete mapping, missing location, or
  insufficient stock.
- Added tenant-scoped `inventory_item_mappings` as the explicit relationship
  between imported products/variants and internal merchandise inventory items.
  One active product/variant mapping is allowed, while one inventory item may
  be shared by multiple channel listings.
- Added `/dashboard/inventory/mappings` with list, create, edit, and archive
  flows so mappings can be inspected and maintained without editing MongoDB
  directly.
- Order integration now resolves product/variant mappings first and keeps the
  existing product-matching and SKU fallback for migration compatibility.
  Unresolved mappings are blocked instead of silently reducing the wrong
  stock.
- Added `sale` inventory movements. The movement posts `Dr HPP Barang Dagang /
  Cr Persediaan Barang Dagang` using the inventory weighted-average value.
- Completed-order recognition posts `Dr Piutang Marketplace / Cr Penjualan
  Barang Dagang`. Marketplace payout and fee recognition remain in Phase 5.
- Import retries are idempotent through order-scoped inventory and journal
  idempotency keys. The services accept an optional MongoDB `ClientSession` so
  callers can wrap the workflow in a transaction when replica-set support is
  available.

## Phase 5 — Cash, settlement, and reconciliation

- Financial accounts.
- Cash and bank accounts.
- Marketplace receivable.
- Settlement records.
- Bank reconciliation.
- Shopee balance reconciliation.
- Transaction matching.

### Phase 5 settlement foundation implementation status

- Added tenant-scoped marketplace settlement records with settlement lines,
  destination account, source file, idempotency key, and reconciliation
  status.
- Released-funds enrichment now attempts settlement posting after the order
  data is updated.
- The default destination is `1130 Saldo Marketplace`; callers may provide a
  bank or cash account explicitly through `destination_account_id`.
- A matched settlement posts `Dr Cash/Saldo Marketplace`, `Dr Marketplace
  Fees`, and `Cr Piutang Marketplace`.
- Settlement posting is blocked when the order recognition is not posted or
  when `net payout + fees` does not equal the marketplace receivable amount.
  The difference is stored for reconciliation instead of being silently
  forced into the ledger.
- Added a retry endpoint for blocked settlements:
  `POST /api/v1/dashboard/accounting/settlements/[id]/retry`.
- Bank-statement ingestion and broader transaction matching remain separate
  follow-up work within this phase because the project does not yet have a
  bank statement source adapter.

## Phase 6B — Financial reporting UI

After Phases 4 and 5, add ledger detail, trial balance, P&L, cash-flow, stock
valuation, marketplace receivable, settlement, and reconciliation screens.

### Phase 6B implementation status

- Added tenant-scoped `GET /api/v1/dashboard/accounting/reports` with period
  filtering (`YYYY-MM`) and optional custom `from`/`to` dates.
- Added a reporting service that derives trial balance, P&L, cash movement,
  marketplace receivable, inventory valuation, recent journal activity, and
  settlement summary from posted domain records.
- Added `/dashboard/accounting/reports` with Shadcn/Base UI tabs for overview,
  trial balance, inventory valuation, and journal activity.
- Added the read-only accounting explorer pages:
  `/dashboard/accounting/accounts`, `/dashboard/accounting/journal-entries`,
  and `/dashboard/accounting/ledger`. These expose the CoA, journal headers and
  lines, source references, and derived running ledger balances so automated
  postings can be inspected without writing directly to the ledger.
- Added period selection, KPI cards, P&L chart, settlement exception alert, and
  empty states for tenants that do not yet have posted activity.
- Reporting is read-only. It does not create journal entries or write ledger
  rows; all values are derived from posted journals and posted inventory or
  settlement records.
- Bank reconciliation detail, export/print formats, comparative periods, and
  balance-sheet presentation remain follow-up work after the first reporting
  screen.

## Phase 7 — Store-aware accounting and manual accounting

Phase 7 is split because manual journals should not be built on top of an
ambiguous store/platform model. The accounting book remains organization-level,
while store/workspace and platform become validated reporting dimensions.

The project supports two onboarding paths for businesses that already operate
before Pasaria accounting is enabled:

1. Use the optional `Phase 7A-0` cutover path and start with verified opening
   balances as of a chosen date.
2. Use a historical migration/re-entry path when the business has complete
   exports or reliable records from an earlier system. Historical transactions
   may then be imported and posted according to their original periods.

Neither path is mandatory for every organization. The selected path must be
recorded per organization so historical orders are not accidentally posted
twice or mixed with opening balances.

### Phase 7A-0 — Optional accounting cutover and initialization

This is an optional onboarding phase, not a prerequisite for the rest of
Phase 7. It is intended for organizations that want to begin accounting from
the current state without reconstructing every historical transaction.

The cutover workflow should:

- Let the organization choose and record a cutover date.
- Capture verified opening balances for bank, cash, marketplace balances,
  receivables, payables, loans, fixed assets, and owner equity.
- Capture opening inventory quantities and cost per inventory item and
  inventory location, not only the total inventory asset journal balance.
- Create a balanced, auditable opening journal through the same posting engine
  used by other accounting workflows.
- Keep historical orders before the cutover date outside automatic order
  posting unless the organization explicitly chooses historical migration.
- Provide reconciliation information showing the source, date, value, and
  unresolved difference for each opening balance.

Opening inventory must create both a quantity subledger movement and the
corresponding accounting value. A journal-only inventory opening balance is
insufficient because order integration and stock valuation depend on movement
history.

If records are incomplete, a temporary opening-balance clearing or historical
adjustment account may be used only with explicit documentation and a later
reconciliation plan. The system must not silently treat estimates as verified
historical balances.

The existing `OpeningBalanceService` is the backend foundation for this path,
but the cutover UI, organization onboarding choice, opening inventory workflow,
and historical-order boundary controls remain future implementation work.

### Phase 7A — Store-aware accounting foundation

Finalize the business model and vocabulary before adding manual input:

- Keep `organization` as the tenant and accounting-book boundary.
- Keep the term `store` in the product, but define it as the workspace/brand
  operating unit.
- Remove the assumption that one store has exactly one platform.
- Introduce a separate platform/channel connection concept for Shopee,
  Tokopedia, Website, WhatsApp, and future channels.
- Define whether each dimension is required, optional, or explicitly
  organization-wide for each transaction type.
- Keep physical stock locations under `inventory_locations`; do not introduce a
  separate warehouse module until warehouse workflows require it.

#### Phase 7A implementation status

- Added canonical journal dimensions: `store`, `platform`, `product`, and
  `inventory_location`.
- Removed unused `channel` and journal-dimension `warehouse` fields from the
  new accounting and expense schemas. Source postings now use the canonical
  `platform` dimension, while physical stock continues to use
  `inventory_location`.
- Added organization/store-scoped `store_channel_connections` as the registry
  for a store's platform accounts. The model stores platform identity and
  external account identity, but does not store marketplace credentials.
- Added tenant-scoped list, create, update, and archive API endpoints for
  store-channel connections.
- Platform values remain extensible slugs rather than a hardcoded enum so new
  channels can be added without a schema migration. Supported platform
  connections should still be validated by the relevant integration module.

### Phase 7B — Store/platform-aware source postings

Propagate validated dimensions through every posting source:

- Order revenue, marketplace receivable, HPP, and inventory movements.
- Marketplace settlements and marketplace fees.
- Expenses, packaging consumption, and inventory purchases.
- Future payroll, owner withdrawals, capital contributions, and transfers.

Source records should carry the workspace and platform attribution so journal
dimensions can be derived from the source transaction rather than from the
currently active UI store alone.

#### Phase 7B implementation status

- Order accounting conversion now reads the order's `store` and `platform`
  as the source of truth. It no longer attributes the journal to the active
  UI store.
- Order-generated merchandise sale movements now persist `store` and
  `platform`, and their HPP/inventory journals include
  `inventory_location` plus the source dimensions.
- Marketplace settlements now persist the order's `store` and derive their
  journal dimensions from that source order.
- Inventory movement journals now consistently carry canonical dimensions for
  store, platform when applicable, and inventory location.
- Expense posting accepts the same canonical dimensions and validates an
  explicitly supplied store against the active organization.
- Store references are checked against the active organization before source
  postings are created. Platform connection enforcement remains an integration
  concern and will be added when channel-specific credentials/import flows are
  implemented.

### Phase 7C — Store-aware reporting and controls

Extend the reporting and explorer pages with:

- `All stores` organization-wide view.
- Store/workspace filter.
- Platform filter.
- Store/platform profit and loss analysis.
- Journal and ledger drill-down filtered by dimension.
- Organization-wide/shared transaction visibility.
- Permission checks so a store-scoped user cannot inspect another workspace.

The organization-wide balance sheet remains the primary financial statement.
Per-store balance-sheet views must only show balances that are attributable to
that store; shared cash, equity, and other centralized balances must not be
silently duplicated across stores.

#### Phase 7C implementation status

- Accounting reports and the journal/ledger explorer now accept `store_id` and
  `platform` filters.
- Filtered reports operate on journal-line dimensions, so mixed-dimension
  journals are not counted in full when only one store or platform is selected.
- Inventory snapshots filter source movements, while settlement summaries
  filter source settlements using their persisted store/platform attribution.
- The API returns active store/workspace and known platform options so the UI
  does not need to hardcode the available scope.
- The organization remains the enforced tenant boundary. The current Better
  Auth setup has organization roles but no membership-per-store assignment, so
  a future store-scoped permission layer is still required before restricting
  organization members to individual workspaces.

### Phase 7D — Manual accounting and adjustments

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
journals. Phase 7D may include manual journals, capital contributions, owner
withdrawals, salary/compensation, account transfers, adjustments, approval
controls, and journal reversal. Every manual journal must declare either a
store/workspace scope or an explicit organization-wide scope.

## Recommended decisions before Phase 1

1. Use accrual-capable accounting with cash flow reported separately.
2. Use IDR first.
3. Use `organization` on business-domain models.
4. Use store/workspace and platform as dimensions, not separate accounts.
5. Keep physical inventory locations separate from stores/workspaces.
6. Make posted journals immutable and correct them through reversal.

## References

- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [Better Auth MongoDB Adapter](https://better-auth.com/docs/adapters/mongo)
- [Xero Chart of Accounts](https://central.xero.com/s/article/View-your-chart-of-accounts)
- [Xero General Ledger](https://www.xero.com/us/guides/general-ledger-accounting/)
- [QuickBooks Inventory Asset and COGS](https://quickbooks.intuit.com/learn-support/en-us/help-article/inventory-management/understand-inventory-assets-cost-goods-sold/L2WiXgAAE_US_en_US)
- [Accurate Online Account Mapping](https://help.accurate.id/product/accurate-online/fitur-aol/pengaturan/preferensi/cara-mengatur-akun-perkiraan-preferensi/)
- [Mekari Jurnal Integration Mapping](https://help-center.mekari.com/hc/id/articles/55471711421849-Bagaimana-Mengintegrasikan-Mekari-POS-F-B-dengan-Mekari-Jurnal)
