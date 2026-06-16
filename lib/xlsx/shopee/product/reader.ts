import * as xlsx from 'xlsx';

export default function reader(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  // Products Excel usually has a sheet named 'produk' or 'products' 'Sheet1' or
  const sheetName =
    workbook.SheetNames.find(
      (n) =>
        n.toLowerCase().includes('produk') ||
        n.toLowerCase().includes('products') ||
        n === 'Sheet1'
    ) || workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      'Format tidak sesuai: Sheet Produk tidak ditemukan.'
    );
  }

  const data = xlsx.utils.sheet_to_json<unknown[]>(
    workbook.Sheets[sheetName],
    { header: 1 }
  );

  if (!Array.isArray(data) || data.length < 7) {
    throw new Error(
      'Format Excel tidak valid atau data kosong.'
    );
  }

  return {
    sheetName,
    totalRows: data.length,
    rows: data,
  };
}
