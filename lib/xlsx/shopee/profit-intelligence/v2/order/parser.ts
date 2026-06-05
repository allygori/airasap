import { getColIdx } from '../utils';
import { ORDER_FIELD_MAP, ITEM_FIELD_MAP } from './map';

const HEADER_DETECTION_KEY = 'No. Pesanan';

export default function parser(
  rows: unknown[][]
): Map<string, any> {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i] && rows[i].includes(HEADER_DETECTION_KEY)) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      'Format tidak sesuai: Kolom No. Pesanan tidak ditemukan di Laporan Pesanan.'
    );
  }

  const headers = rows[headerRowIndex].map((h) =>
    String(h).trim()
  );
  const dataRows = rows
    .slice(headerRowIndex + 1)
    .filter((r) => r && r.length > 0 && r[0]);

  // Resolve indices dynamically
  const orderIndices: Record<string, number> = {};
  for (const [key, config] of Object.entries(
    ORDER_FIELD_MAP
  )) {
    orderIndices[key] = getColIdx(headers, config.header);
  }

  const itemIndices: Record<string, number> = {};
  for (const [key, config] of Object.entries(
    ITEM_FIELD_MAP
  )) {
    itemIndices[key] = getColIdx(headers, config.header);
  }

  const ordersMap = new Map<string, any>();

  for (const row of dataRows) {
    const orderIdIdx = orderIndices['order_id'];
    const orderId =
      orderIdIdx !== -1
        ? String(row[orderIdIdx] || '').trim()
        : '';
    if (!orderId) continue;

    // Parse order-level properties
    if (!ordersMap.has(orderId)) {
      const orderData: Record<string, any> = { items: [] };
      for (const [key, config] of Object.entries(
        ORDER_FIELD_MAP
      )) {
        const idx = orderIndices[key];
        const rawValue = idx !== -1 ? row[idx] : undefined;
        orderData[key] = config.parser(rawValue);
      }

      // Structure nested address fields
      orderData.address = {
        street: orderData.address_street,
        city: orderData.address_city,
        province: orderData.address_province,
      };
      delete orderData.address_street;
      delete orderData.address_city;
      delete orderData.address_province;

      ordersMap.set(orderId, orderData);
    }

    // Parse item-level properties
    const itemData: Record<string, any> = {};
    let hasValidItem = false;
    for (const [key, config] of Object.entries(
      ITEM_FIELD_MAP
    )) {
      const idx = itemIndices[key];
      const rawValue = idx !== -1 ? row[idx] : undefined;
      const parsedValue = config.parser(rawValue);
      itemData[key] = parsedValue;
      if (key === 'product_name' && parsedValue) {
        hasValidItem = true;
      }
    }

    if (hasValidItem) {
      ordersMap.get(orderId).items.push(itemData);
    }
  }

  return ordersMap;
}
