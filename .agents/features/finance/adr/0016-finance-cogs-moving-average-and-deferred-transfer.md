# ADR 0016 — Finance COGS Moving Average and Deferred Transfers

Status: [CURRENT]

## Context

Finance needs to connect completed sales posting with inventory value and cost
of sales without changing the existing Orders, Products, or Reports modules.
The first release is aimed at marketplace sellers and UMKM users, where a
single active stock location is the common case. A transfer workflow would
introduce multi-location rules before they are needed.

Sales data may also be incomplete: a Finance product mapping, a valued stock
balance, or a usable inventory account may not exist yet. Posting an invented
cost would make the ledger look complete while making it unreliable.

## Decision

1. Phase 5.3 warehouse transfers is deferred. The initial COGS workflow only
   posts HPP when exactly one active Finance inventory location exists. With no
   active location or multiple active locations, HPP is deferred with a
   visible reason.
2. The initial costing method is moving average, calculated from posted
   inbound/outbound quantity and value. The calculation is applied in source
   line order and carries the temporary balance across lines in one sale.
3. When COGS prerequisites are ready, the sales journal includes Dr HPP / Cr
   inventory and a posted `sale` movement is created with an idempotency key
   tied to the source order and source line.
4. When prerequisites are not ready, the revenue/receivable sales journal may
   still post, but Finance records `inventory_cogs_status: deferred` and the
   reason. Finance never estimates or silently guesses HPP.
5. Posted inventory movements and posted journals remain immutable. Reversing
   a sales journal creates a new reversal journal and a new inbound `return`
   movement for each linked sale movement. On standalone MongoDB, both steps
   use stable idempotency keys and can be resumed if a write is interrupted.

## Consequences

- Initial sellers get a usable sales flow without being forced to configure
  warehouse transfers first.
- HPP is traceable to a source journal and source movement when posted.
- Multi-location organizations must resolve their location/transfer setup
  before Finance can calculate HPP for a sale.
- FIFO, batch/lot, and serial costing remain future decisions based on actual
  product needs; this ADR does not claim they are implemented.

## Scope boundary

This decision applies only to the new Finance module. It does not modify or
replace existing Orders, Products, Reports, or their importers.
