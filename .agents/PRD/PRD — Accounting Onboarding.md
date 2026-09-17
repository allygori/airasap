# Product Requirements Document (PRD)
## Accounting Module Onboarding

**Version:** 1.2  
**Date:** 2026-09-17  
**Status:** Refined draft; siap diturunkan menjadi implementation plan backend  
**Language:** Indonesian  

---

## 1. Goal & Big Picture

### Primary Goal
Implement a clean, guided **Accounting Module Onboarding** flow that activates accounting for one organization. This process is separate from organization/store creation and is optional after the user enters the dashboard.

The system must:
- Establish a clear **Accounting Start Date**.
- Set up / review a practical **Chart of Accounts** for the organization.
- Capture accurate **Opening Balances** (cash/bank, marketplace receivables, inventory valuation, and liabilities).
- Calculate and confirm **Owner's Equity (Modal Awal)**.
- Review and validate existing data (Orders + Inventory) against the start date.
- Configure only accounting behavior already supported by the existing system.
- Generate the Opening Balance journal entry and lock the starting point.

### Big Picture Outcome
After completing this onboarding:
- The accounting module becomes usable.
- Future transactions can be journalized cleanly after the accounting start date.
- The user has a correct starting Balance Sheet (Assets = Liabilities + Equity).
- Standard onboarding does not reconstruct past transactions. Historical reconstruction is a separate, permission-gated process.

---

## 2. Important Constraints (Must Follow)

1. **Prefer existing collections and fields.**
   - The system already has collections for: `products`, `orders`, `inventory` (including items, movements, product mappings), and accounting-related data.
   - Adding a namespaced accounting field to the existing `organizations` collection is allowed and preferred for organization-level module state.
   - A new collection is allowed only when the existing structures cannot safely represent the requirement, such as detailed reconstruction workflow or a future payable subledger.

2. **Do not hide unresolved business assumptions.**
   - Use the existing schema as the source of truth.
   - Mark unresolved mappings or policies as open decisions in this PRD.

3. **Accounting is an optional module.**
   - Creating an organization or store must not require accounting onboarding.
   - The user enters the dashboard first and starts accounting from the accounting module.
   - This PRD does not redesign organization/store onboarding.

4. **Existing Data Must Be Respected.**
   - Orders are imported from marketplace exports and may be enriched with separate `completed` and `released-funds` data.
   - Inventory items and movements already exist.
   - Prefer reading and proposing values from existing data rather than forcing the user to re-enter everything.

---

## 3. Context from Current System

- The current primary use case is an Indonesian marketplace seller, including Shopee, but the accounting boundary is the organization.
- Accounting uses one ledger per organization; stores and platforms are dimensions of transactions, not separate ledgers.
- Accounting is optional and is activated from the dashboard.
- No complete historical transaction records exist.
- Current real assets/liabilities include:
  - Money in bank accounts
  - Pending marketplace funds (receivables)
  - Physical stock (inventory)
  - Debts to suppliers / other people
- Orders come from marketplace exports → imported → optionally enriched.
- Inventory module already tracks items, movements, and product mappings.
- A default Chart of Accounts seed already exists, but it is only a baseline. It must be adaptable to the organization's actual accounts and must not force automation to depend on hardcoded account codes.
- Bank accounts are represented as postable child accounts in the Chart of Accounts; a separate bank-account collection is not required for the first version.
- User is currently stuck on the Opening Balance process (especially inventory valuation).

---

## 4. Accounting Module Lifecycle and Flow

The user must be able to enter the dashboard and use non-accounting modules without completing this flow. Accounting displays a module gate when it is not enabled.

### Module states

- `not_enabled`: accounting belum disiapkan.
- `onboarding`: user sedang menyimpan atau melanjutkan draft setup.
- `active`: setup sudah selesai dan accounting dapat digunakan.

### Standard onboarding steps

1. Accounting start date and calendar context.
2. Data readiness dan inventory readiness.
3. Chart of Accounts review dan account setup.
4. Inventory opening setup:
   - select product/variant candidates that are actually inventory-managed;
   - optionally enter location, quantity, and unit cost;
   - choose an aggregate-value fallback only when detailed stock is postponed.
5. Opening balance:
   - cash dan bank;
   - marketplace receivables;
   - inventory;
   - liabilities;
   - calculated owner equity.
6. Review, confirmation, dan finalisasi.

Standard onboarding tidak menawarkan historical reconstruction. Reconstruction dibuka dari flow terpisah untuk user yang berhak.

### Finalisasi

Finalisasi harus:

- memastikan Chart of Accounts, period, dan inventory prerequisites tersedia;
- menghasilkan opening balance dan journal yang seimbang;
- tidak menggandakan nilai inventory;
- menyimpan status organization sebagai active/completed;
- mengunci accounting start date;
- menyimpan actor dan timestamp;
- aman terhadap retry dan concurrent request.

