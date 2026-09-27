# ADR 0021 — Finance-Owned Chart of Accounts

Status: [CURRENT]

## Context

Finance previously queried the legacy `accounting_accounts` collection using a
Finance-specific model and repository. That kept the Finance code surface
separate, but the data lifecycle still depended on the old Accounting module's
collection and default-account seed. The old Accounting module is planned for
removal, and this project is still in development with no production data to
preserve.

## Decision

1. Finance owns the `finance_accounts` collection, Mongoose model, repository,
   service, API contract, and default Chart of Accounts template.
2. The default template is maintained under
   `modules/finance/accounts/finance-account.seed.json`. Its account taxonomy
   is adapted as reference material for marketplace sellers and UMKM; the
   Finance runtime must not import any file from `modules/accounting`.
3. When an organization owner starts Finance onboarding, Finance ensures the
   default account tree exists for that organization. Seeding is tenant-scoped,
   idempotent, and does not overwrite existing Finance account details.
4. Finance journals, opening balances, purchases, sales, expenses, and
   transfers reference Finance account IDs only.
5. This is a development fresh start. Do not migrate legacy CoA records,
   journals, or opening balances. Legacy collections may be ignored and later
   removed with the old Accounting module.

## Consequences

- Finance can continue operating after the legacy Accounting module and its
  collection are removed.
- New Finance organizations receive the expected account roles and hierarchy
  before entering opening balances or posting transactions.
- This change provides the Finance-owned default chart and read surface; an
  account create/edit UI is not part of this decision.
- Existing development data in `accounting_accounts` is intentionally not
  visible to Finance after this separation; a clean Finance setup uses
  `finance_accounts`.
- Finance-owned account changes must preserve account-role compatibility used
  by automatic posting and opening-balance validation.

## Scope boundary

This decision does not alter Orders, Products, Reports, their importers, or the
optional Finance activation model. It does not add a generic feature-flag
system, tax configuration, bank-statement import, or account migration tool.
