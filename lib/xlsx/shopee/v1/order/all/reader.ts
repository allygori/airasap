import * as xlsx from 'xlsx';

export default function reader(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  // All order Excel usually has a sheet named 'orders' or 'Sheet1' or 'Laporan Pesanan'
  const sheetName =
    workbook.SheetNames.find(
      (n) =>
        n.toLowerCase().includes('order') ||
        n.toLowerCase().includes('pesanan') ||
        n === 'Sheet1'
    ) || workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      'Format tidak sesuai: Sheet "Laporan Semua Pesanan" tidak ditemukan.'
    );
  }

  const orderRows = xlsx.utils.sheet_to_json<unknown[]>(
    workbook.Sheets[sheetName],
    { header: 1 }
  );

  return {
    sheetName,
    totalRows: orderRows.length,
    rows: orderRows,
  };
}
