# Product Requirements Document (PRD)
## Historical Accounting Reconstruction & Backfill

**Version:** 1.0
**Date:** 2026-09-19  
**Status:** Detailed product/design draft; implementation plan belum dimulai  
**Language:** Indonesian  
**Related PRD:** `PRD — Accounting Onboarding.md`  

---

## 1. Ringkasan

Organization memiliki data historis berikut:

- history orders marketplace;
- history pembelian barang dagangan;
- history pembelian bahan packing;
- data enrichment order dan released funds/settlement yang tersedia dari marketplace.

Organization membutuhkan laporan accounting sejak awal history, bukan hanya laporan sejak accounting module diaktifkan. Karena itu, standard accounting onboarding tidak cukup. Diperlukan proses **Historical Accounting Reconstruction** yang terpisah dari onboarding, memiliki halaman, menu, permission, batch, preview, audit trail, dan mekanisme reversal sendiri.

Reconstruction bukan izin untuk mengubah atau menghapus journal lama. Reconstruction adalah proses membuat journal dan inventory movement historis yang valid berdasarkan source data, melalui service accounting yang sama, dengan aturan append-only tetap berlaku.

### Hasil utama

Setelah proses berhasil:

- laporan laba rugi tersedia sejak `history_start_date`;
- HPP barang dagangan dihitung dari history inventory yang benar;
- HPP/beban bahan packing dapat dipisahkan sesuai data konsumsi;
- saldo inventory historis dapat ditelusuri per tanggal;
- order, purchase, packaging usage, settlement, dan payment memiliki hubungan ke source data;
- journal dan inventory movement tidak dapat diedit atau dihapus setelah posted;
- proses dapat diulang dengan aman tanpa duplicate posting;
- seluruh hasil dapat direkonsiliasi dengan file dan data sumber.

---

## 2. Keputusan Produk

### 2.1 Reconstruction terpisah dari onboarding

Accounting onboarding tetap bertanggung jawab untuk:

- mengaktifkan accounting module;
- menentukan accounting calendar timezone;
- menentukan `history_start_date`/cutover boundary;
- menyiapkan Chart of Accounts dan account mappings;
- menyiapkan inventory locations dan master mapping;
- mencatat opening balance yang benar-benar berlaku sebelum history dimulai.

Historical reconstruction bertanggung jawab untuk:

- mengimpor dan menormalkan data historis;
- memvalidasi dan mencocokkan source data;
- membuat transaksi accounting historis;
- membuat inventory movement historis;
- membuat settlement, payment, return, dan adjustment historis;
- menyediakan rekonsiliasi dan audit trail.

Reconstruction tidak boleh menjadi langkah tersembunyi di dalam finalisasi onboarding.

### 2.2 Satu ledger per organization

Organization tetap memiliki satu accounting ledger. Store, platform, product, dan inventory location direpresentasikan sebagai account, source reference, atau accounting dimension; bukan sebagai ledger terpisah.

### 2.3 Append-only tetap berlaku

Journal posted, inventory movement posted, settlement posted, dan event reconstruction yang sudah berhasil tidak boleh diedit atau dihapus.

Jika ada kesalahan:

1. buat reversal atau correcting entry;
2. perbaiki mapping atau data sumber;
3. jalankan ulang reconstruction sebagai batch baru atau retry yang idempotent;
4. pertahankan hubungan antara record lama, reversal, dan record koreksi.

Tidak boleh ada jalur khusus yang melakukan direct update atau delete terhadap journal posted untuk memperbaiki history.

### 2.4 Default permission

Untuk saat ini owner menjadi actor default yang boleh menjalankan reconstruction. Implementasi harus memisahkan authorization dari hardcoded role agar mudah diubah menjadi permission dinamis.

Permission yang diusulkan:

```text
accounting.reconstruction.view
accounting.reconstruction.create
accounting.reconstruction.validate
accounting.reconstruction.post
accounting.reconstruction.reverse
accounting.reconstruction.closed_period
```

Permission `accounting.reconstruction.closed_period` memiliki risiko paling tinggi dan tidak wajib diaktifkan pada versi pertama. Reconstruction pada period tertutup harus ditolak kecuali ada workflow khusus untuk reopen period atau correction period.

---

## 3. Tujuan dan Non-Tujuan

### 3.1 Tujuan

- Menghasilkan P&L historis yang dapat dipertanggungjawabkan.
- Menghasilkan HPP barang dagangan berdasarkan inventory purchase history, bukan asumsi dari harga jual.
- Menghasilkan saldo inventory dan packaging yang dapat ditelusuri.
- Menghubungkan setiap posting ke source record, source file, row, actor, dan batch.
- Mendukung data multi-platform dan multi-store dalam satu organization.
- Memisahkan transaksi yang sudah dibayar, belum dibayar, dan dibayar sebagian.
- Menampilkan blocker sebelum posting.
- Menyediakan preview hasil journal dan dampak terhadap inventory sebelum user mengonfirmasi.
- Menjaga retry, idempotency, dan auditability.

### 3.2 Non-tujuan versi pertama

- Mengubah reconstruction menjadi journal editor.
- Menghapus atau mengedit journal posted.
- Menyediakan FIFO dan LIFO sekaligus pada versi pertama.
- Membuat full accounts-payable subledger dengan aging kompleks.
- Membuat bank reconciliation penuh berdasarkan bank statement.
- Menebak data transaksi yang tidak tersedia tanpa penandaan eksplisit.
- Menganggap semua product otomatis menjadi inventory item.
- Menganggap semua pembelian bahan packing sebagai expense.
- Menggunakan `product_cost` pada order sebagai sumber HPP utama tanpa inventory cost history.