Setelah selesai, halaman onboarding dan endpoint mutasinya tidak dapat digunakan kembali oleh user biasa.

---

## 5. Detailed Requirements

### 5.1 Accounting start date

For standard onboarding, recommend and enforce the first day of a calendar month. This matches the current monthly accounting period design and makes monthly reporting and reconciliation safer.

Timezone is required for deterministic period boundaries, but it should not be a repeated free-form input in the onboarding wizard. The current store timezone is the default source. Because one organization has one ledger, the organization must eventually have one accounting calendar timezone; initialize it from the primary store and expose it under Accounting settings only when stores use different timezones.

Rules:

- date cannot be in the future;
- date is interpreted using the accounting calendar timezone, not the browser timezone or a blind UTC conversion;
- date is inclusive and becomes the cutover boundary;
- standard onboarding does not create journals for transactions before the date;
- start date is locked after finalization;
- arbitrary mid-month dates are reserved for the reconstruction/advanced process.

The existing timezone constants must also keep the Indonesian labels correct: WITA is UTC+8 (`Asia/Makassar`) and WIT is UTC+9 (`Asia/Jayapura`).

### 5.2 Data readiness

Before opening balances, display:

- product and variant counts;
- inventory item and mapping counts;
- active inventory locations;
- inventory movements and available cost data;
- negative stock or missing cost warnings;
- order count and order status counts;
- separate completed and released-funds enrichment information;
- existing accounting state on orders.

Warnings should not block onboarding unless they make the selected setup mode unreliable.

### 5.3 Product and inventory readiness

`products` and `inventory_items` remain separate concepts. Product master data describes what can be sold; inventory items describe what the organization chooses to track in quantity and value.

Do not automatically convert every product into an inventory item. Creating zero-stock items in bulk can create noise and does not establish a reliable cost basis.

Recommended behavior:

1. Reuse existing inventory items and mappings first.
2. Read active products and variants from `products` as candidate records.
3. Let the user select which candidates are inventory-managed.
4. Create inventory items and product/variant mappings only for selected candidates.
5. Allow an explicitly selected item to start with quantity `0`; do not create a zero-quantity movement.
6. Allow non-stock products, products without stock, and products without a reliable cost to remain unmapped.
7. Use variant cost history or `default_cost` only as a suggestion; the user confirms the opening unit cost.
8. Reuse existing SKU/mapping rules and prevent duplicate inventory items.

For detailed stock initialization, collect:

- inventory item;
- location;
- quantity;
- unit cost;
- total cost.

The resulting baseline quantity must be visible to inventory and must reconcile to the inventory amount in the opening balance. Its value must not be journalized twice.

The preferred implementation is a dedicated `opening_balance` inventory movement type (or equivalent explicit opening-stock semantics). Each movement is linked to the single opening journal created for the cutover. It must not reuse a `purchase` movement, because that would incorrectly create a new supplier payable.

An aggregate inventory value is allowed when the user only wants a financial opening value. It must warn that per-item quantity and COGS tracking are not ready. Order conversion that requires COGS remains blocked until item, quantity, location, and cost are available.

### 5.4 Chart of Accounts

Use the existing seed as a baseline, not as a fixed user-specific ledger. Do not invent a second unrelated CoA template in onboarding.

Rules:

- system accounts cannot be deleted;
- non-postable group accounts cannot be used as journal lines;
- valid postable child accounts may be added;
- accounts used by automation cannot be deactivated without a replacement mapping;
- account type, subtype, normal balance, and active status must be valid.

Bank accounts are postable child accounts under the cash group. A separate `bank_accounts` collection is out of scope for this version. The account name may contain the bank, last four digits, and owner label; the full account number must not be stored.

Marketplace receivables that need separate opening balances should use postable child accounts, for example:

```text
1200 Piutang                         group
  1211 Piutang Shopee                postable
  1212 Piutang Tokopedia             postable
  1219 Piutang Marketplace Lainnya   postable
```

The current seed is a starting point and may be adjusted accordingly. Examples of useful baseline accounts:

- `1100` Kas dan Setara Kas is a group account; bank accounts are postable children;
- `1130` Saldo Marketplace;
- `1200` Piutang is a group account; marketplace accounts are postable children;
- `1310` Persediaan Barang Dagang;
- `1320` Persediaan Bahan Packing;
- `3110`/`3120` are postable owner-capital subaccounts; `3100` is a group account;
- `4100` Penjualan Barang Dagang;
- `5100` HPP Barang Dagang.

Automation must not depend directly on numeric account codes. Organization accounting settings must store validated account mappings for revenue, receivables by platform, marketplace balance, inventory, COGS, settlement destination, and applicable fee accounts. Inventory items may continue to override inventory and COGS accounts through their existing references.

