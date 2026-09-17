# Implementation Plan — Accounting Backend

**Status:** In progress — core lifecycle/onboarding/posting sudah diimplementasikan; hardening lanjutan masih tersisa
**Versi:** 1.0  
**Basis:** [PRD — Accounting Onboarding.md](<D:\Startup\airasap\.agents\PRD\PRD — Accounting Onboarding.md>) v1.2  
**Scope:** backend dan perubahan domain pada module `accounting`, `inventory`, `expense`, `orders`, `organizations`, serta integrasi `products` dan `stores`.

Dokumen ini menjadi baseline implementasi. Pekerjaan dilakukan bertahap per phase agar kontrak data dan acceptance criteria dapat diverifikasi sebelum domain diperluas.

## Status implementasi saat ini

Sudah diimplementasikan pada batch ini:

- lifecycle organization `not_started -> in_progress -> active`, owner gate, module guard, dan endpoint onboarding satu kali;
- CoA resolver berbasis logical role, mapping per platform, child account bank dengan metadata rekening, serta dukungan beberapa rekening bank;
- accounting calendar timezone, cutover lokal, period boundary, dan report period berbasis timezone accounting;
- opening balance aggregate, inventory opening movement, product/variant mapping, stok awal `0`, stok positif, dan balancing equity;
- guard cutover untuk order/expense/settlement, status blocked/retry metadata, marketplace funds release ke receivable/balance marketplace, payout ke rekening bank, fee mapping, serta batch retry order;
- reconstruction order terpisah dengan default permission owner.


Masih menjadi follow-up phase berikutnya:

- inventory/opening preview API dan readiness report yang lebih detail;
- fee reconciliation dan settlement reconciliation yang lebih lengkap;
- migration/readiness command untuk data lama, integration test Mongo transaction, serta verifikasi adapter Better Auth;
- audit/reconciliation report dan hardening concurrency pada seluruh import pipeline.

## 1. Keputusan arsitektur yang dipakai

1. Satu organization memiliki satu accounting ledger. Store, platform, dan lokasi menjadi dimensi atau referensi pada transaksi; bukan ledger terpisah.
2. Accounting adalah module opsional. Organization dapat aktif tanpa accounting.
3. Status accounting disimpan langsung pada dokumen `organizations` melalui field `accounting`. Status authoritative-nya:
   - `not_started`
   - `in_progress`
   - `active`
4. Onboarding accounting hanya dapat difinalisasi sekali. Setelah `active`, endpoint onboarding tidak boleh membuat sesi baru, mengubah cutover, atau mengulang opening initialization.
5. Reconstruction adalah flow dan permission terpisah dari onboarding. Default sementara: owner organization. Nanti dapat diganti menjadi permission capability, misalnya `accounting.reconstruct`.
6. Account bank dan piutang marketplace tetap berupa postable child account pada CoA. Collection `bank_accounts` tidak diperlukan pada versi pertama.
7. Detail rekening bank disimpan sebagai metadata opsional pada account, minimal `account_last4`, `account_holder`, dan `institution`; nama account tetap menjadi label yang terlihat user. Saat onboarding, beberapa rekening dapat dibuat atau dipakai ulang sebagai child account di bawah group `1100`; saldo positifnya masuk ke opening balance.
8. Product tidak otomatis menjadi inventory item hanya karena product sudah ada. Onboarding menampilkan kandidat berdasarkan product/variant, lalu user memilih item yang benar-benar dikelola sebagai inventory.
9. Stok awal `0` boleh disimpan sebagai item/mapping, tetapi tidak menghasilkan inventory movement atau journal. Stok positif memerlukan quantity, unit cost, dan location.
10. Opening inventory memakai semantics `opening_balance`, bukan `purchase`, supaya tidak menciptakan hutang supplier fiktif.
11. `released_funds` marketplace tidak otomatis berarti uang sudah masuk bank. Dana tersebut masuk ke akun saldo marketplace; pencatatan bank dilakukan ketika ada payout/receipt yang benar-benar diterima.

## 2. Kondisi kode saat ini yang harus diperbaiki

Temuan ini menjadi baseline implementation plan:

