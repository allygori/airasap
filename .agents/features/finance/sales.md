# Finance Sales

> This guide covers Finance's sales posting workflows and their current source seams. Orders remains the owner of imported marketplace Order facts.

## Marketplace Orders

- **[CURRENT]** Orders imports Order data and calls `OrderFinanceIntegrationService`; Finance projects the Order into a sales workflow and records the accounting/Inventory consequences through Finance services.
- **[CURRENT]** A marketplace Order is eligible for sales posting only when its imported status is `selesai`, its projection and amount/date are valid, and it has no returned quantity. Returns/refunds are currently blocked because Finance return correction rules are not implemented.
- **[CURRENT]** For Shopee, the sales adapter uses `completed_at` as the transaction date and marks the projection incomplete when it is absent; it does not fall back to `placed_at`. The current Shopee importer maps `shipping_arranged_at` from `shippingTimeArranged`; this is the time the label is prepared and ready to print, not a verified courier handoff time.
- **[CURRENT]** `selesai` remains the Shopee sales-posting trigger, and a missing `completed_at` leaves the Finance posting blocked for review. `placed_at` remains the Order date for per-Order analysis. This Shopee-specific rule is recorded in [ADR-0004](../../ADR/0004-shopee-marketplace-settlement-and-withdrawal.md); other marketplace date mappings have not been reviewed and retain their existing behavior.
- **[CURRENT]** Marketplace sales journals debit marketplace receivable and credit sales revenue. Inventory COGS/movement processing is coordinated with the Finance Inventory COGS service during posting; its readiness and outcome are stored with the sales transaction.
- **[CURRENT]** The Order import path uses automatic posting for completed Orders. Other imported statuses can synchronize the Inventory reservation lifecycle without creating a sales journal.
- **[CURRENT]** Sales workflow results distinguish disabled, not eligible, blocked, pending, and posted/reversed outcomes. Manual mode can save a pending posting intent; automatic mode attempts posting. The Finance sales API exposes list, post, and retry operations.
- **[CURRENT]** The Finance Sales list keeps the existing retry action for blocked transactions and offers a separate HPP retry for posted transactions whose inventory COGS is deferred. A successful retry posts a COGS-only journal in the retry period, finalizes the inventory movement, and stores the retry journal reference. The saved retry plan and journal/movement idempotency keys make interrupted or repeated requests resumable without reposting the sales journal. Reversing the sale also reverses its retry HPP journal; the retry journal cannot be reversed independently.

### Shopee order-to-ledger sequence

The target sale, settlement, and manual-withdrawal entries are separate journal events:

| Event | Debit | Credit | Journal date |
| --- | --- | --- | --- |
| **[CURRENT]** Shopee sales recognition when the imported Order is `selesai` | 1210 Piutang Marketplace | Sales revenue | `completed_at`; missing date blocks review rather than falling back to `placed_at` |
| **[CURRENT]** HPP when Finance Inventory posts the sale movement | Cost of goods sold | Inventory | Coordinated with sale posting; a deferred HPP retry currently posts in the retry period |
| **[TARGET]** Shopee reports released funds and fee amounts | 1220 Saldo Marketplace for net released funds; 6310 Beban Admin Marketplace for Shopee fees | 1210 Piutang Marketplace for the gross receivable cleared | `released_funds_at` |
| **[TARGET]** Seller manually withdraws from Shopee balance | Selected Bank/E-wallet account | 1220 Saldo Marketplace | Actual withdrawal date recorded by the seller |

`placed_at` remains available for Order-date and per-Order cohort analysis. Shopee fee component detail is retained for analysis even though its journal expense is grouped in Beban Admin Marketplace. The stock reservation and physical stock-out milestone remain subject to [Q-011](../../docs/open-questions.md#q-011--imported-order-shortage-cancellation-and-return-reconciliation).

The current direct Orders-to-Finance composition and the missing durable recovery/reconciliation contract are documented in [Q-007](../../docs/open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract). Keep Order persistence usable when Finance is unavailable; an integration failure currently can be reported after the Order has already been saved.

## Offline sales

- **[CURRENT]** Offline sales are created through a Finance-specific workflow, not through the Orders Shopee importer.
- **[CURRENT]** An offline sale requires Finance to be active, one active Inventory location, a mapped Product/variant with quantity and value tracking, sufficient sellable stock, and an eligible Cash, Bank, or E-wallet payment account.
- **[CURRENT]** The workflow uses the selected payment account and sales revenue account for the sales journal, while Inventory COGS/movements are coordinated through the Finance Inventory service.
- **[CURRENT]** Product options are read from Products and Finance mappings; the Product's own quantity is not used as stock-on-hand.

## Marketplace released funds

- **[CURRENT]** The released-funds import passes source Order, Store, platform, release amount/date, marketplace fees, and source File context into Finance.
- **[CURRENT]** Finance checks that a corresponding sales transaction is posted and compares released amount plus eligible fee lines with the expected marketplace receivable. Missing data or a non-zero difference leaves the release blocked for review.
- **[CURRENT]** For Shopee, the net released amount is debited directly to the default payout bookkeeping account selected in Finance Settings (bank or e-wallet); eligible fees are debited separately and marketplace receivable is credited. This setting is an Airasap accounting mapping and does not change the seller's payout configuration in Shopee. Other platforms retain the marketplace-balance account path unless their mapping is implemented separately.
- **[TARGET]** Treat a Shopee released-funds amount as money available in the seller's Shopee marketplace balance. Debit 1220 Saldo Marketplace for the net released amount, debit the existing 6310 Beban Admin Marketplace account for Shopee's fee total, and credit 1210 Piutang Marketplace for the gross amount cleared. Use the release date. The later seller-initiated withdrawal is a separate Cash Management transfer. See [ADR-0004](../../ADR/0004-shopee-marketplace-settlement-and-withdrawal.md).
- **[TARGET]** Preserve actual per-Order fee components (including platform/admin, fixed processing, GOX, and other program fees) for analysis while posting Shopee fee expense to Beban Admin Marketplace. Do not encode seller/program rate assumptions as the source of the journal amount. If source fee data changes after posting, use an auditable correction workflow; its exact behavior remains [Q-017](../../docs/open-questions.md#q-017--marketplace-release-fee-updates-and-correction-workflow).
- **[CURRENT]** Refunds/returns and certain tax or shipping-refund fee cases remain unsupported and are blocked rather than treated as reconciled.

This is file-import reconciliation, not a live marketplace settlement integration. Its evidence and freshness depend on the source export.

The target rules in [ADR-0004](../../ADR/0004-shopee-marketplace-settlement-and-withdrawal.md) are scoped to Shopee. Do not assume another marketplace uses these status labels, fee components, or release semantics without reviewing its source data.

## Source entry points

- [Order-to-Finance adapter](../../../modules/orders/services/order-finance-integration.service.ts) and [Orders import guide](../orders/README.md)
- [Sales workflow](../../../modules/finance/sales/finance-sales-workflow.service.ts), [posting rules](../../../modules/finance/sales/finance-sales-rules.service.ts), and [offline sale service](../../../modules/finance/sales/finance-offline-sale.service.ts)
- [Marketplace release service](../../../modules/finance/marketplace-releases/finance-marketplace-release.service.ts)
- [Sales API routes](../../../app/api/v1/dashboard/finance/sales/) and [Q-007](../../docs/open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract)
