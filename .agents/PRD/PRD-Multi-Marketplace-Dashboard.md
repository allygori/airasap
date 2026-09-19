# Product Requirements Document (PRD)
## Multi-Marketplace Sales, Inventory & Accounting Dashboard

**Version:** 1.0  
**Date:** 2026-09-19  
**Tech Stack:** Next.js (App Router) + MongoDB + Mongoose  
**Target Users:** Seller yang berjualan di multiple marketplace (Shopee, Tokopedia, dll)

---

## 1. Overview & Goal

Membangun dashboard internal untuk seller multi-channel yang mengintegrasikan:

- **Sales / Order Management** (dari Shopee, Tokopedia, dan channel lain)
- **Inventory Management** (multi-location, reservation, stock movement)
- **Accounting** (auto journal dari event operasional)

### Masalah yang Diselesaikan
Saat ini data order & produk diimpor manual via Excel dari dashboard marketplace. Tidak ada integrasi antara penjualan, stok, dan pembukuan. Risiko overselling, stok tidak akurat, dan laporan laba yang tidak tepat.

### Tujuan Utama
Menciptakan **Single Source of Truth** untuk produk, stok, order, dan keuangan, sehingga operasional multi-channel berjalan akurat dan terintegrasi.

---

## 2. Tech Stack & Architecture Principles

- **Frontend + Backend:** Next.js (App Router)
- **Database:** MongoDB + Mongoose
- **Approach:** NoSQL-friendly design (embed ketika tightly coupled, reference ketika shared/high-volume)

### Prinsip Desain Data
| Kondisi | Keputusan |
|---------|-----------|
| Data selalu diakses bersama parent | Embed (array of object) |
| Data high volume / sering di-query independen | Collection terpisah |
| Master data yang dipakai di banyak tempat | Collection terpisah |
| Data shared & perlu konsistensi | Collection terpisah + reference |

---

## 3. Scope

### In Scope (MVP + Near-term)
- Master Product + Variant (SKU internal)
- Multi-channel product mapping
- Inventory dengan On Hand / Reserved / Available
- Stock Movement (history wajib)
- Purchase Order + Goods Receipt
- Order Management (multi-channel)
- Shipment
- Basic Accounting (Chart of Accounts + Journal Entry)
- Document sequence (penomoran otomatis)
- Manual import Excel (sementara) + struktur siap untuk API nanti

### Out of Scope (untuk fase selanjutnya)
- Real-time API integration ke Shopee/Tokopedia (struktur disiapkan)
- Multi-warehouse advanced transfer
- Full tax engine
- Customer-facing features
- Mobile app

---

## 4. Core Collections (MongoDB)

### 4.1 Master Data

#### `products`
- Master produk.
- **Rekomendasi:** Embed `variants[]` jika jumlah variant per produk biasanya < 20.  
  Jika variant banyak → buat collection `product_variants` terpisah.

**Field penting (contoh):**
- name, description, categoryId, brand, images, isActive
- variants[] (jika di-embed): sku, name, attributes, price, cost, dll.

#### `product_variants` (opsional / alternatif)
- Digunakan jika variant dikelola terpisah.
- Setiap document = 1 SKU yang punya stok.

#### `suppliers`
- Master supplier.
- Field: name, contact, address, paymentTerms, isActive, dll.

#### `sales_channels`
- Master channel penjualan (Shopee, Tokopedia, Website, Offline, dll).
- Saat ini boleh masih memakai TypeScript constant.
- Pindah ke collection ketika butuh menyimpan config (shopId, credentials, fee structure, isActive, dll).

**Contoh field:**
- code (unique: "shopee", "tokopedia")
- name
- type ("marketplace" | "website" | "offline")
- isActive
- config (object)

#### `channel_product_mappings`
- Mapping SKU internal ↔ SKU di masing-masing channel.
- Sangat penting untuk multi-channel.

**Field penting:**
- variantId (ref)
- channelId atau channelCode
- channelSku
- channelProductId
- channelVariantId (opsional)
- isActive
- lastSyncedAt

#### `inventory_locations`
- Lokasi stok (Warehouse, Area, Rak, Logical location, Virtual).
- Bisa memiliki hierarki (parentLocationId).

**Field penting:**
- name, code, type ("warehouse" | "rack" | "logical" | "virtual")
- parentLocationId (opsional)
- isActive

#### `users`
- User sistem + role (untuk audit & authentication).

---

### 4.2 Inventory

#### `stocks`
- Saldo stok terkini per **Variant + Location**.
- Satu document = kombinasi variantId + locationId.

**Field wajib:**
- variantId
- locationId
- onHand (number)
- reserved (number)
- available (number) → biasanya dihitung: onHand - reserved (bisa disimpan atau virtual)
- averageCost (atau field terkait valuation)
- updatedAt

#### `stock_movements`
- **Jantung sistem inventory**. Setiap perubahan stok wajib melalui collection ini.
- Jangan pernah update `stocks` tanpa mencatat movement.