- `OrganizationSchema` dan DTO organisasi belum memiliki `accounting` state.
- Better Auth memakai collection `organizations`, tetapi belum ada kontrak `additionalFields` atau application-owned write path yang eksplisit untuk state accounting.
- `constant/timezone.ts` memiliki label `WIT`/`WITA` yang tertukar dengan nilai timezone-nya.
- `getPeriodKeyFromDate` dan validasi journal saat ini berbasis UTC, sedangkan store sudah memiliki timezone.
- Route setup/bootstrap saat ini melakukan seed CoA, default location, dan period. Itu harus tetap idempotent, tetapi tidak boleh dianggap sebagai finalisasi onboarding atau aktivasi module.
- `OrderAccountingIntegrationService` memakai kode akun hardcoded (`1210`, `4100`), belum memeriksa accounting status/cutover, dan hanya memproses order `selesai`.
- `InventoryMovementService` hanya mem-post `purchase`, `sale`, dan `consumption`, walaupun schema mendeklarasikan tipe movement yang lebih banyak. `opening_balance` perlu menjadi jalur resmi.
- `InventoryItem` tidak memiliki referensi product, sehingga relasi tetap harus menggunakan collection mapping yang sudah ada.
- `ExpenseService` sudah mendukung account reference, tetapi fallback payment account masih hardcoded ke `2100`; posting belum memakai resolver/mapping yang sama dengan order dan inventory.
- `SettlementService` masih hardcoded ke `1130`, `1210`, dan account fee tertentu serta mencampur release marketplace dengan penerimaan bank.
- Model yang sudah memiliki idempotency dan audit belum seluruhnya memakai satu transaction boundary untuk perubahan dokumen sumber, journal, movement, dan status final.

## 3. Target data model

### 3.1 `organizations.accounting`

Tambahkan field yang dikelola oleh application domain service:

```ts
accounting?: {
  status: 'not_started' | 'in_progress' | 'active';
  onboarding_version: number;
  calendar_timezone?: string;
  cutover_date?: Date;
  account_mappings?: {
    sales_revenue?: string;
    marketplace_balance?: string;
    marketplace_balances?: Record<string, string>;
    marketplace_receivables?: Record<string, string>;
    merchandise_inventory?: string;
    merchandise_cogs?: string;
    opening_balance_equity?: string;
    expense_payable?: string;
    marketplace_fee_accounts?: Record<string, string>;
  };
  started_at?: Date;
  completed_at?: Date;
  completed_by?: string;
};
```

Catatan implementasi:

- `status` default `not_started` untuk organization lama.
- Reference account disimpan sebagai string/ObjectId reference yang divalidasi oleh service, bukan sebagai kode akun yang digunakan langsung saat posting.
- Jangan menyimpan draft onboarding besar di organization. Draft sementara tetap berada di client atau collection khusus hanya jika retry/resume lintas device benar-benar diperlukan.
- Semua perubahan state harus melewati `AccountingLifecycleService`, bukan update langsung dari route.
- Karena collection dipakai Better Auth, lakukan compatibility test terhadap adapter dan `additionalFields`. Jika Better Auth tidak aman untuk nested object, Mongoose application model tetap menjadi source of truth dan konfigurasi Better Auth hanya digunakan untuk field yang perlu diekspos.

### 3.2 Account dan mapping

Pertahankan `AccountingAccount` sebagai sumber CoA. Tambahkan metadata opsional untuk account yang memerlukan identitas operasional, terutama rekening bank:

```ts
account_metadata?: {
  institution?: string;
  account_last4?: string;
  account_holder?: string;
  provider?: string;
};
```

Tambahkan resolver terpusat yang menerima logical role dan context, lalu mengembalikan account `_id`. Semua posting baru memakai resolver ini. Kode `1210`, `4100`, `1130`, dan lainnya hanya boleh menjadi seed/migration fallback, bukan dependency business logic.

Struktur CoA minimum yang direkomendasikan:

- `Bank` sebagai group, lalu child postable account per rekening: `Bank BCA — 9910`, `Bank BNI — 2391`.
- `Piutang Marketplace` sebagai group, lalu child per platform: `Piutang Shopee`, `Piutang Tokopedia`.
- `Saldo Marketplace` sebagai group, lalu child per platform jika saldo platform perlu dilacak terpisah.
- Inventory dan COGS tetap memiliki account yang dapat dioverride pada `InventoryItem`.
- Hutang tidak dibatasi supplier: child liability account dapat dibuat untuk supplier, keluarga, bank, atau perusahaan finance.

