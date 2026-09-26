# ADR 0026 — Finance Historical Reconstruction and Suspense Control

Status: [TARGET — DISCUSSION BASELINE, NOT IMPLEMENTED]

## Context

Finance is optional and already has separate opening-balance onboarding,
Finance-owned purchase and inventory records, and an Orders import integration.
Some organizations want to enter selected historical merchandise purchases
and process existing orders without pretending that every historical business
event is known. The user-selected history boundary and opening balances may
differ between organizations.

The discussion also confirmed that posted journals must remain immutable, and
that reconstruction may need one visible temporary account for unexplained
differences. A broader historical-accounting reconstruction PRD exists, but
the first implementation should stay substantially smaller.

## Decision

1. Historical reconstruction is a Finance workflow that runs after onboarding;
   it is not hidden inside opening-balance finalization.
2. The reconstruction start/end range is distinct from the opening-balance
   date. Do not hard-code the discussed test scenario (zero opening position
   before April 2026 through 26 September 2026) as a universal default.
3. Reuse the current Finance Purchase form for historical merchandise
   purchases and the existing Orders import/enrichment path for order events.
   Do not create duplicate purchase/order forms or manual Finance sales entry
   for imported orders.
4. At most one system-managed, organization-scoped suspense account may be
   used for reconstruction. It is restricted to reconstruction workflows and
   must not become a general posting fallback for unsupported or invalid
   transactions.
5. Reconstruction does not grant permission to edit or delete posted journals
   or inventory movements. Identified errors are corrected through new,
   traceable correcting/reclassification entries, consistent with ADR 0003.
6. Any historical COGS recovery is a separate append-only Finance effect. It
   must not mutate the original posted sales journal and must not use inventory
   received after the sale date to calculate that sale's cost.

## Consequences

- The first reconstruction interface can be a lightweight guide/status view
  that links to existing transaction workflows instead of duplicating them.
- Existing order import idempotency remains the duplicate-safety boundary for
  order posting. Re-importing an order is not itself a deferred-HPP retry.
- A suspense balance is an explicit unresolved difference, not proof that the
  underlying historical records are complete or financially correct.
- Reconstruction status and suspense balance must be visible. Reports must not
  imply a complete/reconciled history while unresolved differences remain.
- Plan 08 remains separately deferred; this ADR does not authorize financial
  statement work or bank-statement reconciliation.

## Open questions

- What CoA parent/type/code and normal-balance presentation should the suspense
  account use, and should it be created when Finance starts or when
  reconstruction is first used?
- Which account balances are included in an ending snapshot and how is the
  snapshot compared with the reconstructed ledger?
- Is an unresolved suspense balance allowed when the user marks a
  reconstruction review complete, and what acknowledgement is required?
- Should aging thresholds and reminders be provided? No fixed deadline,
  automatic expiry, or automatic transfer to another account is decided here.
- What is the safe chronological replay algorithm for moving-average HPP when
  historical purchase movements are entered after sales journals already
  exist?
- Is a dedicated order-history selector needed beyond current order import and
  enrichment, or should that remain out of scope?

## Not in scope

- Full historical reconstruction of expenses, packaging consumption, taxes,
  returns/refunds, settlements, and all bank activity.
- Bank statement or bank mutation import.
- Changing onboarding to automatically post historical purchases or orders.
- Changing Orders, Products, or Reports source-of-truth behavior.
- A generic feature-flag or permission engine.
