# ADR 0024 — Finance Shopee Stock Reservation Lifecycle

Status: [CURRENT]

## Context

Finance uses one organization-level stock pool. Orders can arrive before they
are completed, so quantity on hand alone is not a safe indication of stock that
can still be sold. The current Orders import implementation supports Shopee
workbooks. Those files provide product and variation names plus parent and
child SKU fields, but do not provide a stable marketplace product or variation
ID. The importer resolves an internal Product reference; Finance then requires
an explicit Product/variation-to-inventory mapping before reserving stock.

MongoDB currently runs standalone. The lifecycle must therefore be retry-safe
without relying on multi-document transactions, and Finance failure must not
roll back the basic Orders import.

## Decision

1. Finance stores reservations in the Finance-owned
   `finance_inventory_reservations` collection. One tenant-scoped record exists
   per `(platform, store, source order, source line)` identity.
2. For the current Shopee importer, `perlu-dikirim`, `sedang-dikirim`, and
   `telah-dikirim` reserve stock. `batal` releases an unconsumed reservation.
3. `selesai` consumes a reservation only after its idempotent posted sales/HPP
   movement exists. If HPP is deferred, an active reservation remains active so
   sellable stock does not increase incorrectly.
4. `pengembalian` and `pengembalian-dana` require explicit user review. The
   current correction action can reverse a whole sale only when all goods are
   returned in resalable condition; it is not triggered automatically by an
   imported status. A cancellation after consumption also requires review.
5. Sellable quantity is `max(quantity on hand - active reservations, 0)`.
   A shortage is persisted and shown as an inventory review condition. It never
   creates negative stock.
6. A terminal released or consumed reservation is not reactivated by an older
   import status. Re-imports update the same reservation records and movement
   idempotency remains owned by the existing HPP workflow.
7. When Finance is inactive, the integration writes no reservation, movement,
   or journal. Orders import remains successful when Finance synchronization is
   disabled, blocked, or fails.

## Consequences

- Quantity on hand, reserved quantity, and sellable quantity have distinct
  meanings in the Finance stock screen.
- Multiple marketplace listings can reserve the same Finance item when their
  explicit mappings point to that item.
- Shopee workbook imports can update the stored source status of an existing
  order without replacing its other fields, enabling cancellation to release a
  previous reservation.
- Other marketplaces need their own reviewed status mapping before they can
  create reservations.
- Offline sales use a Finance form and the same shared stock/HPP workflow.
  The current full-sale correction reverses all sale lines and restores all
  associated HPP movements only for goods returned in resalable condition.
- Other marketplace importers must not inherit Shopee lifecycle rules. Their
  source identifiers, product/variant matching, and status meanings require
  review before integration.

## Follow-up: other order importers

Tokopedia, TikTok Shop, Lazada, and Blibli import lifecycles remain deferred.
Before enabling Finance reservations or sales posting for each marketplace,
review its stable order/line identifiers, product/variant references, and the
separate meaning of cancellation, fulfillment, completion, return, and refund
statuses. Do not infer those rules from Shopee or from file-import support
alone.