Belum perlu collection baru untuk payable atau bank. Account child + `vendor_name`/deskripsi expense cukup untuk versi awal; payable subledger dapat menjadi phase terpisah jika kebutuhan rekonsiliasi meningkat.

### 3.3 Opening balance dan inventory opening

Gunakan collection yang sudah ada:

- `accounting_opening_balances` sebagai aggregate opening balance.
- `accounting_journal_entries` sebagai journal canonical.
- `inventory_movements` sebagai detail kuantitas/nilai inventory.

Tambahkan atau standarkan:

- `inventory_movement.movement_type = 'opening_balance'`.
- `source_type = 'opening_balance'`.
- `source_id` mengarah ke opening balance atau identifier onboarding.
- `journal_entry` mengarah ke journal yang sama atau reference yang sama secara deterministik.
- idempotency key per organization, opening balance, item, location, dan line.

Satu opening inventory line tidak boleh menghasilkan dua GL. Implementasi harus memilih salah satu pola yang konsisten: journal aggregate dibuat oleh `OpeningBalanceService` dan movement hanya mereferensikannya, atau journal dibuat oleh movement service dan opening balance mengagregasikannya. Rekomendasi: `AccountingOnboardingService` membuat satu aggregate opening balance, lalu mengorkestrasi detail movement dan journal dalam satu transaction boundary.

### 3.4 Order dan settlement

Pertahankan field accounting pada `orders`, tetapi tambahkan metadata retry/block yang diperlukan:

- `accounting_block_reason`
- `accounting_last_attempt_at`
- `accounting_attempt_count`
- `accounting_source_version` atau equivalent untuk mengetahui aturan posting yang dipakai.

Pertahankan `marketplace_settlements`, tetapi bedakan event-nya:

- `funds_released`: marketplace melepas dana; debit saldo marketplace dan credit piutang marketplace, termasuk fee jika sudah diketahui.
- `payout_received`: dana benar-benar masuk ke rekening bank; debit rekening bank dan credit saldo marketplace.

Setiap event harus memiliki source reference dan idempotency key sendiri. Jangan mem-post `released_funds` langsung ke account bank tanpa bukti bahwa event tersebut memang payout bank.

## 4. Aturan domain utama

### 4.1 Lifecycle module dan bootstrap

`setup/bootstrap` hanya menyiapkan dependency teknis:

- seed atau upsert CoA;
- memastikan default location bila memang dibutuhkan;
- memastikan period terbuka;
- memastikan account mapping dapat di-resolve.

`setup/bootstrap` tidak boleh:

- mengubah organization menjadi `active`;
- membuat opening balance tanpa konfirmasi final user;
- mengonversi semua product menjadi inventory item;
- mengonversi seluruh order historis.

Operational accounting endpoint wajib memakai `AccountingModuleGuard` dan hanya berjalan ketika status `active`. Endpoint onboarding boleh berjalan pada `not_started`/`in_progress`. Setelah active, onboarding mengembalikan conflict atau forbidden yang stabil dan mengarahkan user ke accounting desk.

### 4.2 Calendar, timezone, dan cutover

- Tidak perlu meminta timezone kedua jika primary store sudah memilikinya.
- Saat onboarding dimulai, simpan `accounting.calendar_timezone` dari primary store sebagai default yang dibekukan untuk calendar accounting.
- Cutover date adalah tanggal lokal calendar accounting. Default UI boleh tanggal pertama bulan berjalan, tetapi backend tidak boleh memaksa awal bulan kecuali keputusan bisnis final mengharuskannya.
- Periode journal harus dihitung dengan timezone accounting, bukan browser dan bukan UTC mentah.
- Perbaiki label `WIT`/`WITA` sebelum field ini dipakai sebagai sumber konfigurasi.
- Setelah active, perubahan timezone store tidak mengubah timezone historis accounting. Perubahan calendar timezone, jika diizinkan di masa depan, harus menjadi proses migrasi eksplisit.

### 4.3 Product, inventory item, dan stok awal

Onboarding menghasilkan preview kandidat:

1. product/variant aktif yang belum memiliki mapping;
2. product/variant yang sudah memiliki mapping dan bisa dipakai ulang;
3. item yang sudah memiliki saldo atau movement historis;
4. item yang tidak dapat dipetakan dengan aman.

Default UX:

- item kandidat ditampilkan dengan stok awal `0`;
- user memilih item yang benar-benar ingin dikelola;
- quantity positif memerlukan unit cost dan location;
- unit cost dari `variant.costs`/`default_cost` hanya menjadi suggestion yang dapat diedit;
- quantity `0` membuat item/mapping tetapi tidak membuat movement/journal;
- fallback aggregate tanpa detail item/location diberi warning dan tidak dianggap siap untuk COGS otomatis.

Jika data movement lama reliable, sistem boleh mengusulkan saldo dari data tersebut. Sistem tidak boleh silently overwrite saldo atau membuat purchase movement untuk merekonstruksi stok lama.

### 4.4 Order recognition dan reconstruction

- Order dengan tanggal transaksi sebelum cutover tidak diposting otomatis.
- Order eligible setelah cutover dapat diposting otomatis saat import jika module active, product mapping, location, cost, dan account mapping lengkap.
- Order existing setelah cutover masuk queue `pending` dan dapat diproses manual atau batch.
- Order yang tidak memenuhi syarat menjadi `blocked` dengan alasan yang dapat diperbaiki; retry harus idempotent.
- Reconstruction historis adalah service terpisah. Default permission owner; desain permission harus dapat diganti tanpa mengubah domain service.
- Journal posted tidak diedit. Koreksi menggunakan reversal dan journal baru.

### 4.5 Expense dan payable

- `expense_account` harus postable dan bertipe expense.
- `payment_account` dapat berupa rekening bank, saldo kas, payable supplier, hutang keluarga, bank, atau finance company selama account valid.
- Jika `payment_account` kosong, gunakan account payable default hanya sebagai fallback onboarding; sebaiknya user dapat memilih atau membuat child liability account.
- Expense posting harus memakai calendar period, module guard, account resolver, idempotency, audit, dan reversal.
- Draft boleh diubah; posted tidak boleh diubah langsung.

## 5. Phase implementasi

### Phase 0 — Contract, migration safety, dan observability

**Tujuan:** menyiapkan fondasi sehingga perubahan domain tidak menghasilkan data partial.

Pekerjaan:

- inventaris semua hardcoded account code dan ganti secara bertahap dengan logical account role;
- definisikan error code stabil untuk `ACCOUNTING_NOT_ACTIVE`, `ONBOARDING_ALREADY_COMPLETED`, `CUTOVER_REQUIRED`, `ACCOUNT_MAPPING_MISSING`, `INVENTORY_BASELINE_INCOMPLETE`, dan permission failure;
- pastikan semua aggregate memiliki idempotency key dan audit event;
- standardisasi helper transaction/session berbasis Mongoose;
- pastikan environment Mongo mendukung transaction, atau dokumentasikan fallback reconciliation jika tidak;
- buat migration/readiness report untuk organization lama, account, period, movement, order, settlement, dan expense;
- perbaiki timezone constant sebelum digunakan dalam period calculation.

**Acceptance criteria:** migration dapat dijalankan read-only, tidak mengubah data, dan memberi daftar conflict yang dapat ditindaklanjuti.

### Phase 1 — Organization accounting lifecycle dan module guard

**Target area:** `modules/organizations`, `lib/auth`, accounting scope, API middleware/guard.

Pekerjaan:

- tambahkan schema/DTO/model field `organization.accounting`;
- implementasikan `AccountingLifecycleService` untuk `not_started -> in_progress -> active`;
- implementasikan conditional state transition agar dua request finalisasi tidak dapat sama-sama berhasil;
- konfigurasi atau verifikasi Better Auth `additionalFields` tanpa menjadikan route auth sebagai tempat business finalization;
- pisahkan `bootstrap/setup` dari `finalize onboarding`;
- tambahkan `AccountingModuleGuard` untuk semua posting, journal, settlement, expense, dan inventory accounting endpoint;
- onboarding endpoint hanya mengizinkan owner untuk start/finalize pada versi pertama;
- simpan actor, timestamp, onboarding version, calendar timezone, dan cutover date.

**API contract minimum:**

