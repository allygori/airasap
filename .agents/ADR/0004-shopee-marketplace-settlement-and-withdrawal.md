# ADR-0004: Shopee Marketplace Sales, Settlement, and Withdrawal

- **Status:** accepted
- **Date:** 2026-10-06
- **Decision scope:** [TARGET] direction
- **Supersedes:** None
- **Superseded by:** None

## Context

Shopee Order, completed-order, and released-funds files describe different stages of the seller workflow. A released-funds amount means the money has become available in the seller's Shopee marketplace balance; it does not mean that Shopee has transferred it to the seller's bank or e-wallet.

The current implementation posts marketplace sales for Orders whose imported status is `selesai`. Its transaction date uses `completed_at` when available and otherwise falls back to `placed_at`. Released-funds posting currently uses the configured Shopee payout bookkeeping account when one is set, which can debit a bank/e-wallet before the seller manually withdraws the Shopee balance. The generic Cash & Bank transfer workflow accepts marketplace-balance accounts, but does not enforce that a transfer amount is within the source account's available balance.

For the seller's Shopee workflow, the export field mapped to `shipping_arranged_at` records that a shipping label has been prepared and is ready to print. It is not a courier handoff timestamp, and the available source data does not provide a reliable date/time for the courier taking possession of a parcel.

This decision is scoped to Shopee, the only marketplace for which this workflow currently has source data. Do not apply these status, fee, or settlement mappings to another platform without reviewing its source files and accounting lifecycle.

## Decision drivers

- Keep order placement, sale recognition, marketplace fund release, and seller withdrawal as distinct events.
- Use source dates that correspond to the event being journaled; do not silently backdate a sale to order placement.
- Keep the accounting balances consistent with funds actually withdrawable from Shopee.
- Preserve per-Order fee detail for analysis while keeping the general ledger useful and concise.
- Do not infer unverified Shopee status meanings or fee rates from application constants.

## Options considered

### Option A — Recognize and settle directly to the configured bank account

This matches the current Shopee released-funds journal when the payout bookkeeping account is configured. It conflates Shopee wallet availability with the seller's separate manual withdrawal and can overstate bank/e-wallet balances.

### Option B — Recognize the sale on Order placement

This would use `placed_at`, but that date precedes shipment and buyer receipt. It is useful as an Order cohort date, not the selected sales-journal date.

### Option C — Recognize on Order completion, settle to marketplace balance, and record withdrawal separately

This uses the available `completed_at` milestone for the sales journal, the released-funds date for marketplace settlement, and the actual manual withdrawal date for the bank/e-wallet transfer. It preserves the distinction between sales, marketplace-held funds, and cash received by the seller.

## Decision

1. **Sales recognition:** For Shopee Orders, the target posting trigger remains imported status `selesai`. Use `completed_at` as the sales-journal transaction date. If `completed_at` is missing, leave the posting blocked for review; do not fall back to `placed_at`. Retain `placed_at` as the Order date for operational and per-Order analysis. `paid_at` does not by itself trigger a sales journal.
2. **Sales journal:** Debit the `marketplace_receivable` role (seeded account 1210 Piutang Marketplace) and credit the configured sales-revenue role. Inventory COGS timing remains governed by the current Finance Inventory workflow until the inventory decision in Q-011 is resolved.
3. **Marketplace release:** When Shopee reports released funds, debit the `marketplace_balance` role (seeded account 1220 Saldo Marketplace) for the net amount available to withdraw, debit the existing Beban Admin Marketplace account (seeded account 6310) for Shopee fees, and credit 1210 Piutang Marketplace for the gross receivable cleared. Use the released-funds date. Actual fee amounts from Shopee source data are authoritative; do not calculate or backfill fees from assumed program rates.
4. **Fee detail:** Keep platform/admin, fixed processing, GOX, and other program fee amounts identifiable per Order or release for analysis, while routing Shopee fee expense to the existing Beban Admin Marketplace account. Do not create a separate Chart of Accounts account for each fee type.
5. **Manual withdrawal:** Provide a dedicated Penarikan Marketplace page under Finance → Transaksi. It records a seller-initiated withdrawal from 1220 Saldo Marketplace to a selected eligible Bank or E-wallet account. The form may accept any positive IDR amount up to the currently withdrawable marketplace-balance amount. Debit the destination account and credit 1220. Enforce the limit on the server as well as in the UI. 1210 Piutang Marketplace is not a withdrawal source.
6. **Settings:** The fixed Shopee payout bookkeeping destination must not determine the released-funds journal. The receiving Bank/E-wallet belongs to each manual withdrawal; whether the existing setting is removed or retained only as a form default is an implementation detail to resolve without changing historical journals.
7. **Corrections:** Posted journals remain immutable. A later change in marketplace fee/source data must be represented by an auditable correction or adjustment workflow; the exact retry/reconciliation behavior remains open in Q-017.
8. **Inventory and returns:** This ADR does not change stock reservation, physical on-hand, COGS timing, or return/refund handling. Their current behavior and unresolved Shopee data assumptions remain documented in Finance Inventory and Q-011.

## Consequences

### Positive

- Finance distinguishes Shopee-held withdrawable funds from bank/e-wallet cash.
- Order date remains available for per-Order analysis without determining the accounting date.
- Shopee fee components remain analyzable without fragmenting the Chart of Accounts.
- Manual withdrawal amounts can reflect actual Shopee withdrawals, including partial withdrawals.

### Costs and constraints

- Orders without `completed_at` require review before automatic sales posting.
- Released-funds reconciliation must route each Shopee fee component to one expense role while retaining its source detail.
- Withdrawal posting needs a server-side, concurrency-safe available-balance guard.
- Return/refund and inventory lifecycle behavior are not settled by this decision.

## Implementation status

- **[CURRENT]** Shopee sales eligibility is based on `selesai`, and its sales transaction date requires `completed_at`; missing dates leave the projection incomplete. Other marketplace date mappings were not changed.
- **[CURRENT]** Shopee released-funds posting may debit the configured payout bookkeeping account directly.
- **[CURRENT]** Generic cash/bank transfers accept marketplace-balance accounts but do not prevent a transfer greater than the source balance.
- **[TARGET]** Apply the released-funds and manual-withdrawal decisions above in later implementation steps. This ADR does not claim that those target workflows or the Penarikan Marketplace page exist yet.

## Open questions and related records

- [Q-011 — Imported Order, shortage, cancellation, and return reconciliation](../docs/open-questions.md#q-011--imported-order-shortage-cancellation-and-return-reconciliation)
- [Q-017 — Marketplace release fee updates and correction workflow](../docs/open-questions.md#q-017--marketplace-release-fee-updates-and-correction-workflow)
- [Finance Sales](../features/finance/sales.md), [Finance Cash Management](../features/finance/cash-management.md), [Finance Inventory](../features/finance/inventory.md), and [Inventory and Sales Channels](../docs/architecture/inventory-and-channels.md)
