# Finance Accounting

> This guide describes the Finance accounting services currently present in the repository. The accounting records, operational read models, and external reconciliation are distinct capabilities.

## Current accounting capabilities

- **[CURRENT] Chart of Accounts:** Finance seeds default accounts and resolves configured account roles for operational postings. Organization owners can add bank accounts during onboarding; account CRUD is not a blanket permission to change every seeded account.
- **[CURRENT] Journals:** Operational workflows submit journal intents to `FinanceJournalService`. Posted entries are balanced debit/credit records with source, date, account, and optional dimensions such as Store and platform. Journal posting supports idempotency and accepts a MongoDB session for composed operations.
- **[CURRENT] Reversals:** The journal service supports reversal entries for posted journals. A correction should preserve the original posted record and use the supported reversal lifecycle instead of silently editing accounting history.
- **[CURRENT] Periods:** Finance calculates monthly periods using the Organization Finance calendar timezone. A missing period record is treated as open; closing a period persists an explicit closed record.
- **[CURRENT] Ledger:** The versioned Finance API exposes journal-entry listing/detail, reversal, Chart of Accounts, ledger reads, and period close workflows.
- **[CURRENT] Receivables and payables:** Subledger balances are surfaced from posted journals and settlement activity; settling an item creates a settlement record and corresponding journal. These are Finance subledgers. Suppliers also have a separate directory; Customer master data is not implemented.
- **[CURRENT] Financial statements:** `FinanceFinancialStatementsReadService` implements trial balance, profit and loss, balance sheet, and cash-flow read models from Finance accounting data. No versioned dashboard API route for this service was found in the current route tree; do not assume it is exposed through that API.

## Accounting invariants for contributors

- Use the Finance journal service for operational posting. Do not create journal rows directly from route handlers or another module.
- Preserve tenant context, posting-period checks, idempotency keys, and supplied `ClientSession` when composing a write workflow.
- Treat a posted journal as historical accounting evidence. Use a reversal/correction workflow where implemented; do not change a posted result as an ordinary update.
- Keep Order-based operational analytics separate from Finance statements. A sales report over imported Orders does not prove that a journal was posted or reconciled.
- When adding a report or endpoint, name its source and readiness requirements explicitly. The financial-statements service's existence alone does not make it part of the public API.

## Boundaries and open questions

- **[CURRENT]** Monthly calendar behavior uses Finance's Organization timezone, which defaults to `Asia/Jakarta`.
- **[OPEN]** Organization and Store user permissions are not a complete future RBAC/permission policy. See [Q-002 — Organization and Store role/permission scope](../../docs/open-questions.md#q-002--organization-and-store-rolepermission-scope).
- **[OPEN]** Supplier links to Stores, products, and future procurement/receiving workflows remain undecided; see [Q-014](../../docs/open-questions.md#q-014--supplier-ownership-and-purchasing-relationship). Customer ownership and data lifecycle remain open in [Q-015](../../docs/open-questions.md#q-015--customer-ownership-and-data-lifecycle).

## Source entry points

- [Account service](../../../modules/finance/accounts/finance-account.service.ts) and [account role resolver](../../../modules/finance/accounts/finance-account-role-resolver.service.ts)
- [Journal service](../../../modules/finance/journal/finance-journal.service.ts) and [journal read service](../../../modules/finance/journal/finance-journal-read.service.ts)
- [Period service](../../../modules/finance/periods/finance-period.service.ts), [subledger service](../../../modules/finance/subledgers/finance-subledger.service.ts), and [financial statements read service](../../../modules/finance/reports/finance-financial-statements-read.service.ts)
- [Accounting API routes](../../../app/api/v1/dashboard/finance/accounting/) and [receivable/payable API routes](../../../app/api/v1/dashboard/finance/receivables-and-payables/)