**Field penting:**
- variantId
- locationId
- type: "purchase_receipt" | "sales_reserve" | "sales_ship" | "sales_cancel" | "sales_return" | "adjustment" | "transfer_in" | "transfer_out"
- quantity (bisa positif/negatif tergantung konvensi, atau selalu positif + direction)
- referenceType ("order" | "purchase_order" | "goods_receipt" | "adjustment" | dll)
- referenceId
- cost (opsional, untuk valuation)
- notes
- createdBy
- createdAt

#### `stock_adjustments` (disarankan)
- Header penyesuaian stok (stock opname / koreksi).
- Embed `items[]`.

#### `stock_transfers` (disarankan)
- Header transfer antar lokasi.
- Embed `items[]`.

---

### 4.3 Purchasing

#### `purchase_orders`
- Header PO.
- **Embed** `items[]`.

**Field penting:**
- poNumber (dari document_sequences)
- supplierId
- status: "draft" | "ordered" | "partial" | "received" | "cancelled"
- orderDate, expectedDate
- items[]: variantId, qty, unitCost, receivedQty, dll.
- totalAmount
- notes
- createdBy

#### `goods_receipts`
- Penerimaan barang dari supplier.
- **Embed** `items[]`.
- Saat di-confirm → create stock_movements (type: purchase_receipt) + update stocks.onHand.

**Field penting:**
- grNumber
- purchaseOrderId (opsional)
- supplierId
- receiptDate
- status
- items[]: variantId, locationId, qty, unitCost
- createdBy

---

### 4.4 Sales / Order Management

#### `orders`
- Header order dari semua channel.
- **Embed** `items[]` dan `statusHistory[]`.

**Field penting:**
- orderNumber (internal)
- channelId / channelCode
- channelOrderId (ID asli dari Shopee/Tokopedia)
- status: "unpaid" | "paid" | "processing" | "shipped" | "delivered" | "completed" | "cancelled" | "returned"
- customer (object sederhana: name, phone, address) — karena mayoritas marketplace
- items[]: variantId, channelSku, qty, price, discount, reserved (boolean)
- statusHistory[]: { status, at, note }
- shipping (object: courier, trackingNumber, shippedAt, dll)
- financials: subtotal, shippingFee, discount, total, marketplaceFee (estimasi)
- timestamps (orderedAt, paidAt, shippedAt, completedAt)
- rawData (opsional: data mentah dari Excel/API)

#### `shipments` (disarankan collection terpisah)
- Jika 1 order bisa punya multiple shipment atau tracking kompleks.
- Bisa juga di-embed di orders jika sederhana.

#### `return_orders`
- Retur dari buyer.
- Embed `items[]`.
- Mempengaruhi stok (kembali ke onHand jika barang layak) + accounting.

---

### 4.5 Accounting

#### `chart_of_accounts`
- Daftar akun.
- Field: code, name, type ("asset" | "liability" | "equity" | "revenue" | "expense" | "cogs"), parentId, isActive

#### `journal_entries`
- Header jurnal.
- **Embed** `lines[]` (JournalEntryLine).

**Field penting:**
- journalNumber
- date
- referenceType + referenceId (order, settlement, goods_receipt, dll)
- description
- lines[]: accountId, debit, credit, memo
- createdBy
- status ("draft" | "posted")

#### `marketplace_settlements`
- Mencatat pencairan dana dari marketplace ke seller.

**Fungsi utama:**
- Reconciliation order vs dana yang diterima
- Trigger jurnal (Piutang → Saldo Marketplace / Kas)
- Tracking fee yang dipotong marketplace
- Audit

**Field penting:**
- channelId / channelCode
- settlementId (dari marketplace)
- settlementDate
- grossAmount
- totalFees
- netAmount
- fees[]: { type, amount }
- orderIds[] (order yang termasuk dalam settlement ini)
- status
- rawData (opsional)

#### `fiscal_periods` (opsional, fase lanjut)
- Periode akuntansi untuk tutup buku.

---

### 4.6 Supporting

#### `document_sequences`
- Mengelola penomoran dokumen secara atomic dan sequential.

**Contoh document:**
```js
{
  _id: "purchase_order",          // key unik per jenis dokumen
  prefix: "PO",
  year: 2026,                     // opsional
  currentNumber: 142,
  padding: 4,
  updatedAt: ISODate("...")
}
```

Digunakan untuk: PO, Goods Receipt, Order internal, Journal Entry, dll.

#### Lainnya (opsional)
- `audit_logs`
- `attachments` (simpan URL atau pakai GridFS)

---

## 5. Key Business Flows

### 5.1 Order Lifecycle (Shopee-style) & Inventory Impact

| Event | Inventory Action | Accounting Impact (fase lanjut) |
|-------|------------------|---------------------------------|
| Order Created (unpaid) | +Reserved, Available turun | - |
| Order Cancelled / Expired | -Reserved, Available naik | - |
| Order Paid | Status update saja | - |
| Order Shipped | -On Hand, -Reserved | COGS + kurangi Persediaan; catat Piutang/Pendapatan |
| Order Delivered + H+2 (Settlement) | Tidak ada | Piutang → Saldo Marketplace |
| Order Returned (barang kembali) | +On Hand (jika layak) | Reverse COGS & Pendapatan (sesuai kebijakan) |

