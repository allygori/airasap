export function parseIncomeSheet(incomeData: any[][]) {
  let incomeHeaderRowIndex = -1;
  for (let i = 0; i < 10; i++) {
    if (incomeData[i] && incomeData[i].includes('No. Pesanan')) {
      incomeHeaderRowIndex = i;
      break;
    }
  }

  if (incomeHeaderRowIndex === -1) {
    throw new Error('Kolom No. Pesanan tidak ditemukan di Laporan Penghasilan.');
  }

  const incomeHeaders = incomeData[incomeHeaderRowIndex];
  const incomeRows = incomeData.slice(incomeHeaderRowIndex + 1).filter(r => r && r.length > 0 && r[0]);

  const getColIdx = (name: string) => incomeHeaders.findIndex((h: string) => h === name);

  const idxHargaAsli = getColIdx('Harga Asli Produk');
  const idxTotalDiskon = getColIdx('Total Diskon Produk');
  const idxAdmin = getColIdx('Biaya Administrasi');
  const idxLayanan = getColIdx('Biaya Layanan');
  const idxProses = getColIdx('Biaya Proses Pesanan');
  const idxTransaksi = getColIdx('Biaya Transaksi');
  const idxKampanye = getColIdx('Biaya Kampanye');
  const idxTotalPenghasilan = getColIdx('Total Penghasilan');

  let grossSales = 0;
  let totalDiscount = 0;
  let netPayout = 0;
  const fees = { administrasi: 0, layanan: 0, transaksi: 0, prosesPesanan: 0, kampanye: 0, ongkirDibayarPenjual: 0, lainnya: 0 };

  incomeRows.forEach(row => {
    grossSales += Number(row[idxHargaAsli]) || 0;
    totalDiscount += Number(row[idxTotalDiskon]) || 0;
    netPayout += Number(row[idxTotalPenghasilan]) || 0;

    fees.administrasi += Math.abs(Number(row[idxAdmin]) || 0);
    fees.layanan += Math.abs(Number(row[idxLayanan]) || 0);
    fees.transaksi += Math.abs(Number(row[idxTransaksi]) || 0);
    fees.prosesPesanan += Math.abs(Number(row[idxProses]) || 0);
    fees.kampanye += Math.abs(Number(row[idxKampanye]) || 0);
  });

  return {
    grossSales,
    totalDiscount,
    netPayout,
    fees,
    headers: incomeHeaders,
    sampleRows: incomeRows.slice(0, 5)
  };
}

export function parseSellerFeeSheet(feeData: any[][]) {
  const productsMap = new Map<string, any>();

  let feeHeaderRowIndex = -1;
  for (let i = 0; i < 5; i++) {
    if (feeData[i] && feeData[i].includes('Nama Produk')) {
      feeHeaderRowIndex = i;
      break;
    }
  }

  if (feeHeaderRowIndex !== -1) {
    const feeHeaders = feeData[feeHeaderRowIndex];
    const idxProductId = feeHeaders.findIndex((h: string) => h === 'ID Produk');
    const idxProductName = feeHeaders.findIndex((h: string) => h === 'Nama Produk');

    const feeRows = feeData.slice(feeHeaderRowIndex + 1);
    feeRows.forEach(row => {
      const pId = row[idxProductId];
      const pName = row[idxProductName];
      if (pId && pName && pId !== '-' && pName !== '-') {
        const strId = String(pId);
        if (productsMap.has(strId)) {
          productsMap.get(strId)!.quantity += 1;
        } else {
          productsMap.set(strId, { id: strId, name: pName, quantity: 1, hpp: 0 });
        }
      }
    });
  }

  return Array.from(productsMap.values());
}

export function parseSummarySheet(sData: any[][]) {
  const summaryData: any[] = [];
  let inSummarySection = false;
  let currentGroup: any = null;

  for (let i = 0; i < sData.length; i++) {
    const row = sData[i];
    if (!row || row.length === 0) continue;

    if (row[0] && typeof row[0] === 'string' && (row[0].includes('Ringkasan Penghasilan') || row[0].includes('1. Total Pendapatan'))) {
      inSummarySection = true;
      if (row[0].includes('1. Total Pendapatan')) {
        const val = row[row.length - 1];
        currentGroup = { name: row[0], value: typeof val === 'number' ? val : 0, subItems: [] };
        summaryData.push(currentGroup);
      }
      continue;
    }

    if (!inSummarySection) continue;

    if (row[0] && typeof row[0] === 'string' && row[0].includes('Nilai Lainnya')) {
      break;
    }

    const firstCol = row[0];
    const secondCol = row[1];
    const lastCol = row[row.length - 1];
    const value = typeof lastCol === 'number' ? lastCol : 0;

    if (firstCol && typeof firstCol === 'string' && firstCol.trim() !== '') {
      currentGroup = { name: firstCol, value: value, subItems: [] };
      summaryData.push(currentGroup);
    } else if (secondCol && typeof secondCol === 'string' && secondCol.trim() !== '' && currentGroup) {
      currentGroup.subItems.push({ name: secondCol, value: value });
    }
  }

  return summaryData;
}

export default function parser(rawData: any) {
  const income = parseIncomeSheet(rawData.income_rows || []);
  const products = parseSellerFeeSheet(rawData.seller_fee_rows || []);
  const summary = parseSummarySheet(rawData.summary_rows || []);

  return { income, products, summary };
}