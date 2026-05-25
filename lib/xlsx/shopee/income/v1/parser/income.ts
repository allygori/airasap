import { Order } from "../types";
import { getColIdx } from "../utils";

const HEADER_DETECTION_KEY = "No. Pesanan";

export default function parseIncomeSheet(incomeData: any[][]) {
  let incomeHeaderRowIndex = -1;
  for (let i = 0; i < 10; i++) {
    if (incomeData[i] && incomeData[i].includes(HEADER_DETECTION_KEY)) {
      incomeHeaderRowIndex = i;
      break;
    }
  }

  if (incomeHeaderRowIndex === -1) {
    throw new Error('Kolom No. Pesanan tidak ditemukan di Laporan Penghasilan.');
  }

  const incomeHeaders = incomeData[incomeHeaderRowIndex];
  const incomeRows = incomeData.slice(incomeHeaderRowIndex + 1).filter(r => r && r.length > 0 && r[0]);


  const idxNumber = getColIdx(incomeHeaders, 'No.');
  const idxOrderId = getColIdx(incomeHeaders, 'No. Pesanan');
  const idxUsername = getColIdx(incomeHeaders, 'Username (Pembeli)');
  const idxOrderCreatedAt = getColIdx(incomeHeaders, 'Waktu Pesanan Dibuat');
  const idxPaymentMethod = getColIdx(incomeHeaders, 'Metode pembayaran pembeli');
  const idxOriginalPrice = getColIdx(incomeHeaders, 'Harga Asli Produk');
  const idxTotalDiscount = getColIdx(incomeHeaders, 'Total Diskon Produk');
  const idxSellerVoucher = getColIdx(incomeHeaders, 'Voucher disponsor oleh Penjual');
  const idxVoucherCode = getColIdx(incomeHeaders, 'Kode Voucher');
  const idxSellerCoFundVoucher = getColIdx(incomeHeaders, 'Voucher co-fund disponsor oleh Penjual');
  const idxLogisticService = getColIdx(incomeHeaders, 'Nama Kurir');
  const idxAdminFee = getColIdx(incomeHeaders, 'Biaya Administrasi');
  const idxProgramFee = getColIdx(incomeHeaders, 'Biaya Layanan');
  const idxProcessFee = getColIdx(incomeHeaders, 'Biaya Proses Pesanan');
  const idxTransactionFee = getColIdx(incomeHeaders, 'Biaya Transaksi');
  const idxCampaignFee = getColIdx(incomeHeaders, 'Biaya Kampanye');
  const idxTotalIncome = getColIdx(incomeHeaders, 'Total Penghasilan');

  let grossSales = 0;
  let totalDiscount = 0;
  let netPayout = 0;
  const fees = { administrasi: 0, layanan: 0, transaksi: 0, prosesPesanan: 0, kampanye: 0, ongkirDibayarPenjual: 0, lainnya: 0 };
  const orders: Order[] = [];

  incomeRows.forEach(row => {
    grossSales += Number(row[idxOriginalPrice]) || 0;
    totalDiscount += Number(row[idxTotalDiscount]) || 0;
    netPayout += Number(row[idxTotalIncome]) || 0;

    fees.administrasi += Math.abs(Number(row[idxAdminFee]) || 0);
    fees.layanan += Math.abs(Number(row[idxProgramFee]) || 0);
    fees.transaksi += Math.abs(Number(row[idxTransactionFee]) || 0);
    fees.prosesPesanan += Math.abs(Number(row[idxProcessFee]) || 0);
    fees.kampanye += Math.abs(Number(row[idxCampaignFee]) || 0);

    orders.push({
      number: Number(row[idxNumber]),
      id: row[idxOrderId],
      username: row[idxUsername],
      createdAt: new Date(row[idxOrderCreatedAt]),
      paymentMethod: row[idxPaymentMethod],
      originalPrice: Number(row[idxOriginalPrice]),
      totalDiscount: Number(row[idxTotalDiscount]),
      sellerVouchers: [
        { code: row[idxVoucherCode], value: Number(row[idxSellerVoucher]) }
      ],
      adminFee: Number(row[idxAdminFee]),
      processFee: Number(row[idxProcessFee]),
      income: Number(row[idxTotalIncome]),
      logisticService: row[idxLogisticService]
    })
  });

  return {
    grossSales,
    totalDiscount,
    netPayout,
    fees,
    orders,
    // headers: incomeHeaders,
    // sampleRows: incomeRows.slice(0, 5)
  };
}