### 5.5 Multiple bank accounts and marketplace receivables

The flow must support multiple bank accounts. Each bank account that needs a separate balance should be represented by a separate postable child account under the cash/bank group.

The account name may include the bank, the last four account digits, and account owner, for example:

```text
Bank BCA •••• 9910 — a/n Toko ABC
```

The last four digits are only an identifier and must not be treated as a full account number or credential.

Accounting dimensions do not replace separate bank accounts because bank balances need separate account balances. For the first version, the account itself is the bank account representation; a separate bank profile is deferred until bank reconciliation or statement import is implemented.

For marketplace receivables, separate accounts such as `Piutang Shopee` and `Piutang Tokopedia` are safer for opening balances because current opening balance lines do not carry dimensions. Dimensions can still support transaction and platform analysis after onboarding.

`Saldo Marketplace` represents released marketplace funds that are still held by the marketplace or payment intermediary. It is distinct from unreleased buyer funds, which are marketplace receivables.

### 5.6 Opening balance

Opening balance must use postable accounts and total debit must equal total credit.

The opening balance is one canonical journal for the cutover. Inventory opening
values must be included in that journal and must not also be posted as purchase
journals. Detailed inventory initialization may create opening inventory
movements for quantity/value tracking, but those movements must reference the
same opening journal or otherwise be explicitly excluded from creating a second
general-ledger posting.

#### Marketplace pending funds

Pending funds are orders that:

- are not cancelled;
- do not have `released_funds_at`; and
- do not have a value in `released_funds`.

Economically this is a receivable: the buyer has paid the marketplace, but the marketplace has not paid the seller. The amount should go to the relevant marketplace receivable account.

Released-funds data must not be treated as pending automatically. The exact handling of released-but-not-bank-received amounts must follow the settlement policy selected for the organization.

#### Liabilities

Do not limit opening liabilities to suppliers. The flow should support supplier debt, bank loans, finance-company debt, family/private debt, tax payable, and other liabilities through appropriate postable liability accounts.

For the first version, this is an opening-balance workflow, not a payable/loan subledger. User-created child accounts and descriptions can identify the liability. A separate payable/loan subledger should be considered later if creditor, due date, partial payment, and aging are required.

#### Equity

```text
Owner Equity = Total Assets - Total Liabilities
```

Post the calculated amount to a postable owner-capital account, not to a non-postable group account.

If the opening data includes liabilities that are not owner debt, those
liabilities remain separate credit lines and the balancing equity is calculated
after all assets and liabilities are included.

### 5.7 Order recognition and conversion

Existing orders are not mass-posted as an implicit side effect of onboarding finalization. After accounting becomes active, eligible orders can be processed through a dedicated review/queue flow.

Rules:

- order imports must continue even when accounting is not ready;
- after accounting is active, future orders may be posted automatically when their status, product mapping, cost, inventory location, and account mappings are ready;
- an automatic posting failure leaves the order imported and marks it `pending` or `blocked` with a visible reason;
- existing orders on or after the cutover date may be selected for manual or batch conversion;
- orders before the cutover date are excluded from standard recognition and require the separate reconstruction process;
- the conversion must be idempotent and retain references to the order, journal entry, and inventory movements.

Order recognition and settlement remain separate accounting events:

1. completed order: marketplace receivable and revenue, plus inventory sale/COGS when available;
2. released/settled funds: bank or marketplace balance, marketplace fees, and reduction of receivable.

The existing order accounting fields and marketplace settlement collection should be reused before introducing another collection.

### 5.8 Review and finalization

Show the start date, accounts, cash/bank, marketplace receivables, inventory, liabilities, calculated equity, total debit/credit, and unresolved warnings.

The user must confirm that the values represent the actual condition at the start date. Finalization creates the opening balance and journal through the existing accounting mechanism, locks the start date, activates the module, and redirects to the accounting dashboard.

### 5.9 Accounting settings

Only expose settings already supported by the existing services and models. FIFO, manual valuation, custom journal numbering, and automation toggles must not be presented as configurable onboarding features until the system actually supports them.

---

## 6. Reconstruction process

Historical reconstruction is outside the standard onboarding wizard. It is a separate accounting process and must be permission-gated.

Initial policy:

- owner is allowed by default;
- the permission boundary must be easy to change later;
- normal users cannot reconstruct or rewrite posted history;
- reconstruction uses new journal, adjustment, or reversal records;
- each operation records source, actor, timestamp, and idempotency information;
- reconstruction must not duplicate the standard opening journal.

The full reconstruction UX may be specified in a separate PRD.

## 7. Organization accounting state

The preferred design is one server-owned namespaced field on the existing organization document. Avoid separate `module_status` and `onboarding_status` fields that can drift; one lifecycle status is sufficient for the first version.