---

## 4. Definisi Domain

### 4.1 Source data

Data asli yang diimpor atau sudah ada di aplikasi, misalnya order marketplace, file purchase, file released funds, atau file pemakaian packing.

### 4.2 Historical event

Representasi normalisasi dari satu kejadian bisnis yang dapat menghasilkan journal atau inventory movement.

Contoh:

- purchase received;
- order completed;
- packaging consumed;
- marketplace funds released;
- payout received;
- supplier payment;
- return atau refund;
- damage atau stock adjustment.

### 4.3 Inventory movement

Perubahan quantity dan value satu inventory item pada satu location. Movement adalah subledger inventory dan dapat memiliki hubungan ke journal entry.

### 4.4 Journal entry

Representasi general ledger yang mencatat debit dan credit. Journal harus balance dan menggunakan account postable yang valid.

### 4.5 Reconstruction batch

Satu proses backfill historis yang memiliki date range, source files, mapping, actor, status, progress, dan hasil posting.

### 4.6 History start date

Tanggal awal accounting history yang ingin dilaporkan. Ini berbeda dari tanggal file di-upload dan berbeda dari tanggal batch dibuat.

### 4.7 Opening state

Kondisi aset, liabilitas, dan ekuitas sebelum historical event pertama. Jika bisnis sudah memiliki saldo sebelum history yang diimpor, saldo itu harus dibuat sebagai opening balance pada tanggal sebelum event pertama.

---

## 5. Kondisi Sistem Saat Ini

Bagian ini mendokumentasikan codebase saat PRD dibuat dan harus dianggap sebagai constraint implementasi, bukan desain final.

### 5.1 Organization dan accounting lifecycle

Accounting menggunakan state organization:

```text
not_started → in_progress → active
```

Accounting merupakan module opsional. Organization dan store dapat dibuat tanpa accounting onboarding. Satu organization memiliki satu ledger.

Accounting state saat ini menyimpan atau dirancang untuk menyimpan:

- lifecycle status;
- onboarding version;
- calendar timezone;
- cutover date;
- account mappings;
- started/completed timestamps;
- completed actor.

### 5.2 Products dan orders

Collection `products` berisi product dan variant yang dapat dijual. Product tidak otomatis sama dengan inventory item.

Collection `orders` sudah memiliki data seperti:

- platform;
- order ID;
- status;
- store;
- items;
- product/variant identifiers;
- SKU;
- quantity;
- returned quantity/final quantity;
- subtotal/gross sales/net sales;
- fee fields;
- placed/completed date;
- released funds dan released funds date;
- settlement reference;
- accounting status;
- accounting journal reference;
- accounting inventory movement references.

Order accounting saat ini memproses order selesai dan membuat:

1. inventory sale movement untuk item merchandise;
2. journal revenue dan marketplace receivable;
3. journal HPP melalui sale movement.

Settlement/released funds merupakan accounting event terpisah.

### 5.3 Inventory item

`InventoryItem.item_type` saat ini memiliki nilai:

```text
merchandise
packaging
supplies
fixed_asset
```

Field penting:

- `sku`;
- `name`;
- `item_type`;
- `unit`;
- `track_quantity`;
- `track_value`;
- `inventory_account`;
- `cogs_account`;
- `reorder_point`;
- `is_active`.

`merchandise` dipakai untuk barang yang dijual. `packaging` dipakai untuk bahan packing yang dikonsumsi dalam fulfillment. `supplies` dan `fixed_asset` membutuhkan kebijakan accounting yang berbeda.

### 5.4 Inventory movement

Movement schema saat ini memiliki:

- `inventory_item`;
- `location`;
- optional `store` dan `platform`;
- `movement_type`;
- `quantity`;
- optional `unit_cost` dan `total_cost`;
- `occurred_at`;
- `source_type` dan `source_id`;
- `offset_account`;
- `idempotency_key`;
- `reference` dan `notes`;
- `status`;
- optional `journal_entry`.

Movement type yang tersedia:

```text
purchase
sale
return
damage
loss
adjustment
transfer_in
transfer_out
consumption
opening_balance
```

Status yang tersedia:

```text
draft
posted
voided
```

Saat ini service posting sudah mendukung secara penuh purchase, sale, dan consumption. `opening_balance` diposting bersama opening journal. Movement type lain sudah tersedia di schema tetapi belum seluruhnya didukung dalam posting workflow.

### 5.5 Purchase saat ini

Belum ada collection purchase tingkat invoice/supplier. Endpoint purchase saat ini langsung membuat dan memposting `InventoryMovement` bertipe `purchase`.

Konsekuensinya:

- purchase dapat memengaruhi inventory dan journal;
- purchase dapat memiliki `reference` dan `notes`;
- purchase dapat memiliki `offset_account`;
- tetapi supplier, invoice, payment status, due date, dan split payment belum memiliki model purchase khusus.

Untuk historical reconstruction yang lengkap, data purchase perlu disimpan sebagai normalized historical event atau purchase source record sebelum menghasilkan movement.

### 5.6 Expense

Collection expenses mencatat expense account, payment account, amount, date, description, vendor, source reference, dimensions, dan journal reference.

Pembelian barang dagangan atau bahan packing yang disimpan sebagai inventory tidak boleh dimasukkan sebagai expense hanya karena sumber datanya berupa file pembelian. Expense digunakan untuk:

- bahan yang langsung dibebankan dan tidak dilacak sebagai inventory;
- biaya marketplace;
- biaya operasional;
- konsumsi non-inventory;
- biaya lain yang memang bukan perolehan aset.

