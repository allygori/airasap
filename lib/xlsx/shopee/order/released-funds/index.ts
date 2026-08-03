import * as xlsx from 'xlsx';
import releasedFundsV1Parser from '@/lib/xlsx/shopee/v1/order/released-funds';
import releasedFundsV2parser from '@/lib/xlsx/shopee/v2/order/released-funds';

export const releasedFunds = (arrayBuffer: ArrayBuffer) => {
  const buffer = Buffer.from(arrayBuffer);
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  const sheetNameV1 = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes('income')
  );

  if (sheetNameV1) {
    return releasedFundsV1Parser(arrayBuffer);
  }

  const sheetNameV2 = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes('penghasilan')
  );

  if (sheetNameV2) {
    return releasedFundsV2parser(arrayBuffer);
  }

  throw new Error(
    'Format tidak sesuai: Laporan Dana Dilepas tidak ditemukan.'
  );
};