```ts
accounting: {
  status: 'not_started' | 'in_progress' | 'active',
  onboarding_version: number,
  calendar_timezone?: string,
  cutover_date?: Date,
  account_mappings?: {
    sales_revenue?: string,
    marketplace_balance?: string,
    marketplace_receivables?: Record<string, string>,
    merchandise_inventory?: string,
    merchandise_cogs?: string,
  },
  started_at?: Date,
  completed_at?: Date,
  completed_by?: string,
}
```

Better Auth's organization plugin must expose this field through `schema.organization.additionalFields`, and the Mongoose organization model/schema/DTO must use the same shape. The final field design must still be checked against the current MongoDB adapter and ownership rules. Status, cutover date, completion actor, and account mappings are server-owned.

The organization document should not embed a large product-by-product onboarding draft. Reuse existing `opening_balances`, `inventory_movements`, and `journal_entries` for persisted accounting data. A separate onboarding-session collection is deferred unless resumable drafts and concurrency requirements cannot be represented safely with the existing structures.

## 8. Key business rules

1. Accounting onboarding runs once per organization.
2. One organization has one accounting ledger in this design.
3. Store and platform remain transaction dimensions.
4. Accounting is optional and starts from the dashboard.
5. Opening balance is recorded only once by standard onboarding.
6. Inventory is valued at cost, never selling price.
7. Owner equity is derived as assets minus liabilities.
8. Standard onboarding does not create historical journals before the start date.
9. Existing order, product, and inventory data are not deleted by onboarding.
10. Product-to-inventory conversion is explicit or user-confirmed; it is not a mass automatic side effect.
11. Inventory baseline value must not be journalized twice.
12. Start date is locked after finalization.
13. Posted journals are corrected through adjustment/reversal, not silent editing.
14. Server-side checks enforce module status, organization scope, permission, and finalization state.
15. Finalization is idempotent and safe against concurrent requests.
16. Timezone is inherited from the primary store/accounting calendar and is not duplicated as an uncontrolled onboarding input.
17. Bank accounts are postable CoA child accounts; a separate bank collection is not required for the first version.
18. Existing orders are not automatically reconstructed or mass-posted by onboarding finalization.
19. Eligible future orders may be posted automatically only after accounting is active and all prerequisites are satisfied.

## 9. Success criteria

- User can enter the dashboard without accounting onboarding.
- User can activate accounting from the accounting module.
- An organization with multiple stores still has one accounting ledger.
- User can create separate bank and marketplace receivable CoA accounts where separate balances are required.
- Pending marketplace funds are treated as receivables when they are not cancelled and do not have `released_funds_at` or `released_funds`.
- User can choose which products/variants become inventory-managed.
- Zero-stock inventory items are not created in bulk without explicit selection.
- Detailed stock initialization reconciles quantity/cost with opening inventory value.
- Opening journal is balanced and created only once.
- Opening inventory quantity/value is linked to inventory tracking without creating a second GL posting.
- Order conversion respects the cutover date and keeps unresolved orders visible in a pending/blocked queue.
- Standard onboarding does not reconstruct historical transactions.
- Reconstruction is unavailable to users without the required permission.
- Completed onboarding cannot be reopened through the normal UI or mutation endpoints.

## 10. Out of scope

- Redesigning organization/store onboarding.
- Full historical reconstruction UI and import workflow.
- Payable or loan subledger with creditor, due date, payment, and aging.
- Full Shopee API real-time integration.
- Tax reporting, multi-currency, and advanced accounting features.
- FIFO or manual inventory valuation unless implemented by the accounting system.
- Bank statement import and bank reconciliation profile/collection.
- Redesigning product, order, inventory, or accounting pages outside the onboarding page/module; those changes belong in the backend implementation plan and subsequent UI work.
- Mobile-specific redesign.

## 11. Open decisions

1. Final field shape and write path for `organization.accounting` across Better Auth and the application-owned Mongoose model.
2. Exact account-mapping structure and migration away from hardcoded account codes in accounting services.
3. Settlement policy for released funds that are not yet visible in the destination bank account.
4. Exact implementation of `opening_balance` inventory movements, shared opening-journal references, and idempotency.
5. Whether detailed stock initialization is required by default when existing inventory movements already provide a reliable balance.
6. Automatic-posting trigger and batch-queue UX for orders imported after accounting activation.
7. Initial owner-only reconstruction permission and how it can be expanded later through a real permission model.

## 12. Implementation notes

This document is now the refined product direction. The current UI prototype may be iterated independently, but backend implementation starts only after the open decisions above are converted into an implementation plan and this PRD is marked final.

Implementation must reuse existing accounting, inventory, order, validation, audit, and idempotency mechanisms where possible. If an existing mechanism cannot represent a requirement safely, document the gap before adding a collection or changing a schema.

**End of PRD**