### 5.7 Settlement

Collection settlement saat ini mendukung:

- order;
- store;
- platform;
- settlement reference;
- settled date;
- stage `funds_released` atau `payout_received`;
- destination account;
- gross, fee, net amount;
- fee lines;
- reconciliation status;
- source file;
- idempotency key;
- journal reference.

Settlement tidak boleh digabung secara diam-diam ke journal order jika event settlement memiliki tanggal dan sumber yang berbeda.

### 5.8 Journal service

`JournalEntryService` saat ini memiliki mekanisme:

- journal baru harus dimulai sebagai draft;
- account harus valid dan postable;
- source reference harus konsisten;
- debit dan credit harus balance;
- transaction/posting date harus sesuai period;
- period harus terbuka;
- idempotency key mencegah duplicate posting;
- journal posted dapat di-reverse melalui journal baru;
- journal posted tidak diedit untuk koreksi.

Historical reconstruction wajib menggunakan mekanisme ini, bukan direct model write.

### 5.9 Accounting period

Period bersifat bulanan dengan status open/closed. Posting ke period tertutup saat ini ditolak oleh `AccountingPeriodService.ensureOpen`.

Versi pertama historical reconstruction hanya boleh memproses period yang open. Reconstruct closed period memerlukan keputusan produk dan permission tambahan.

### 5.10 Reconstruction saat ini

Service reconstruction yang ada saat ini masih terbatas pada:

- owner-only;
- preview satu order;
- reconstruction satu order selesai;
- confirmation eksplisit;
- source event reconstruction;
- idempotency terpisah dari order operasional.

Belum tersedia:

- reconstruction purchase history;
- reconstruction packaging purchase history;
- reconstruction packaging consumption batch;
- reconstruction settlement batch;
- reconstruction event staging;
- progress batch;
- reversal satu batch;
- historical costing as-of date;
- dedicated UI dan menu.

---

## 6. Model Accounting yang Diinginkan

### 6.1 Pembelian barang dagangan

Jika barang diterima dan langsung dibayar:

```text
Debit   Persediaan Barang Dagang       1310
Credit  Bank/Kas                       11xx
```

Jika dibeli secara kredit:

```text
Debit   Persediaan Barang Dagang       1310
Credit  Utang Usaha                    2100
```

Saat hutang dibayar:

```text
Debit   Utang Usaha                    2100
Credit  Bank/Kas                       11xx
```

Jika payment status tidak diketahui, sistem tidak boleh memilih Bank atau Utang Usaha secara diam-diam. Event harus berstatus unresolved atau user harus memberikan keputusan eksplisit.

### 6.2 Penjualan barang dagangan

Pengakuan penjualan:

```text
Debit   Piutang Marketplace            121x
Credit  Penjualan                      4100
```

Pengakuan HPP:

```text
Debit   HPP Barang Dagang              5100
Credit  Persediaan Barang Dagang       1310
```

Kedua event harus dapat ditelusuri ke order yang sama, tetapi boleh menghasilkan journal entry terpisah jika service accounting memisahkannya.

### 6.3 Pembelian bahan packing

Jika bahan packing dilacak quantity dan value:

```text
Debit   Persediaan Bahan Packing       1320
Credit  Bank/Kas atau Utang             11xx/2100
```

Pembelian tidak langsung menjadi expense.

### 6.4 Pemakaian bahan packing

Jika bahan packing dipakai untuk fulfillment order:

```text
Debit   HPP Bahan Packing               5200
Credit  Persediaan Bahan Packing       1320
```

Jika bahan packing memang tidak dilacak sebagai inventory dan langsung dibebankan:

```text
Debit   Beban Bahan Packing Langsung    6100
Credit  Bank/Kas atau Utang              11xx/2100
```

Satu material atau kebijakan inventory tidak boleh dicampur tanpa aturan yang jelas. Jika material sudah diposting sebagai inventory, pemakaiannya harus mengurangi inventory.

### 6.5 Marketplace settlement

Settlement harus dipisahkan berdasarkan event ekonomi:

1. order selesai membuat piutang marketplace;
2. funds released memindahkan piutang ke saldo marketplace atau akun intermediary sesuai policy;
3. fee settlement dicatat ke akun fee;
4. payout received memindahkan saldo marketplace ke bank.

Pending marketplace fund tetap diperlakukan sebagai piutang jika order tidak batal dan belum memiliki `released_funds_at` serta `released_funds`.

### 6.6 Return dan refund

Return/refund harus menghasilkan correcting events, bukan mengubah order atau journal historis.

Jika barang dikembalikan dan layak masuk inventory:

```text
Debit   Persediaan Barang Dagang       1310
Credit  HPP Barang Dagang              5100
```

Jika barang rusak atau tidak dapat dijual, gunakan damage/loss/adjustment sesuai kebijakan dan audit trail.

Jika revenue perlu dibalik:

```text
Debit   Retur Penjualan atau Revenue Adjustment
Credit  Piutang Marketplace / Settlement Account
```

Detail retur harus disesuaikan dengan data source marketplace yang tersedia.

---

## 7. Inventory Costing

### 7.1 Kebijakan versi pertama

Versi pertama menggunakan **moving weighted-average cost** karena struktur inventory movement yang ada sudah mengarah ke perhitungan nilai rata-rata dari inventory balance.

FIFO dan LIFO tidak menjadi pilihan pada historical reconstruction versi pertama. Dukungan costing method yang configurable dapat direncanakan kemudian.

### 7.2 Mengapa order `product_cost` bukan sumber utama

`product_cost` pada order dapat:

- kosong;
- berasal dari enrichment yang berbeda;
- tidak menyimpan layer pembelian;
- tidak mencerminkan retur, perubahan cost, atau adjustment inventory.

Karena itu HPP utama harus dihitung dari purchase/opening movement historis yang sudah diposting secara kronologis. `product_cost` dapat digunakan sebagai:

- data pembanding;
- warning discrepancy;
- fallback manual yang harus dikonfirmasi user;

tetapi tidak boleh diam-diam mengalahkan inventory ledger.

### 7.3 Persyaratan costing historis

Costing engine harus:

- menghitung saldo sebelum event berdasarkan `occurred_at`;
- tidak memakai movement masa depan untuk menghitung HPP masa lalu;
- memproses purchase sebelum sale jika tanggal sama;
- menyimpan unit cost dan total cost pada movement sale/consumption;
- menangani rounding IDR secara konsisten;
- menyimpan residual rounding bila diperlukan;
- menolak atau menandai negative inventory;
- menghasilkan nilai inventory dan HPP yang dapat direkonsiliasi per tanggal.

Implementasi saat ini menghitung posted balance dari seluruh movement posted berdasarkan item dan location, tanpa filter tanggal. Ini belum aman untuk historical backfill jika semua movement sudah tersedia sebelum proses costing. Historical reconstruction harus memperbaiki atau membungkus perilaku ini dengan as-of chronological costing engine.

### 7.4 Negative inventory

Jika order terjadi sebelum purchase atau jumlah sale lebih besar daripada stok, sistem harus:

- memblokir event secara default;
- menampilkan item, tanggal, quantity, dan shortage;
- menyediakan pilihan corrective opening/adjustment yang eksplisit;
- mencatat bahwa cost tersebut merupakan adjustment atau estimasi;
- tidak membuat HPP dengan nilai nol secara diam-diam.

Negative inventory hanya boleh diproses melalui policy yang disetujui dan audit trail terpisah.

---

## 8. Inventory Movement: Perilaku dan Lifecycle

### 8.1 Fungsi inventory movement

Inventory movement bukan sekadar log perubahan quantity. Movement menjadi sumber subledger untuk:

- jumlah stok;
- nilai inventory;
- perhitungan HPP;
- hubungan ke journal;
- traceability ke order, purchase, opening balance, atau adjustment.

Balance inventory dihitung sebagai kumpulan movement yang sudah posted:

```text
Quantity balance = total inbound quantity - total outbound quantity
Value balance    = total inbound value - total outbound value
```

Movement harus memiliki quantity positif. Arah perubahan ditentukan oleh `movement_type`.

### 8.2 Tipe movement

| Movement | Arah | Fungsi |
|---|---:|---|
| `purchase` | inbound | Barang atau packing diterima dari supplier |
| `sale` | outbound | Barang dagangan keluar karena order |
| `consumption` | outbound | Bahan packing dipakai |
| `return` | inbound/outbound policy | Barang retur masuk atau retur ke supplier |
| `damage` | outbound | Barang rusak |
| `loss` | outbound | Barang hilang |
| `adjustment` | inbound/outbound policy | Koreksi hasil stock opname |
| `transfer_in` | inbound | Pindah ke location |
| `transfer_out` | outbound | Pindah dari location |
| `opening_balance` | inbound | Stok sebelum ledger berjalan |

Pada implementasi sekarang, posting penuh baru tersedia untuk purchase, sale, consumption, dan opening balance. Historical reconstruction harus memperluas dukungan movement type yang dibutuhkan sebelum melakukan backfill yang memiliki return, damage, loss, atau adjustment.

### 8.3 Lifecycle movement

```text
draft → posted
draft → voided
posted → tidak diedit
posted → dikoreksi dengan reversal/adjustment movement
```

Movement `posted` harus memiliki referensi journal entry jika movement tersebut berdampak pada accounting.

### 8.4 Purchase movement

Contoh purchase 10 unit dengan unit cost Rp20.000:

```text
quantity   = 10
unit_cost  = 20.000
total_cost = 200.000
```

Movement menghasilkan:

```text
Debit   Persediaan Barang/Packing     200.000
Credit  Bank atau Utang                200.000
```

Purchase harus memiliki total cost positif dan `unit_cost × quantity = total_cost`.

### 8.5 Sale movement

Sale movement dibuat dari order selesai untuk inventory item merchandise. Movement mengurangi quantity dan value inventory, kemudian membuat HPP:

```text
Debit   HPP Barang Dagang              resolved cost
Credit  Persediaan Barang Dagang       resolved cost
```

Harga jual tidak disimpan sebagai biaya inventory. Harga jual berada pada order/revenue journal.

### 8.6 Consumption movement

Consumption saat ini hanya mendukung item dengan `item_type = packaging`. Movement mengurangi stock packaging dan membuat:

```text
Debit   HPP Bahan Packing               resolved cost
Credit  Persediaan Bahan Packing       resolved cost
```

Historical reconstruction harus dapat menghubungkan consumption ke order atau fulfillment batch jika source data tersedia.

### 8.7 Source reference dan idempotency

Setiap movement hasil reconstruction wajib memiliki:

- `source_type`;
- `source_id`;
- `source_event` pada journal;
- `idempotency_key`;
- `reference` yang dapat dibaca user;
- `reconstruction_batch_id` pada metadata atau relasi event.

Contoh idempotency key:

```text
reconstruction:{batchId}:purchase:{sourceRecordId}:line:{lineIndex}
reconstruction:{batchId}:order:{orderId}:sale:{lineIndex}
reconstruction:{batchId}:order:{orderId}:packaging:{lineIndex}
```

