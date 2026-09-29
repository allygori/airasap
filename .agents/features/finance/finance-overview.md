# Finance Module Overview

Status: [TARGET]

## Purpose

Finance adalah modul opsional untuk seller marketplace dan UMKM yang ingin
menghubungkan analisis order, penjualan, stok, dan keuangan. Fitur dasar
aplikasi tetap berjalan tanpa Finance:

- Orders
- Products
- Reports

Finance tidak menggantikan atau merombak modul dasar tersebut. Finance
menambahkan transaksi, pencatatan, saldo, dan laporan keuangan di atas data
operasional yang sudah ada.

## Scope boundary

Target boundary Finance:

- modules/finance/
- app/dashboard/finance/
- app/api/v1/dashboard/finance/

Menu target sudah disiapkan melalui financeNav di constant/menu.ts.

Orders, Products, dan Reports lama tetap menjadi current surface. Importer order
lama tetap menjadi sumber order utama. Integrasi Finance hanya menambahkan
posting finance ketika Finance aktif dan prasyarat posting terpenuhi.

## Principles

1. Finance optional. Organisasi dapat menggunakan aplikasi dasar tanpa
   onboarding atau posting Finance.
2. Finance memiliki contract, service, repository, API boundary, dan collection
   CoA sendiri.
3. Infrastruktur bersama tetap digunakan: koneksi database, auth, tenant
   context, validasi, response envelope, dan komponen UI yang relevan.
4. Logic atau data lama hanya boleh menjadi referensi. Finance tidak boleh
   memiliki dependency runtime pada modul Accounting lama.
5. Jangan menduplikasi master data yang masih valid. Order lama tetap menjadi
   referensi order; Product lama tetap menjadi referensi product.
6. Jurnal posted immutable. Koreksi dilakukan melalui reversal atau transaksi
   baru.
7. Setiap transaksi Finance memiliki source reference dan idempotency behavior.
8. UI navigation adalah experience gate; route dan service tetap melakukan
   server-side access check.
9. Status transaksi harus memisahkan pending, posted, blocked, dan reversed
   bila perilakunya berbeda.

## Conceptual flow

Operational source
  -> Finance transaction
  -> subledger or balance projection
  -> balanced journal
  -> financial reports

Manual journal digunakan untuk adjustment yang memang tidak berasal dari
workflow operasional.

## Implementation plan map

| Plan | Focus | Estimated phases |
| --- | --- | ---: |
| 1 | Foundation and optional access | 3 |
| 2 | Core accounting and journal contract | 4 |
| 3 | Finance onboarding | 3 |
| 4 | Sales and order integration | 4 |
| 5 | Organization-wide inventory, simple mapping, channel stock, and cost of sales | 7 |
| 6 | Cash and bank | 3 |
| 7 | Purchases, expenses, receivables, and payables | 4 |
| 8 | Reports and period closing | 5 |
| 9 | Historical reconstruction | 4 |
| 10 | Owner withdrawals | 2 initially; broader scenarios are discovery-only |
| 11 | Cash loans, repayments, and future amortization | 3 |

Estimate: about 41–43 implementation phases, plus discovery for broader owner
and legal-entity scenarios in Plan 10. The phase count is directional and may
change after each plan's discovery phase.

## Reuse policy

Reuse is selective, not automatic.

Likely reuse candidates:

- existing Chart of Accounts taxonomy as a reviewed reference, copied into a
  Finance-owned seed rather than imported at runtime;
- validated account tree behavior;
- existing shared form primitives;
- existing tenant/auth/database infrastructure;
- presentational parts of the old accounting onboarding wizard;
- proven order normalization or marketplace import mapping logic.

Reuse requires checking:

- tenant and store semantics;
- persisted field contract;
- status and lifecycle behavior;
- transaction/session support;
- idempotency;
- compatibility with Finance's new API boundary.

Do not copy old accounting side effects into the new importer without review.

## Decisions still open

- Should Finance activation state reuse the old organization accounting state or
  use a new Finance-owned state?
- Is order posting automatic, manual, or configurable per organization?
- Does a later phase need a dedicated order-history selection flow beyond the
  existing Orders import/enrichment path? Plan 09 does not add a duplicate
  order-entry or journal-entry workflow.
- Which order-status events and platform APIs are available for the inventory
  reservation and channel stock-sync phases in Plan 05?
- What minimum AR/AP workflow is needed for the target UMKM users?
- Which reports are required for the first release?
- Which owner transaction types and legal-entity scenarios should be supported
  beyond the simple owner-drawing workflow scoped in Plan 10?

These questions must be answered in the relevant plan or ADR before the
affected implementation starts.

## Documentation layout

This directory contains one overview and one implementation plan per major
capability. Phases remain sections inside the plan files unless a phase becomes
large enough to require its own document.

Architecture rationale and stable decisions belong under .agents/docs/adr/.
