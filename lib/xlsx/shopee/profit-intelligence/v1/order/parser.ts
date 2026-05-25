import { ParsedOrderCompleted } from "./types";
import { getColIdx } from "../income/utils";

const HEADER_DETECTION_KEY = "No. Pesanan";

function parseMoney(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  // Shopee excel values can be strings with dots like "130.000"
  const clean = String(val).replace(/\./g, '').replace(/,/g, '.');
  return parseFloat(clean) || 0;
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (!(val instanceof Date) && typeof val !== 'string' && typeof val !== 'number') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function assertRequiredColumns(headers: string[], columns: string[]) {
  const missingColumns = columns.filter((column) => getColIdx(headers, column) === -1);

  if (missingColumns.length > 0) {
    throw new Error(`Format tidak sesuai: Kolom Download Pesanan Selesai tidak ditemukan: ${missingColumns.join(', ')}.`);
  }
}

export default function parser(rows: unknown[][]): Map<string, ParsedOrderCompleted> {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i] && rows[i].includes(HEADER_DETECTION_KEY)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Format tidak sesuai: Kolom No. Pesanan tidak ditemukan di Laporan Pesanan.');
  }

  const headers = rows[headerRowIndex].map(h => String(h).trim());
  const dataRows = rows.slice(headerRowIndex + 1).filter(r => r && r.length > 0 && r[0]);

  assertRequiredColumns(headers, [
    'No. Pesanan',
    'Status Pesanan',
    'Nama Produk',
    'Jumlah',
    'Waktu Pesanan Dibuat',
    'Waktu Pesanan Selesai'
  ]);

  const idxOrderId = getColIdx(headers, 'No. Pesanan');
  const idxStatus = getColIdx(headers, 'Status Pesanan');
  const idxProductName = getColIdx(headers, 'Nama Produk');
  const idxSku = getColIdx(headers, 'Nomor Referensi SKU');
  const idxParentSku = getColIdx(headers, 'SKU Induk');
  const idxVariation = getColIdx(headers, 'Nama Variasi');
  const idxOriginalPrice = getColIdx(headers, 'Harga Awal');
  const idxDiscountedPrice = getColIdx(headers, 'Harga Setelah Diskon');
  const idxQuantity = getColIdx(headers, 'Jumlah');
  const idxCreatedAt = getColIdx(headers, 'Waktu Pesanan Dibuat');
  const idxPaidAt = getColIdx(headers, 'Waktu Pembayaran Dilakukan');
  const idxUsername = getColIdx(headers, 'Username (Pembeli)');
  const idxTotalPayment = getColIdx(headers, 'Total Pembayaran');
  const idxCompletedAt = getColIdx(headers, 'Waktu Pesanan Selesai');

  const ordersMap = new Map<string, ParsedOrderCompleted>();

  for (const row of dataRows) {
    const orderId = String(row[idxOrderId] || '').trim();
    if (!orderId) continue;

    // Filter out canceled or invalid status if needed, but usually we match Completed orders
    // The sheet lists all orders, but we group them anyway.
    const status = String(row[idxStatus] || '').trim();
    
    // We only process if it is not empty
    const productName = String(row[idxProductName] || '').trim();
    if (!productName) continue;

    const sku = String(row[idxSku] || '').trim();
    const parentSku = String(row[idxParentSku] || '').trim();
    const variationName = String(row[idxVariation] || '').trim();
    
    const originalPrice = parseMoney(row[idxOriginalPrice]);
    const discountedPrice = parseMoney(row[idxDiscountedPrice]);
    const quantity = parseInt(String(row[idxQuantity] || '0'), 10) || 0;
    
    const completedAt = parseDate(row[idxCompletedAt]);

    if (!ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        orderId,
        status,
        username: String(row[idxUsername] || '').trim(),
        createdAt: parseDate(row[idxCreatedAt]),
        paidAt: parseDate(row[idxPaidAt]),
        completedAt,
        totalPayment: parseMoney(row[idxTotalPayment]),
        items: []
      });
    }

    ordersMap.get(orderId)!.items.push({
      productName,
      sku: sku || parentSku || '', // Use SKU or parent SKU as fallback
      variationName,
      originalPrice,
      discountedPrice,
      quantity
    });
  }

  return ordersMap;
}