Rerun tidak boleh menghasilkan movement atau journal duplikat.

---

## 9. Data Input dan Normalisasi

### 9.1 Orders

Minimum field:

- organization/store;
- platform;
- external order ID;
- order status;
- order/completed date;
- line SKU atau product/variant reference;
- quantity;
- returned/final quantity;
- sales amount;
- fee data jika tersedia;
- released funds dan date jika tersedia;
- settlement reference jika tersedia.

Blocker:

- order tidak memiliki tanggal yang dapat dipercaya;
- order tidak memiliki product/SKU yang dapat dimapping;
- order status tidak jelas;
- order sudah pernah diposting dengan source yang sama tetapi reference berbeda;
- order memiliki quantity atau nominal yang tidak valid.

### 9.2 Purchase barang dagangan

Minimum field:

- purchase/received date;
- SKU atau inventory item;
- quantity;
- unit cost atau total cost;
- supplier atau reference;
- payment status;
- payment date/account jika tersedia;
- invoice/reference number;
- source file dan source row.

### 9.3 Purchase bahan packing

Field sama dengan purchase barang dagangan, tetapi item harus dipetakan ke inventory item dengan `item_type = packaging`.

Jika material tidak ingin dilacak sebagai inventory, user harus memilih kebijakan direct expense sebelum posting. Pilihan tersebut harus disimpan pada event dan tidak boleh berubah diam-diam saat retry.

### 9.4 Packaging consumption

Untuk HPP packaging historis, minimum field:

- tanggal konsumsi;
- packaging item/SKU;
- quantity;
- unit cost jika source memiliki biaya eksplisit;
- order/fulfillment batch jika tersedia;
- location;
- source file dan source row.

Jika hanya tersedia purchase history tanpa consumption history, sistem tidak boleh mengarang konsumsi historis. User harus memilih salah satu:

- HPP packaging historis tidak direkonstruksi;
- seluruh packaging yang dibeli dianggap direct expense, jika memang kebijakan bisnisnya demikian;
- masukkan estimated consumption dengan label `estimated` dan approval eksplisit;
- gunakan stock opname pada history start, bukan reconstruction konsumsi.

### 9.5 Settlement dan payout

Minimum field:

- order/platform/store;
- settlement reference;
- settlement date;
- stage;
- gross amount;
- fee amount dan fee lines;
- net amount;
- destination account;
- source file/source row.

### 9.6 Supplier payment dan liability

Jika history mencakup pembayaran hutang, minimum field:

- payment date;
- supplier/counterparty;
- invoice/reference;
- amount;
- payment account;
- payable account;
- source file/source row.

Jika tidak ada data payment, purchase tetap boleh diimpor sebagai event tetapi tidak boleh otomatis diposting tanpa kebijakan payment status.

---

## 10. Staging dan Collection Baru

### 10.1 Alasan collection baru diperlukan

`InventoryMovement` adalah hasil accounting inventory, bukan tempat ideal untuk menyimpan:

- satu invoice dengan banyak line;
- supplier;
- payment status;
- source file row;
- mapping resolution;
- validation errors;
- batch progress;
- hubungan antara raw import dan beberapa journal.

Karena itu historical reconstruction membutuhkan staging layer. Staging tidak menggantikan journal dan tidak menjadi ledger kedua.

### 10.2 `AccountingReconstructionBatch`

Collection yang diusulkan:

```ts
{
  organization,
  batch_number,
  title,
  history_start_date,
  history_end_date,
  accounting_timezone,
  status,
  mode: 'full_historical_backfill',
  source_files: [],
  included_sources: [
    'orders',
    'merchandise_purchases',
    'packaging_purchases',
    'packaging_consumptions',
    'settlements',
    'payments',
    'expenses'
  ],
  costing_method: 'moving_weighted_average',
  created_by,
  approved_by,
  started_at,
  completed_at,
  summary,
  error_summary,
  reversal_status,
  created_at,
  updated_at
}
```

Batch status yang diusulkan:

```text
draft
validating
ready
running
completed
completed_with_warnings
blocked
failed
reversing
reversed
```

### 10.3 `AccountingReconstructionEvent`

Collection staging event yang diusulkan:

```ts
{
  organization,
  batch,
  event_type,
  occurred_at,
  effective_period,
  source_type,
  source_file,
  source_row_number,
  source_external_id,
  source_hash,
  raw_payload,
  normalized_payload,
  mapping_status,
  validation_status,
  posting_status,
  blockers: [],
  warnings: [],
  inventory_item_ids: [],
  journal_entry_ids: [],
  inventory_movement_ids: [],
  settlement_ids: [],
  idempotency_key,
  posted_at,
  reversed_at,
  created_at,
  updated_at
}
```

`raw_payload` harus dibatasi dan tidak boleh menyimpan data sensitif yang tidak diperlukan. Source file dan row reference harus tetap dapat membuka asal data.

### 10.4 Alternatif purchase domain model

Jika nanti aplikasi membutuhkan purchase management operasional, `InventoryPurchase` dapat dibuat sebagai domain model permanen yang memiliki header dan lines. Untuk versi historical reconstruction, staging event cukup digunakan terlebih dahulu agar tidak membuat purchase module penuh sebelum kebutuhan UX-nya jelas.

---

## 11. Processing Pipeline

### 11.1 Tahap A — Tentukan history boundary

User memilih:

- `history_start_date`;
- `history_end_date` atau sampai tanggal terakhir data;
- timezone accounting;
- apakah period historis sudah pernah ditutup;
- opening state sebelum history dimulai.