- `GET /api/v1/dashboard/accounting/onboarding` — status, readiness, bootstrap summary, dan blockers;
- `POST /api/v1/dashboard/accounting/onboarding/start` — idempotent, hanya dari `not_started`;
- `POST /api/v1/dashboard/accounting/onboarding/finalize` — atomically activates module setelah semua prerequisite valid;
- endpoint bootstrap existing tetap idempotent dan tidak mengaktifkan module.

**Acceptance criteria:** organization active hanya setelah finalization berhasil penuh; refresh/retry tidak membuat onboarding kedua; semua operational accounting route menolak organization non-active dengan error stabil.

### Phase 2 — CoA, account resolver, dan seed migration

**Target area:** `modules/accounting/accounts`, account seed, organization mappings, expense/inventory/order/settlement services.

Pekerjaan:

- revisi `account.seed.json` agar group dan child account mencerminkan bank multi-rekening, marketplace receivable, marketplace balance, inventory, COGS, fee, payable, dan equity;
- tambahkan metadata rekening opsional dan validasinya;
- buat `AccountingAccountResolver` untuk logical roles dan platform/provider;
- ubah order, inventory, settlement, expense, opening balance, dan manual journal agar memakai account `_id` hasil resolver;
- migrasikan referensi lama berbasis code ke account `_id` tanpa mengubah journal historis;
- validasi parent account tidak postable dan child account postable;
- pastikan account mapping onboarding tidak dapat memilih inactive/non-postable/wrong-type account.

**Acceptance criteria:** mengganti account code seed tidak mematahkan posting; dua rekening bank dapat dipilih terpisah; Shopee dan Tokopedia dapat memiliki receivable/balance account terpisah; semua business service tidak lagi bergantung langsung pada konstanta code.

### Phase 3 — Accounting calendar dan period service

**Target area:** `accounting.types`, `periods`, `journal-entries`, reports.

Pekerjaan:

- ubah period helper agar menerima timezone accounting;
- gunakan tanggal lokal untuk cutover, transaction date, posting date, dan period validation;
- pastikan opening period di-create atau di-resolve secara idempotent;
- cek semua report/query yang saat ini memakai UTC atau store timezone secara tidak konsisten;
- tambahkan test boundary untuk akhir bulan, UTC midnight, WIT/WITA, dan perubahan DST pada timezone yang relevan.

**Acceptance criteria:** tanggal order/expense pada batas hari lokal masuk period yang benar; journal date yang berada di period tertutup ditolak; laporan historis tidak berubah hanya karena browser user berbeda timezone.

### Phase 4 — Opening balance dan inventory baseline

**Target area:** `opening-balances`, `inventory/movements`, `inventory/items`, `inventory/mappings`, onboarding orchestration.

Pekerjaan:

- buat readiness/preview service yang menghitung kandidat product/variant, mapping, existing inventory, account, location, dan blocker;
- buat flow create/reuse inventory item dan product mapping secara idempotent;
- dukung multi-store melalui store dimension pada movement/journal, tanpa membuat ledger per store;
- implementasikan `opening_balance` movement dengan quantity, unit cost, total cost, item, location, dan occurred date;
- buat aggregate opening journal yang mencatat aset inventory dan balancing equity/opening account yang disepakati;
- pastikan opening movement tidak memakai offset `Utang Usaha` dan tidak menduplikasi GL;
- skip journal untuk quantity `0`, tetapi tetap dapat membuat item/mapping;
- blokir finalization bila quantity positif tidak memiliki cost/location atau account mapping;
- simpan audit detail pilihan user dan hasil preview.

**API contract minimum:**

- `POST /api/v1/dashboard/accounting/onboarding/inventory/preview` — read-only candidate preview;
- `POST /api/v1/dashboard/accounting/onboarding/inventory/initialize` — creates items/mappings/movements under one idempotent operation;
- `POST /api/v1/dashboard/accounting/onboarding/opening-balance/preview` — calculates debit/credit and blockers.

**Acceptance criteria:** stok awal 0 tidak membuat journal; stok awal positif menghasilkan inventory asset yang benar; retry menghasilkan dokumen yang sama; kegagalan tidak meninggalkan organization active atau partial opening tanpa status yang dapat direkonsiliasi.

### Phase 5 — Finalization dan cutover transaction

