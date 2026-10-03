# Finance Purchases and Expenses

> This guide documents current purchase and expense posting workflows. It does not imply a broader procurement lifecycle.

## Purchases

- **[CURRENT]** Finance Purchases supports draft and posting workflows scoped to the Organization.
- **[CURRENT]** Posting creates an accounting journal and finalizes Inventory movements for purchase lines. Inventory lines require quantity and value tracking and use an active Finance inventory item/location.
- **[CURRENT]** A purchase can represent payment or an amount payable according to its selected account configuration. Posting links the source purchase with the resulting journal and stock movement records and uses idempotency keys for retries.
- **[CURRENT]** New purchases may reference an active Organization-owned Finance Supplier. Each Purchase keeps the Supplier reference, `supplier_name_snapshot` captured when it was created, and the transaction-specific `supplier_document_reference`.
- **[CURRENT]** This development-stage field naming change includes no migration or backfill; the database may be reset before broader use.

## Expenses and outflows

- **[CURRENT]** Finance Expenses supports draft creation followed by posting to an operational journal.
- **[CURRENT]** The expense workflow uses a configured expense account and a payment/offset account, which can represent supported cash/bank/e-wallet/marketplace-balance or payable cases according to the service validation.
- **[CURRENT]** Posting preserves the source expense and journal relationship and uses idempotency to handle repeated requests.

## Boundaries

- **[CURRENT]** These workflows require Finance lifecycle readiness and use Finance Accounting for journal effects.
- **[CURRENT]** Purchase stock receipts are Finance Inventory movements. Do not directly edit stock balances as a side effect of Product or Store UI changes.
- **[OPEN]** Purchase receiving stages, purchase returns, and Store versus warehouse scope are not defined by these services. Supplier directory scope and the initial Purchase link are documented in [Suppliers](suppliers.md); broader sourcing and procurement workflows remain open in [Q-014](../../docs/open-questions.md#q-014--supplier-ownership-and-purchasing-relationship) and [Q-012](../../docs/open-questions.md#q-012--multi-warehouse-operating-model).

## Source entry points

- [Purchase service](../../../modules/finance/purchases/finance-purchase.service.ts) and [purchase read service](../../../modules/finance/purchases/finance-purchase-read.service.ts)
- [Expense service](../../../modules/finance/expenses/finance-expense.service.ts) and [expense read service](../../../modules/finance/expenses/finance-expense-read.service.ts)
- [Purchase API routes](../../../app/api/v1/dashboard/finance/purchases/) and [expense/outflow API routes](../../../app/api/v1/dashboard/finance/expenses-and-outflows/)
- [Finance Inventory](inventory.md), [Finance Accounting](accounting.md), and [Open Questions](../../docs/open-questions.md)