Jika terdapat aset atau hutang sebelum `history_start_date`, buat opening balance pada tanggal sebelum event pertama. Jangan memasukkan current stock sebagai opening balance jika purchase dan sale history akan direkonstruksi sampai sekarang.

### 11.2 Tahap B — Upload dan register source

User mengunggah atau memilih file sumber. Sistem menyimpan:

- file reference;
- checksum;
- platform/source type;
- upload actor;
- upload time;
- date range yang terdeteksi;
- jumlah row;
- parser version.

File yang sama tidak boleh membuat duplicate source event.

### 11.3 Tahap C — Normalize dan deduplicate

Sistem menormalisasi:

- tanggal dan timezone;
- nominal IDR;
- decimal/rounding;
- SKU;
- platform;
- status;
- external ID;
- supplier;
- payment status;
- source row.

Deduplication menggunakan kombinasi:

- source file checksum;
- source row atau external ID;
- platform/source type;
- source hash;
- organization.

Duplicate harus masuk warning/blocker, bukan diposting dua kali.

### 11.4 Tahap D — Master mapping

User menyelesaikan mapping untuk:

- product/variant → merchandise inventory item;
- packaging SKU → packaging inventory item;
- SKU lama → SKU baru jika ada perubahan;
- inventory location;
- store;
- platform;
- supplier/counterparty;
- payment account;
- payable account;
- inventory account;
- COGS account;
- revenue account;
- marketplace receivable account;
- settlement destination account;
- fee accounts.

Mapping tidak boleh hanya berdasarkan nama jika ada SKU atau external ID yang lebih kuat.

### 11.5 Tahap E — Validate tanpa posting

Preview harus menghitung:

- jumlah source event;
- jumlah event valid;
- jumlah blocker;
- jumlah warning;
- nominal purchase;
- nominal revenue;
- nominal settlement;
- estimasi HPP;
- estimasi packaging cost;
- inventory quantity/value akhir;
- outstanding payable;
- pending marketplace receivable;
- duplicate candidate;
- negative inventory candidate;
- closed period candidate.

Preview tidak boleh membuat journal posted. Jika preview membuat draft teknis, draft tersebut harus terhubung ke batch dan tidak boleh tampil sebagai saldo accounting sampai posting dikonfirmasi.

### 11.6 Tahap F — Chronological event scheduling

Posting dilakukan berdasarkan `occurred_at` dan precedence event.

Urutan default jika tanggal sama:

1. opening/initial state;
2. purchase receipt;
3. order completion/sale;
4. return atau adjustment yang tanggalnya jelas;
5. packaging consumption;
6. marketplace funds released;
7. payout received;
8. supplier/payment event.

Jika source memiliki timestamp yang lebih detail, timestamp source menjadi prioritas. Jika hanya ada tanggal tanpa waktu, precedence digunakan secara deterministik dan ditampilkan pada preview.

### 11.7 Tahap G — Post dalam batch

Setiap event diproses melalui service domain:

- purchase → `InventoryMovementService.purchase` atau service historical equivalent;
- sale → order accounting integration/historical equivalent;
- packaging consumption → `consumePackaging` atau historical equivalent;
- settlement → `MarketplaceSettlementService`;
- expense/payment → `ExpenseService` atau journal service;
- opening → `OpeningBalanceService`/cutover mechanism.

Setiap chunk harus:

- idempotent;
- memiliki audit log;
- menggunakan Mongo session/transaction jika deployment mendukung;
- aman terhadap retry;
- menyimpan error per event;
- tidak menyatakan batch complete jika ada event wajib yang belum posted.

### 11.8 Tahap H — Reconciliation

Batch hanya dapat berstatus `completed` atau `completed_with_warnings` setelah sistem menghitung:

- source count vs posted count;
- source total vs journal total;
- inventory quantity/value per item dan location;
- revenue vs order totals;
- HPP vs inventory reduction;
- packaging purchases vs consumption vs ending stock;
- marketplace receivable vs released funds vs payout;
- supplier payable vs payment;
- debit vs credit trial balance.

---

## 12. UI dan Navigation

### 12.1 Menu

Tambahkan menu khusus di Accounting:

```text
Accounting
├── Overview
├── Chart of Accounts
├── Journal
├── Reports
└── Historical Reconstruction
```

Menu `Historical Reconstruction` hanya tampil jika user memiliki permission view/create atau merupakan owner pada policy sementara.

### 12.2 Page utama

Route yang diusulkan:

```text
/dashboard/accounting/reconstruction
```

Halaman utama menampilkan:

- batch terakhir;
- status;
- history range;
- jumlah event;
- jumlah posted;
- jumlah blocker;
- jumlah warning;
- total revenue;
- total HPP;
- ending inventory;
- action `Create reconstruction`;
- action `View detail`;
- action `Resume validation`;
- action `Reverse batch` jika diizinkan.

### 12.3 Create reconstruction flow

#### Step 1 — Tujuan dan period

- jelaskan bahwa proses akan membuat accounting history;
- pilih history start date;
- pilih end date;
- tampilkan timezone;
- tampilkan apakah period tersedia dan open;
- tampilkan warning jika onboarding opening balance sudah mencakup current stock.

#### Step 2 — Source data

- pilih existing orders;
- upload purchase barang dagangan;
- upload purchase bahan packing;
- upload packaging consumption jika tersedia;
- pilih released funds/settlement data;
- pilih expenses/payments jika tersedia.

#### Step 3 — Column mapping

- mapping otomatis berdasarkan header;
- preview sample rows;
- user dapat memperbaiki mapping;
- simpan mapping template per source/provider;
- tampilkan field wajib dan optional.

#### Step 4 — Master mapping

