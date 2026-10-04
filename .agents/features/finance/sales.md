# Finance Sales

> This guide covers Finance's sales posting workflows and their current source seams. Orders remains the owner of imported marketplace Order facts.

## Marketplace Orders

- **[CURRENT]** Orders imports Order data and calls `OrderFinanceIntegrationService`; Finance projects the Order into a sales workflow and records the accounting/Inventory consequences through Finance services.
- **[CURRENT]** A marketplace Order is eligible for sales posting only when its imported status is `selesai`, its projection and amount/date are valid, and it has no returned quantity. Returns/refunds are currently blocked because Finance return correction rules are not implemented.
- **[CURRENT]** Marketplace sales journals debit marketplace receivable and credit sales revenue. Inventory COGS/movement processing is coordinated with the Finance Inventory COGS service during posting; its readiness and outcome are stored with the sales transaction.
- **[CURRENT]** The Order import path uses automatic posting for completed Orders. Other imported statuses can synchronize the Inventory reservation lifecycle without creating a sales journal.
- **[CURRENT]** Sales workflow results distinguish disabled, not eligible, blocked, pending, and posted/reversed outcomes. Manual mode can save a pending posting intent; automatic mode attempts posting. The Finance sales API exposes list, post, and retry operations.
- **[CURRENT]** The Finance Sales list keeps the existing retry action for blocked transactions and offers a separate HPP retry for posted transactions whose inventory COGS is deferred. A successful retry posts a COGS-only journal in the retry period, finalizes the inventory movement, and stores the retry journal reference. The saved retry plan and journal/movement idempotency keys make interrupted or repeated requests resumable without reposting the sales journal. Reversing the sale also reverses its retry HPP journal; the retry journal cannot be reversed independently.

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
- **[CURRENT]** Refunds/returns and certain tax or shipping-refund fee cases remain unsupported and are blocked rather than treated as reconciled.

This is file-import reconciliation, not a live marketplace settlement integration. Its evidence and freshness depend on the source export.

## Source entry points

- [Order-to-Finance adapter](../../../modules/orders/services/order-finance-integration.service.ts) and [Orders import guide](../orders/README.md)
- [Sales workflow](../../../modules/finance/sales/finance-sales-workflow.service.ts), [posting rules](../../../modules/finance/sales/finance-sales-rules.service.ts), and [offline sale service](../../../modules/finance/sales/finance-offline-sale.service.ts)
- [Marketplace release service](../../../modules/finance/marketplace-releases/finance-marketplace-release.service.ts)
- [Sales API routes](../../../app/api/v1/dashboard/finance/sales/) and [Q-007](../../docs/open-questions.md#q-007--orders-to-finance-failure-and-recovery-contract)
