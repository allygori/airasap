import { getColIdx } from '../utils';
import { INCOME_FIELD_MAP } from './map';

const HEADER_DETECTION_KEY = 'No. Pesanan';

export default function parseIncomeSheet(
  incomeData: unknown[][]
) {
  let incomeHeaderRowIndex = -1;
  for (let i = 0; i < 10; i++) {
    if (
      incomeData[i] &&
      incomeData[i].includes(HEADER_DETECTION_KEY)
    ) {
      incomeHeaderRowIndex = i;
      break;
    }
  }

  if (incomeHeaderRowIndex === -1) {
    throw new Error(
      'Kolom No. Pesanan tidak ditemukan di Laporan Penghasilan.'
    );
  }

  const incomeHeaders = incomeData[
    incomeHeaderRowIndex
  ].map((header) => String(header).trim());
  const incomeRows = incomeData
    .slice(incomeHeaderRowIndex + 1)
    .filter((r) => r && r.length > 0 && r[0]);

  // Resolve indices dynamically
  const indices: Record<string, number> = {};
  for (const [key, config] of Object.entries(
    INCOME_FIELD_MAP
  )) {
    indices[key] = getColIdx(incomeHeaders, config.header);
  }

  let grossSales = 0;
  let totalDiscount = 0;
  let netPayout = 0;
  const fees = {
    administrasi: 0,
    layanan: 0,
    transaksi: 0,
    prosesPesanan: 0,
    kampanye: 0,
    ongkirDibayarPenjual: 0,
    lainnya: 0,
  };
  const orders: any[] = [];

  const idxNumber = getColIdx(incomeHeaders, 'No.');

  incomeRows.forEach((row) => {
    // Parse row using configuration map
    const parsedRow: Record<string, any> = {};
    for (const [key, config] of Object.entries(
      INCOME_FIELD_MAP
    )) {
      const idx = indices[key];
      const rawValue = idx !== -1 ? row[idx] : undefined;
      parsedRow[key] = config.parser(rawValue);
    }

    grossSales += parsedRow.order_subtotal || 0;
    totalDiscount += parsedRow.total_discount || 0;
    netPayout += parsedRow.released_amount || 0;

    fees.administrasi += Math.abs(parsedRow.admin_fee || 0);
    fees.layanan += Math.abs(parsedRow.service_fee || 0);
    fees.transaksi += Math.abs(
      parsedRow.transaction_fee || 0
    );
    fees.prosesPesanan += Math.abs(
      parsedRow.order_process_fee || 0
    );
    fees.kampanye += Math.abs(parsedRow.campaign_fee || 0);

    const rowNum =
      idxNumber !== -1 ? Number(row[idxNumber]) || 0 : 0;

    orders.push({
      number: rowNum,
      id: parsedRow.order_id,
      username: parsedRow.username,
      createdAt: parsedRow.order_created_at,
      releasedAt: parsedRow.order_released_at,
      paymentMethod: parsedRow.payment_method,
      originalPrice: parsedRow.order_subtotal,
      totalDiscount: parsedRow.total_discount,
      sellerVouchers: [
        {
          code: parsedRow.voucher_code,
          value: parsedRow.voucher_value,
        },
      ],
      adminFee: parsedRow.admin_fee || 0,
      serviceFee: parsedRow.service_fee || 0,
      transactionFee: parsedRow.transaction_fee || 0,
      processFee: parsedRow.order_process_fee || 0,
      campaignFee: parsedRow.campaign_fee || 0,
      income: parsedRow.released_amount || 0,
      logisticService: parsedRow.logistic_service,
    });
  });

  return {
    grossSales,
    totalDiscount,
    netPayout,
    fees,
    orders,
  };
}