- unresolved product/SKU;
- unresolved packaging item;
- ambiguous product match;
- location;
- supplier;
- payment account;
- payable account;
- CoA mapping.

#### Step 5 — Accounting policy

- costing method: moving weighted average pada versi pertama;
- inventory policy per item;
- packaging tracked inventory atau direct expense;
- payment status unknown handling;
- negative inventory handling;
- settlement policy.

#### Step 6 — Preview

Tampilkan:

- summary nominal;
- preview journal;
- preview inventory movements;
- preview ending inventory;
- preview HPP;
- blockers;
- warnings;
- duplicate rows;
- negative inventory;
- event yang memakai estimated value.

#### Step 7 — Approval dan posting

- user wajib mengonfirmasi;
- tampilkan actor dan timestamp;
- minta confirmation phrase atau explicit confirmation;
- proses dijalankan sebagai batch;
- user dapat meninggalkan halaman tanpa menghentikan batch;
- progress dapat dipantau.

#### Step 8 — Results dan reconciliation

- posted events;
- blocked events;
- failed events;
- warnings;
- journal links;
- movement links;
- settlement links;
- download reconciliation report;
- action retry unresolved events;
- action reverse batch jika permission tersedia.

### 12.4 Detail batch

Detail batch harus memiliki tab:

- Summary;
- Source files;
- Events;
- Inventory impact;
- Journal impact;
- Reconciliation;
- Errors and warnings;
- Audit trail.

Setiap event dapat dibuka untuk melihat raw row, normalized data, mapping, blockers, journal, dan movement yang dihasilkan.

---

## 13. Permission, Audit, dan Safety

### 13.1 Permission rules

| Action | Default owner | Permission khusus |
|---|---:|---|
| Melihat batch | Ya | `reconstruction.view` |
| Membuat batch | Ya | `reconstruction.create` |
| Menjalankan validation | Ya | `reconstruction.validate` |
| Mem-post batch | Ya | `reconstruction.post` |
| Membalik batch | Ya/terbatas | `reconstruction.reverse` |
| Memproses closed period | Tidak | `reconstruction.closed_period` |

Permission harus diperiksa di server, bukan hanya menyembunyikan menu UI.

### 13.2 Audit events

Audit harus mencatat minimal:

- batch dibuat;
- source file ditambahkan;
- mapping diubah;
- validation dijalankan;
- batch disetujui;
- posting dimulai;
- event posted/blocked/failed;
- batch selesai;
- batch reversal dimulai/selesai;
- permission actor;
- error dan warning override.

### 13.3 Append-only correction

Reversal batch harus menghasilkan transaksi reversal, bukan menghapus hasil batch. Reversal harus menyimpan:

- original batch;
- original journal IDs;
- original movement IDs;
- reversal journal IDs;
- actor;
- reason;
- timestamp.

Jika sebagian batch sudah posted, reversal harus dapat menangani partial batch dengan jelas dan tidak menganggap event gagal sebagai posted.

---

## 14. Validasi dan Blocker

### 14.1 Blocker wajib

- source row tidak memiliki tanggal;
- source row memiliki nominal invalid;
- SKU tidak dapat dimapping;
- inventory item tidak aktif atau tipe salah;
- location tidak ditemukan;
- account tidak valid/postable;
- payment status wajib tetapi tidak diketahui;
- order tidak selesai atau status tidak dapat ditentukan;
- duplicate source event;
- negative inventory tanpa approval policy;
- journal tidak balance;
- period tidak tersedia atau sudah closed;
- settlement tidak dapat dicocokkan;
- event sudah posted dengan conflicting idempotency reference.

### 14.2 Warning

- timestamp hanya berupa tanggal;
- product cost pada order berbeda dari inventory cost;
- source row menggunakan SKU legacy;
- fee line tidak lengkap tetapi total fee tersedia;
- packaging consumption tidak memiliki order reference;
- nominal menggunakan estimated value yang sudah disetujui;
- settlement memiliki selisih kecil akibat rounding.

Warning tidak boleh disembunyikan dari hasil akhir batch.

---

## 15. Laporan yang Harus Tersedia

Setelah reconstruction selesai, sistem harus dapat menyediakan:

### 15.1 Profit and Loss

- revenue per bulan;
- revenue per platform/store;
- marketplace fees;
- HPP barang dagangan;
- HPP bahan packing;
- operating expenses;
- gross profit;
- gross margin;
- net profit jika expense history tersedia.

### 15.2 Inventory

- quantity dan value per item;
- quantity dan value per location;
- purchases;
- sales;
- consumption;
- return;
- damage/loss/adjustment;
- ending inventory per tanggal;
- inventory valuation discrepancy.

### 15.3 General ledger

- journal entry;
- source document;
- reconstruction batch;
- account;
- debit/credit;
- transaction date;
- posting date;
- period;
- reversal relationship.

### 15.4 Reconciliation

- source totals;
- posted totals;
- unresolved totals;
- duplicate totals;
- blocked totals;
- estimated totals;
- balance difference.

---

## 16. Hubungan dengan Onboarding

Full historical reconstruction memiliki aturan penting:

1. `history_start_date` harus ditentukan sebelum posting historis.
2. Opening balance onboarding hanya boleh mewakili kondisi sebelum history dimulai.
3. Current inventory tidak boleh dimasukkan sebagai opening balance jika seluruh purchase dan order history akan direkonstruksi sampai sekarang.
4. Jika onboarding sudah membuat opening inventory current stock, reconstruction harus diblokir sampai ada reversal/correction yang sah.
5. Reconstruction tetap dijalankan melalui halaman khusus setelah accounting active, kecuali nanti dibuat bootstrap workflow khusus.
6. Accounting onboarding tidak boleh otomatis membuat historical journal.

