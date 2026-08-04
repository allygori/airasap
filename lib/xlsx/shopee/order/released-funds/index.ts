import * as xlsx from 'xlsx';
import releasedFundsV1Parser from '@/lib/xlsx/shopee/v1/order/released-funds';
import releasedFundsV2parser from '@/lib/xlsx/shopee/v2/order/released-funds';

export const getReleasedFundsVersion = (
  arrayBuffer: ArrayBuffer
) => {
  const buffer = Buffer.from(arrayBuffer);
  const workbook = xlsx.read(buffer, { type: 'buffer' });

  const sheetNameV1 = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes('income')
  );

  if (sheetNameV1) {
    return 1;
  }

  const sheetNameV2 = workbook.SheetNames.find((n) =>
    n.toLowerCase().includes('penghasilan')
  );

  if (sheetNameV2) {
    return 2;
  }

  return -1;
};

export const getReleasedFunds = (
  arrayBuffer: ArrayBuffer
) => {
  const buffer = Buffer.from(arrayBuffer);
  // const workbook = xlsx.read(buffer, { type: 'buffer' });
  const version = getReleasedFundsVersion(arrayBuffer);

  return {
    version,
    parser:
      version === 1
        ? releasedFundsV1Parser
        : releasedFundsV2parser,
    // parser:
    //   version === 1
    //     ? releasedFundsV1Parser
    //     : version === 2
    //       ? releasedFundsV2parser
    //       : null,
  };

  // const sheetNameV1 = workbook.SheetNames.find((n) =>
  //   n.toLowerCase().includes('income')
  // );

  // if (sheetNameV1) {
  //   return releasedFundsV1Parser(arrayBuffer);
  // }

  // const sheetNameV2 = workbook.SheetNames.find((n) =>
  //   n.toLowerCase().includes('penghasilan')
  // );

  // if (sheetNameV2) {
  //   return releasedFundsV2parser(arrayBuffer);
  // }

  // throw new Error(
  //   'Format tidak sesuai: Laporan Dana Dilepas tidak ditemukan.'
  // );
};