**Target area:** orchestration service dan organization lifecycle.

Pekerjaan:

- finalization memvalidasi CoA, mappings, timezone, cutover date, period, locations, inventory baseline, dan opening balance;
- jalankan bootstrap, opening aggregate, inventory initialization, dan state transition dalam transaction boundary;
- gunakan deterministic key untuk opening balance dan journal;
- jika ada partial failure, state tetap `in_progress` atau masuk error yang dapat di-retry, bukan `active`;
- active timestamp dan actor hanya ditulis setelah seluruh posting berhasil;
- buat endpoint/status yang mengembalikan blocker yang actionable.

**Acceptance criteria:** finalisasi bersifat all-or-nothing sejauh dukungan Mongo transaction; request duplikat aman; user tidak dapat kembali ke onboarding setelah `active`.

### Phase 6 — Order accounting, marketplace release, dan payout

**Target area:** `modules/orders/services/order-accounting-integration.service.ts`, settlement service/model, import/enrichment flow, order API.

Pekerjaan:

- tambahkan module status dan cutover guard;
- gunakan account resolver dan store/platform dimensions;
- pertahankan journal penjualan: Dr piutang marketplace / Cr sales revenue;
- posting inventory sale dan COGS hanya jika item mapping, location, quantity, dan valuation tersedia;
- tambahkan queue/readiness query untuk order pending/blocked existing setelah cutover;
- tambahkan batch retry dengan limit dan idempotency per order, tanpa mengubah order yang sudah posted;
- ubah settlement menjadi dua event stage seperti pada aturan domain: `funds_released` dan `payout_received`;
- `funds_released` tidak langsung mendebit bank; `payout_received` memakai account bank child yang dipilih atau dipetakan;
- fee line memakai mapping fee type, bukan hardcoded account code;
- sinkronkan `released_funds_at`/`released_funds` sesuai semantics provider dan simpan source reference.

**Acceptance criteria:** order pending karena dana belum released tetap menjadi piutang; release membuat saldo marketplace; payout membuat saldo bank; setiap event dapat di-retry tanpa journal duplikat; order pre-cutover tidak auto-post.

### Phase 7 — Expense integration dan liability usability

**Target area:** `modules/expenses`, expense routes, account resolver, period/guard.

Pekerjaan:

- terapkan module guard dan calendar period pada create/post expense;
- hapus ketergantungan business pada fallback code `2100`; gunakan configured default payable account;
- validasi payment account untuk bank, cash, payable, family debt, loan, atau finance liability;
- tambahkan source/reference semantics yang konsisten dengan journal;
- dukung reversal/void melalui journal reversal, bukan edit posted expense;
- tambahkan list/readiness API yang membedakan draft, posted, dan blocked.

**Acceptance criteria:** user dapat mencatat expense ke rekening bank mana pun atau liability account yang sesuai; expense tidak dapat posted pada period tertutup/non-active module; retry tidak menggandakan journal.

### Phase 8 — Reconstruction dan permission boundary

**Target area:** accounting reconstruction service dan authorization layer.

Pekerjaan:

- buat service terpisah dari onboarding untuk order historis, opening correction, atau journal reconstruction;
- default hanya owner; gunakan capability name yang dapat dipetakan ke role/permission di masa depan;
- require explicit date range, source selection, preview, dan confirmation;
- tandai semua reconstructed journal dengan source type/event khusus dan audit actor;
- cegah reconstruction mengubah cutover atau mengedit posted journal;
- sediakan idempotency dan reversal path.

**Acceptance criteria:** user biasa tidak dapat menjalankan reconstruction; reconstruction tidak membuka onboarding lagi; hasilnya dapat dibedakan dan diaudit dari posting operasional normal.

### Phase 9 — Test, migration, dan hardening

Pekerjaan:

- migration untuk organization lama: default `not_started`, tanpa mengubah data accounting existing;
- migration account/reference lama ke resolver dan `_id`;
- reconciliation report untuk journal, movement, order, settlement, expense, dan source references;
- integration test Mongo dengan transaction dan duplicate request;
- contract test untuk Better Auth organization read/update;
- performance test batch order dan candidate inventory pada organization besar;
- audit log dan structured error logging untuk semua state transition/posting.

