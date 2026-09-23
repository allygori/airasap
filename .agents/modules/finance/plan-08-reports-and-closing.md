# Finance Plan 08 — Reports and Period Closing

Status: [TARGET / DEFERRED UNTIL CORE FINANCE IS VERIFIED]

## Start gate

This plan is intentionally deferred. Begin it after the product owner is
comfortable that the core Finance workflows are working reliably enough in
realistic development use. The gate should cover onboarding/opening balances,
sales source integration, journal posting and reversal, inventory/HPP where
applicable, cash/bank transfers, purchases/expenses, and settlements—including
retry behavior on standalone MongoDB. This does not require every future edge
case to be complete. Basic period close/posting guards already exist in the
core accounting plan; this plan adds the reports and broader close-readiness
workflow.

## Goal

Expose reliable financial reports and basic period controls based on posted
Finance data.

## Phases

### Phase 8.1 — Reporting foundation

Define report periods, filters, account grouping, dimensions, and source data
rules.

Acceptance criteria:

- reports use one documented period and timezone behavior;
- draft and blocked transactions do not affect posted financial statements;
- filters do not cross organization boundaries;
- report totals can be traced to posted journals.

### Phase 8.2 — Core financial statements

Implement the first versions of:

- Laba Rugi;
- Neraca;
- Arus Kas.

The exact cash flow method and comparative-period behavior remain open.

### Phase 8.3 — Operational and tax reports

Implement:

- Laporan Penjualan;
- Laporan Stok dan Margin;
- Laporan Pajak, only for supported tax scenarios.

Operational Reports remain separate and are not replaced.

### Phase 8.4 — Closing books

Provide period close, posting rejection after close, controlled correction, and
clear period status.

Acceptance criteria:

- closed periods reject new operational postings;
- correction path is explicit;
- close validation reports blockers;
- reopening, if allowed, is restricted and auditable.

## Open questions

- Direct or indirect cash flow?
- Is comparative reporting required?
- Which tax reports are legally or operationally needed?
- Can a closed period be reopened, and who may do it?

## Not in scope

- tax filing submission;
- bank statement reconciliation;
- multi-currency reporting;
