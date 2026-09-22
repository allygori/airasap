# ADR 0005 — Cash and Bank Uses COA Accounts and Posted Journals

Status: Accepted

## Context

The first Finance release should help sellers manage basic cash and bank
balances without implementing bank statement import or bank-feed
reconciliation.

## Decision

Cash and Bank is a view over eligible Chart of Accounts accounts. Balances are
derived from posted journal lines.

A transfer is a new source transaction that produces a balanced journal:

- debit destination account;
- credit source account.

Posted journals are never edited directly. Bank mutation import and full bank
reconciliation are deferred.

## Consequences

- No second cash ledger is required for the first release.
- COA account subtype and metadata must be sufficient for the initial view.
- Transfer transactions need idempotency and reversal behavior.
- The Rekonsiliasi Bank menu must not imply bank-feed functionality before that
  scope is implemented.

