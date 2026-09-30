# Finance Cash Management

> This guide groups current workflows that manage cash/bank balances or owner financing. They remain separate Finance capabilities with different business meanings.

## Cash and bank accounts

- **[CURRENT]** Finance accounts provide the Chart of Accounts and role mapping; cash/bank read services expose selectable accounts and balance-oriented views from Finance records.
- **[CURRENT]** Bank-account onboarding creates child bank accounts under the seeded Bank account role while Finance setup is in progress. See [Setup and Onboarding](setup-and-onboarding.md).
- **[CURRENT]** A cash/bank transfer moves value between eligible Finance accounts through a transfer workflow and journal posting. Posted transfers can be reversed through a separate reversal path.

## Cash loans and owner withdrawals

- **[CURRENT]** Cash loans are recorded through draft, post, and reversal operations. Posting creates the associated Finance journal; reversal uses a reversal journal rather than silently erasing the original posting.
- **[CURRENT]** Owner withdrawals follow a separate draft, post, and reversal lifecycle and create their own journal postings. Do not conflate an owner withdrawal with a business expense.
- **[CURRENT]** These workflows use Organization-scoped Finance records and idempotency keys. They do not define a future role/permission model for who may perform each action.

## Boundaries

- Cash-management APIs should compose Finance services and journal operations; routes should not write ledger records directly.
- Balance read models depend on posted journal and operational state. A draft or pending workflow is not equivalent to a posted balance change.
- **[OPEN]** Authorization scopes for Finance actions and future configurable Organization/Store roles remain open in [Q-002](../../docs/open-questions.md#q-002--organization-and-store-rolepermission-scope).

## Source entry points

- [Cash and bank read service](../../../modules/finance/cash-and-bank/finance-cash-bank-read.service.ts), [transfer service](../../../modules/finance/cash-and-bank/finance-cash-bank-transfer.service.ts), and [transfer read service](../../../modules/finance/cash-and-bank/finance-cash-bank-transfer-read.service.ts)
- [Cash loan service](../../../modules/finance/cash-loans/finance-cash-loan.service.ts) and [owner withdrawal service](../../../modules/finance/owner-withdrawals/finance-owner-withdrawal.service.ts)
- [Cash management API routes](../../../app/api/v1/dashboard/finance/cash-and-bank/), [transfers](../../../app/api/v1/dashboard/finance/cash-and-bank-transfers/), [loans](../../../app/api/v1/dashboard/finance/cash-loans/), and [owner withdrawals](../../../app/api/v1/dashboard/finance/owner-withdrawals/)
- [Finance Accounting](accounting.md) and [Identity and Access Control](../../docs/architecture/identity-and-access-control.md)
