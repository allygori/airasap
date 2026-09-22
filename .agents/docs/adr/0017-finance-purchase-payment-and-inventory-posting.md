# ADR 0017 — Finance Purchase Payment and Inventory Posting

Status: [CURRENT]

## Context

Finance needs a simple purchase workflow for marketplace sellers and UMKM
users. A purchase can increase inventory without necessarily being paid at
the same time. Treating every purchase as a cash outflow would understate
payables and make the ledger misleading.

The legacy accounting and inventory modules contain useful posting patterns,
but they are not the source of truth for the new Finance workflow. Orders,
Products, Reports, and their importers must remain unchanged.

## Decision

1. The new Finance purchase is an explicit source transaction in
   `finance_purchases`. It starts as `draft` and is posted only by an
   explicit action.
2. Phase 7.1 supports inventory purchases only. Each line references an active
   Finance inventory item and location, stores item/location snapshots, and
   requires quantity and value tracking.
3. Posting creates one balanced journal and one posted `purchase` inventory
   movement per line in the same database transaction:
   - debit the configured inventory account for each line;
   - credit the selected payment account when `payment_timing` is `paid`;
   - credit Accounts Payable when `payment_timing` is `payable`.
4. Paid purchases may use only active postable Cash, Bank, E-wallet, or
   Marketplace Balance accounts. Payable purchases resolve the active
   `accounts_payable` account, using code `2100` only as a compatibility
   fallback while the account taxonomy is shared.
5. Supplier name and invoice/reference are transactional snapshots. A
   supplier master, tax calculation, partial settlement, and goods-receipt
   workflow are deferred until their dedicated phases are designed.
6. Idempotency is required at the source transaction and derived journal/
   movement boundaries. Posted journals and movements remain immutable.

## Consequences

- Users can record stock received now and distinguish it from supplier payment.
- The stock view and journal remain traceable to the same Finance purchase.
- A missing inventory mapping, location, or valid account blocks posting rather
  than producing an incomplete journal.
- Phase 7.2 can reuse the payment/payable distinction for direct expenses
  without treating inventory purchases as expenses.

## Scope boundary

This decision applies only to the new Finance module. It does not modify or
replace existing Orders, Products, Reports, legacy Expense code, or their
importers.

