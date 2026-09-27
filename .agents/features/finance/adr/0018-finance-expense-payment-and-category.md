# ADR 0018 — Finance Expense Category and Payment Posting

Status: [CURRENT]

## Context

Finance needs a direct expense workflow for seller and UMKM operating costs.
The workflow must be understandable for non-accounting users while preserving
the distinction between a cost already paid and a cost that creates a payable.
The legacy Expense module is being retired later and must not be the source of
truth for the new Finance workflow.

## Decision

1. Store new direct expenses in the Finance-owned `finance_expenses`
   collection. The transaction begins as `draft` and only a posting action
   creates accounting effects.
2. Let the user choose a postable active Chart of Accounts entry whose type is
   `expense` or `other_expense`. Do not create a separate expense-category
   master for this phase.
3. When `payment_timing` is `paid`, require an active postable asset account
   with subtype `cash`, `bank`, `e_wallet`, or `marketplace_balance`.
4. When `payment_timing` is `payable`, do not accept a payment account. Credit
   the active Accounts Payable account, resolving subtype `accounts_payable`
   and using code `2100` only as a compatibility fallback.
5. Posting creates one balanced immutable journal: debit the selected expense
   category and credit the payment or payable account. Corrections must use a
   later reversal or correction transaction, not edits to the posted journal.
6. Keep vendor, reference, notes, and attachment reference as bounded fields
   on the source transaction. The attachment reference is not a file upload.

## Consequences

- The form uses familiar labels such as “Sudah dibayar” and “Jadi Utang
  Usaha”, while the journal remains explicit and auditable.
- The same Chart of Accounts is reused by purchases, expenses, and later
  receivable/payable workflows.
- A missing or invalid account prevents posting instead of creating an
  incomplete journal.
- Taxes, recurring expenses, partial settlement, approvals, and attachments
  upload remain separate future decisions.

## Scope boundary

This decision applies only to the new Finance module. It does not change
Orders, Products, Reports, their importers, or the legacy Expense runtime.
