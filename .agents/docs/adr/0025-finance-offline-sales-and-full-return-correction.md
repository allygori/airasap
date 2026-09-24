# ADR 0025 — Finance Offline Sales and Full-Return Correction

Status: [CURRENT]

## Context

Finance is an optional organization feature for marketplace sellers and small
businesses. Some sales happen directly, through WhatsApp, or offline and do not
come through the marketplace Orders importer. These sales still need to reduce
the same organization-level Finance inventory and create a traceable journal.
Posted journals are immutable, and inventory value must not be guessed.

## Decision

1. Record a direct sale using a Finance-owned offline-sales form rather than a
   generic stock adjustment. The form accepts a date, optional receipt
   reference, mapped product/variant lines, quantity, unit selling price, and
   the Cash/Bank/E-wallet account that received payment.
2. Reuse the Finance sales workflow. The journal debits the selected payment
   asset account and credits sales revenue; Finance inventory costing adds HPP
   and stock reduction when eligible. The selected payment account must be an
   active, postable asset account with the allowed Finance subtype.
3. Require an active Finance module, one active inventory location, an active
   product-to-item mapping, sufficient unreserved stock, and resolvable
   inventory value/HPP. If these prerequisites are not met, do not post a
   revenue-only offline sale.
4. Tax is not separately calculated or posted by this form while the Finance
   tax phase is deferred. The entered unit price is recorded as the sale amount
   for this initial workflow.
5. The initial return action is a full-sale reversal only. It creates a new
   reversal journal and return movements for all posted HPP movements; it never
   edits the posted journal or original stock movements.
6. The full-return action is valid only when the entire sale is being reversed
   and all goods are returned in resalable condition. Partial returns,
   damaged/non-restockable goods, and refunds without physical goods returned
   are not represented by this action.

## Consequences

- Direct sales share the same inventory pool, moving-average HPP process, and
  audit trail as eligible imported sales.
- A failed or incomplete HPP prerequisite blocks the offline sale so revenue
  cannot be posted while the associated stock remains unchanged.
- A seller has a single explicit correction action for the uncomplicated
  full-return case. More granular return/refund accounting remains future work.
- Marketplace importers other than Shopee remain deferred until their source
  identity and status semantics are individually reviewed; see ADR 0024.

## Not in scope

- tax calculation, tax-inclusive price allocation, or tax reporting;
- partial refunds or partial quantity returns;
- returned goods that are damaged, discarded, or not restocked;
- refunds that do not include a physical return;
- customer, payment-provider, or marketplace payout integrations.