### 5.2 Purchasing Flow
1. Buat Purchase Order (status: draft → ordered)
2. Goods Receipt → create `stock_movements` (purchase_receipt) → `stocks.onHand` naik + catat cost
3. (Opsional) Purchase Invoice + payment ke supplier

### 5.3 Multi-Channel Stock
- **Shared Inventory** (disarankan di awal): satu pool stok untuk semua channel.
- Available = On Hand − Reserved
- Reservation dilakukan saat order dibuat (meski belum bayar) untuk mencegah overselling.
- Update stok harus atomic (`findOneAndUpdate` dengan kondisi stok cukup).

### 5.4 Settlement Flow
- Marketplace melepaskan dana → catat di `marketplace_settlements`
- Sistem membuat Journal Entry otomatis
- Seller kemudian withdraw ke bank (bisa dicatat terpisah nanti)

---

## 6. Functional Requirements (Ringkas)

### Product & Channel
- CRUD Product + Variant
- Mapping SKU internal ke multiple channel
- Import produk dari Excel (sementara)

### Inventory
- Lihat saldo stok per lokasi (On Hand, Reserved, Available)
- History stock movement
- Stock adjustment
- Stock transfer antar lokasi (fase 2)
- Alert stok menipis

### Purchasing
- CRUD Purchase Order
- Goods Receipt (partial receipt didukung)
- Auto update stok + movement saat receipt di-confirm

### Sales / Order
- Import order dari Excel (Shopee/Tokopedia format)
- Lihat & filter order multi-channel
- Update status order (dengan impact ke inventory)
- Input resi pengiriman
- Handle cancel & return

### Accounting
- Chart of Accounts
- Auto-generate Journal Entry dari event kunci (Goods Receipt, Order Shipped, Settlement)
- Lihat jurnal & laporan dasar (Trial Balance, simple P&L)

### System
- Document numbering otomatis & atomic
- Basic authentication & role
- Audit trail untuk perubahan penting

---

## 7. Non-Functional Requirements

- Semua perubahan stok harus **atomic** dan tercatat di `stock_movements`.
- Hindari overselling dengan reservation + conditional update.
- Data model harus siap untuk migrasi dari Excel import → API marketplace di masa depan.
- Soft delete / isActive pattern untuk master data.
- Index penting: variantId + locationId pada stocks, channelOrderId, referenceId pada movements, dll.

---

## 8. Phased Implementation Recommendation

### Phase 1 – Foundation (Core Inventory + Master)
- products / product_variants
- suppliers
- inventory_locations
- stocks + stock_movements
- purchase_orders + goods_receipts
- document_sequences
- Basic UI untuk master data & inventory

### Phase 2 – Sales Integration
- sales_channels (atau constant dulu)
- channel_product_mappings
- orders (dengan embed items + statusHistory)
- Import Excel order
- Reservation & ship flow terintegrasi inventory

### Phase 3 – Accounting
- chart_of_accounts
- journal_entries (lines embedded)
- marketplace_settlements
- Auto journal rules dari event operasional
- Laporan dasar

### Phase 4 – Advanced
- Real API integration marketplace
- Stock transfer & multi-location advanced
- Return flow lengkap
- Reconciliation tools
- Dashboard analytics

---

## 9. Catatan Penting untuk AI Coding Assistant

1. **Stock Movement adalah wajib.** Jangan update field `onHand` / `reserved` secara langsung tanpa membuat record di `stock_movements`.
2. Gunakan **embedded document** untuk: Order items, Journal lines, PO items, Goods Receipt items, statusHistory.
3. Gunakan **separate collection** untuk: stocks, stock_movements, products/variants, suppliers, channel mappings, settlements.
4. Identifier channel yang stabil: pakai `code` ("shopee", "tokopedia") meskipun masih constant.
5. Siapkan field `rawData` di orders & settlements untuk menyimpan payload asli dari Excel/API.
6. Semua quantity & money gunakan Number (atau Decimal128 jika butuh presisi tinggi).
7. Timestamp penting: createdAt, updatedAt, serta event-specific (paidAt, shippedAt, dll).
8. Prioritaskan data integrity (atomic update stok) daripada fitur UI yang berlebihan di awal.

---

## 10. Glossary

| Istilah | Arti |
|---------|------|
| On Hand | Stok fisik di lokasi |
| Reserved | Stok yang sudah dialokasikan ke order (belum tentu terkirim) |
| Available | On Hand − Reserved (bisa dijual) |
| Stock Movement | Catatan setiap perubahan stok |
| Channel Product Mapping | Hubungan SKU internal dengan SKU di marketplace |
| Settlement | Pencairan dana dari marketplace ke seller setelah order selesai |
| Goods Receipt | Penerimaan barang dari supplier |

---

**End of PRD**
