import * as xlsx from 'xlsx';

export default function reader(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  const summarySheetName = workbook.SheetNames.find(
    (n) =>
      n.toLowerCase().includes('summary') ||
      n.toLowerCase().includes('ringkasan')
  );
  const incomeSheetName = workbook.SheetNames.find(
    (n) =>
      n.toLowerCase().includes('income') ||
      n.toLowerCase().includes('penghasilan')
  );
  const feeSheetName = workbook.SheetNames.find(
    (n) =>
      n.toLowerCase().includes('seller fee') ||
      n.toLowerCase().includes('rincian')
  );

  if (!incomeSheetName) {
    throw new Error(
      'Format tidak sesuai: Sheet Laporan Penghasilan tidak ditemukan.'
    );
  }

  const summaryRows = summarySheetName
    ? xlsx.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[summarySheetName],
        { header: 1 }
      )
    : [];
  const incomeRows = incomeSheetName
    ? xlsx.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[incomeSheetName],
        { header: 1 }
      )
    : [];
  const sellerFeeRows = feeSheetName
    ? xlsx.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[feeSheetName],
        { header: 1 }
      )
    : [];

  return {
    worksheets: {
      summary: summarySheetName
        ? {
            name: summarySheetName,
            total_rows: summaryRows.length,
          }
        : undefined,
      income: incomeSheetName
        ? {
            name: incomeSheetName,
            total_rows: incomeRows.length,
          }
        : undefined,
      seller_fee: feeSheetName
        ? {
            name: feeSheetName,
            total_rows: sellerFeeRows.length,
          }
        : undefined,
    },
    raw_data: {
      summary_rows: summaryRows,
      income_rows: incomeRows,
      seller_fee_rows: sellerFeeRows,
    },
  };
}