## 6. Kontrak API dan service boundary

Route harus tipis. Business rule berada di service berikut:

- `AccountingLifecycleService`: state transition, one-time rule, owner/capability check.
- `AccountingOnboardingService`: readiness, preview, orchestration finalization.
- `AccountingAccountResolver`: logical role/provider/item type ke account.
- `AccountingCalendarService`: timezone, cutover, period key, open period.
- `OpeningBalanceService`: aggregate opening balance dan posting.
- `InventoryOpeningService`: product candidate, item/mapping, opening movement.
- `OrderAccountingIntegrationService`: sale/COGS posting dan retry queue.
- `MarketplaceSettlementService`: release/payout stages dan reconciliation.
- `ExpenseService`: draft, post, void/reversal.
- `AccountingReconstructionService`: historical reconstruction terpisah.

Endpoint existing tetap dipertahankan bila masih sesuai, tetapi harus memanggil service boundary di atas. Jangan membuat route onboarding menulis langsung ke lebih dari satu model tanpa orchestrator.

## 7. Transaction, idempotency, dan concurrency

Deterministic idempotency key minimum:

- finalization: `accounting-onboarding:<organizationId>:<onboardingVersion>`;
- opening balance: `opening-balance:<organizationId>:<cutoverDate>`;
- opening inventory: `opening-inventory:<openingBalanceId>:<itemId>:<locationId>`;
- order sale: `order-sale:<orderId>`;
- order inventory: `order-inventory:<orderId>:<lineKey>`;
- marketplace release/payout: provider + source event reference;
- expense: `expense:<expenseId>`.

Semua operasi harus aman terhadap:

- double click atau retry HTTP;
- dua tab melakukan finalisasi bersamaan;
- import order berjalan saat onboarding belum active;
- settlement datang sebelum order posted;
- partial journal/movement/source update.

Gunakan Mongo `ClientSession` untuk aggregate yang harus atomik. Jika transaksi tidak tersedia, wajib ada reconciliation state dan repair command; jangan menyembunyikan partial success.

## 8. Urutan implementasi yang disarankan

Urutan dependency:

1. Phase 0 — contract dan migration safety.
2. Phase 1 — organization lifecycle dan module guard.
3. Phase 2 — account resolver dan seed/mapping.
4. Phase 3 — calendar/period timezone.
5. Phase 4 — opening inventory dan opening balance.
6. Phase 5 — finalization transaction.
7. Phase 6 — order serta settlement.
8. Phase 7 — expense.
9. Phase 8 — reconstruction permission boundary.
10. Phase 9 — migration, reconciliation, dan hardening.

Phase 6 tidak boleh dikerjakan sebelum Phase 2–5 selesai karena order membutuhkan account mapping, period, active state, inventory baseline, dan cutover semantics.

## 9. Hal yang tidak termasuk implementasi backend phase ini

- Menggabungkan accounting onboarding dengan organization/store creation.
- Full UI reconstruction.
- Full payable/loan subledger dengan aging dan installment schedule.
- Bank statement import dan automatic reconciliation penuh.
- FIFO/average-cost engine lengkap jika valuation saat ini belum mendukungnya.
- Tax engine, multi-currency, dan full Shopee API integration.
- Perubahan UI page/module lain di luar contract yang diperlukan oleh backend.

## 10. Definition of done keseluruhan

Backend dianggap siap ketika:

- organization dapat mengaktifkan accounting sekali secara aman dan dapat diaudit;
- module accounting benar-benar optional dan semua endpoint sensitif memiliki guard;
- CoA mendukung banyak rekening bank, marketplace receivable, marketplace balance, dan liability counterparty;
- opening stock tercatat sebagai aset dan tidak membuat hutang fiktif;
- product, inventory item, mapping, dan order accounting memiliki batas tanggung jawab yang jelas;
- pending marketplace funds tidak salah dianggap sebagai bank cash;
- order/settlement/expense dapat di-retry tanpa duplikasi journal;
- posted accounting data immutable dan koreksi dilakukan lewat reversal;
- reconstruction terpisah, owner-only secara default, dan memiliki audit trail;
- timezone, period, cutover, dan report menggunakan calendar yang konsisten;
- migration dan reconciliation report tersedia sebelum data lama diperlakukan sebagai authoritative.