Untuk implementasi saat ini, pendekatan yang disarankan:

- accounting onboarding menentukan timezone, CoA, location, mapping, dan history boundary;
- accounting diaktifkan dengan opening state sebelum history dimulai;
- historical reconstruction dijalankan dari halaman khusus;
- report kemudian membaca journal dan subledger hasil backfill.

---

## 17. Acceptance Criteria

### 17.1 Batch dan permission

- User tanpa permission tidak dapat membuka atau menjalankan reconstruction.
- Owner dapat membuat batch.
- Batch memiliki history range dan source files.
- Batch tidak dapat diposting sebelum validation selesai.
- Batch yang sama dapat di-resume tanpa duplicate.

### 17.2 Journal integrity

- Semua journal posted balance.
- Semua account valid dan postable.
- Period dan date sesuai.
- Journal posted tidak dapat diedit atau dihapus.
- Correction hanya melalui reversal/correcting entry.
- Semua journal memiliki source reference dan audit trail.

### 17.3 Inventory integrity

- Purchase menambah quantity/value inventory.
- Sale mengurangi merchandise inventory dan menghasilkan HPP.
- Packaging consumption mengurangi packaging inventory dan menghasilkan packaging cost.
- HPP tidak menggunakan movement masa depan.
- Negative inventory menjadi blocker atau explicit approved exception.
- Ending inventory dapat dihitung kembali dari movement.

### 17.4 Historical P&L

- Revenue berasal dari order source.
- HPP barang berasal dari inventory cost history.
- Packaging cost terpisah dari merchandise HPP.
- Marketplace fee tidak mengurangi revenue secara diam-diam tanpa journal fee.
- Settlement tidak menggandakan revenue.
- Laporan dapat difilter per bulan sejak history start date.

### 17.5 Reconciliation

- Source row dapat ditelusuri ke event.
- Event dapat ditelusuri ke journal/movement.
- Total source dan total posted dapat dibandingkan.
- Semua blocker dan warning terlihat.
- Batch completion menyimpan summary dan reconciliation result.

---

## 18. Candidate Implementation Phases

Bagian ini bukan implementation plan final, tetapi urutan kerja yang disarankan.

### Phase A — Finalize accounting policy

- tetapkan history start date;
- tetapkan weighted-average costing;
- tetapkan policy packaging;
- tetapkan payment status unknown;
- tetapkan negative inventory;
- tetapkan settlement staging;
- tetapkan permission model.

### Phase B — Staging dan batch model

- `AccountingReconstructionBatch`;
- `AccountingReconstructionEvent`;
- source file/checksum;
- event status;
- idempotency;
- audit.

### Phase C — Historical inventory costing

- as-of balance;
- chronological event processor;
- weighted-average costing;
- rounding;
- negative inventory blocker;
- movement source linkage.

### Phase D — Merchandise purchase reconstruction

- purchase normalization;
- supplier/payment status;
- bank/AP mapping;
- purchase movement dan journal;
- payment event jika tersedia.

### Phase E — Order and HPP reconstruction

- batch order selection;
- product/SKU mapping;
- sale movement;
- revenue/receivable journal;
- merchandise HPP;
- return/refund handling.

### Phase F — Packaging reconstruction

- packaging purchase;
- packaging item mapping;
- consumption import;
- per-order atau batch linkage;
- packaging HPP/direct expense policy.

### Phase G — Settlement dan fee reconstruction

- funds released;
- payout received;
- fee lines;
- marketplace receivable;
- reconciliation.

### Phase H — UI khusus

- menu;
- batch list;
- create flow;
- mapping screens;
- preview;
- progress;
- detail and reconciliation;
- reverse flow.

### Phase I — Reports and hardening

- historical P&L;
- HPP reports;
- inventory valuation;
- trial balance;
- integration tests;
- transaction/retry tests;
- production observability.

---

## 19. Open Questions

Sebelum implementation plan final dibuat, keputusan berikut perlu dikonfirmasi:

1. Tanggal paling awal history yang tersedia sebenarnya kapan?
2. Apakah purchase date sama dengan goods-received date?
3. Apakah payment status purchase tersedia lengkap?
4. Apakah ada history packaging consumption, atau hanya history pembelian?
5. Apakah history returns/refunds tersedia?
6. Apakah semua order memiliki SKU/variant yang dapat dimapping?
7. Apakah semua marketplace settlement dapat dicocokkan ke order?
8. Apakah ada stock atau hutang sebelum history start date?
9. Apakah ada expense history lain di luar purchase dan packing?
10. Apakah period historis akan dibuat dan tetap open selama backfill?
11. Apakah weighted-average cukup untuk versi pertama?
12. Apakah estimated event boleh diposting setelah approval, atau harus selalu menjadi blocker?

---

## 20. Prinsip Akhir

Historical reconstruction harus diperlakukan sebagai **controlled accounting backfill**, bukan sebagai fitur edit journal.

Prinsip wajibnya:

```text
Import source data
        ↓
Normalize dan map
        ↓
Preview dan reconcile
        ↓
Permission + explicit approval
        ↓
Chronological posting
        ↓
Append-only journal dan inventory movement
        ↓
Reconciliation dan audit trail
```

Jika data sumber tidak cukup untuk menghasilkan angka yang benar, sistem harus menampilkan blocker atau estimated value secara eksplisit. Sistem tidak boleh menciptakan angka yang terlihat rapi tetapi tidak dapat dipertanggungjawabkan.
