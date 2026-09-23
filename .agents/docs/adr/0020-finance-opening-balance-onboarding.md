# ADR 0020 — Finance Opening Balance Onboarding Scope

Status: [CURRENT]

## Context

Finance is an optional module for sellers and UMKM users. The first opening
position should be easy to enter, but it must still produce an auditable
ledger and remain useful for inventory and outstanding-balance workflows.

The product reference `List_Opening_Balance_Toko_Online.md` identifies the
practical opening balances for an online store as cash, bank accounts,
e-wallet or payment-gateway balances, inventory, supplier payables, owner
capital, and a system-calculated retained-earnings balance. It also lists
receivables, deposits, fixed assets, taxes, loans, and other liabilities as
optional or later concerns.

The reference is guidance for the first Finance experience, not a requirement
to expose every accounting account during onboarding. The existing Orders,
Products, and Reports modules remain outside this decision.

## Decision

1. Require a Finance cut-off date before activation. The date identifies the
   point at which the opening position is measured; it is not, by itself, a
   historical reconstruction or period-locking feature.
2. Keep the first onboarding scope to permanent accounts only: assets,
   liabilities, and equity. Do not accept revenue, expense, or tax balances as
   opening-balance inputs.
3. Support these core inputs:
   - Kas, Bank, E-wallet, and marketplace/payment-gateway balances per mapped
     postable COA account;
   - inventory per Finance item and location, including quantity and unit
     cost;
   - supplier payable opening items with a supplier or reference label;
   - Modal Pemilik as an explicit user input;
   - Saldo Laba/retained earnings as a system-calculated balancing equity
     amount.
4. Treat opening receivables as optional. If entered, each item should carry a
   counterparty or reference so it can be displayed and settled. An aggregate
   item may be used only when clearly labelled as a summary and must not be
   presented as more detailed than the source data supports.
5. Make the user choose explicitly between entering opening balances and
   starting Finance at zero. A category that does not apply may be recorded as
   zero or not used; an omitted value must not silently change the opening
   position.
6. Finalization creates one Finance-owned, idempotent opening batch for the
   organization, cut-off date, and onboarding version. Entered balances create
   one balanced journal with `source_type: opening_balance`, plus linked
   inventory movements and opening subledger items where applicable. The
   explicit zero-start choice records a skipped batch without a journal.
7. Posted opening journals and related movements are immutable. Corrections
   use a reversal or a separate adjustment transaction. Settlement of an
   opening payable or receivable creates a new journal rather than editing the
   opening journal.
8. Opening-balance finalization does not mass-post historical Orders. Sales
   posting remains gated by active Finance and the Finance-aware import flow.
9. Do not add currency or accounting-timezone configuration to this first
   onboarding scope. Do not add bank-statement import, advanced tax setup, or
   reporting as hidden prerequisites.
10. Opening-balance account selection uses the Finance-owned Chart of Accounts
    and default template described in ADR 0021.

## Consequences

- A seller can start with the balances that materially affect an online-store
  position without filling an accounting questionnaire.
- Inventory is not reduced to an untraceable total: quantity and unit cost can
  support later stock and cost-of-goods workflows.
- Payables and receivables can participate in the existing Finance subledger
  only when their opening source item is retained and exposed clearly.
- The system-generated equity balancing amount keeps the opening journal
  balanced without asking a non-accountant to calculate retained earnings.
- Optional assets, liabilities, tax balances, and owner withdrawals can be
  added in a later phase without changing the core opening-batch contract.
- The Finance module remains independently removable from the legacy modules;
  this decision does not require changes to Orders, Products, Reports, or
  their importers.

## Scope boundary

This decision applies only to the new Finance module. It does not migrate or
modify legacy accounting data and does not change the behavior of Orders,
Products, Reports, or their existing importers.
