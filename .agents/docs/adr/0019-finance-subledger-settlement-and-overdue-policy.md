# ADR 0019 — Finance Subledger Settlement and Overdue Policy

Status: [CURRENT]

## Context

Finance needs a simple way for sellers and UMKM users to see unpaid sales and
unpaid purchases or expenses, then record the cash movement when funds are
received or paid. The source journal must remain immutable, and partial
settlement must not be confused with a full settlement.

The current Finance purchase, expense, and sales source transactions do not
share a due-date field. Inferring overdue from a transaction date would create
misleading accounting information because a transaction date is not
necessarily its contractual due date.

## Decision

1. Derive open receivable balances from posted `order` journals using the
   Marketplace Receivable account. Derive open payable balances from posted
   `purchase` and `expense` journals using the Accounts Payable account.
2. Store each settlement in `finance_settlements`, linked to the source
   journal entry. Settlement amount must be positive and cannot exceed the
   current outstanding amount.
3. Allow both partial and full settlement. A partial settlement remains open
   with a reduced outstanding amount; a fully settled source is omitted from
   the open-balance list.
4. Post a new balanced journal for each settlement:
   - receivable: debit selected Cash/Bank and credit Marketplace Receivable;
   - payable: debit Accounts Payable and credit selected Cash/Bank.
5. Do not edit or reverse the source journal as part of ordinary settlement.
   Idempotency protects both the settlement source record and its journal.
6. Mark overdue status as `not_configured` until a due-date policy and source
   fields are designed. Do not treat transaction date as due date.

## Consequences

- Users get a direct “Catat penerimaan” or “Catat pembayaran” action without
  needing to understand journal lines.
- The ledger remains auditable: the source recognition journal and settlement
  journal are separate and linked.
- Settlement totals are calculated from posted settlement records, so the
  displayed outstanding amount agrees with the journal workflow.
- Due-date reminders and automatic overdue classification are intentionally
  deferred rather than guessed.

## Scope boundary

This decision applies only to the new Finance module. It does not modify
Orders, Products, Reports, their importers, or the legacy accounting
settlement runtime.
