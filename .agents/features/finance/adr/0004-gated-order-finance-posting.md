# ADR 0004 — Order Finance Posting Is Gated by Module Activation

Status: Accepted

## Context

The existing order importer must remain useful for users who do not enable
Finance. Existing order data should not automatically create financial
journals for those organizations.

## Decision

Order import and enrichment may trigger Finance posting only when:

1. Finance is active for the organization;
2. the order event is eligible under the configured posting rule;
3. required account, product, inventory, and date prerequisites are valid.

Posting may be automatic or manual. The mode remains a product decision, but
both modes use the same Finance transaction and idempotency contract.

Posting failures do not fail the base order import. Finance records the
failure as a blocked or pending item that can be reviewed and retried.

## Consequences

- Old Orders remains the operational source of truth.
- Finance needs a narrow adapter from order data to Finance sales data.
- Order status alone must not be assumed to equal a financial event without an
  explicit mapping.
- Backfill of historical eligible orders is a separate decision.

