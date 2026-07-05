import { getColIdx } from '../../utils';
import {
  SELLER_FEE_FIELD_MAP,
  type FieldConfig,
  type SellerFeeFieldKey,
} from '../map';

const HEADER_DETECTION_KEY = 'Nama Produk';

type ParsedSellerFeeRow = Record<
  SellerFeeFieldKey,
  ReturnType<
    (typeof SELLER_FEE_FIELD_MAP)[SellerFeeFieldKey]['parser']
  >
>;

export default function parseSellerFeeSheet(
  feeData: unknown[][]
): ParsedSellerFeeRow[] {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(feeData.length, 10); i++) {
    if (
      feeData[i] &&
      feeData[i].includes(HEADER_DETECTION_KEY)
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      'Kolom Nama Produk tidak ditemukan di Seller Fee.'
    );
  }

  const headers = feeData[headerRowIndex].map((header) =>
    String(header).trim()
  );
  const indices = {} as Record<SellerFeeFieldKey, number>;

  for (const [key, config] of Object.entries(
    SELLER_FEE_FIELD_MAP
  ) as [SellerFeeFieldKey, FieldConfig][]) {
    const colIdx =
      config.columnIndex ??
      getColIdx(headers, config.header || '');
    indices[key] = colIdx;

    if (colIdx === -1) {
      console.warn(
        `${config.header} tidak ditemukan di Seller Fee.`
      );
    }
  }

  const noOrderIdx = indices.noOrder;
  return feeData
    .slice(headerRowIndex + 1)
    .filter((row) => {
      if (!row || row.length === 0) return false;
      if (noOrderIdx === -1) return true;
      return String(row[noOrderIdx] ?? '').trim() !== '';
    })
    .map((row) => {
      const sellerFeeRow = {} as ParsedSellerFeeRow;
      for (const [key, config] of Object.entries(
        SELLER_FEE_FIELD_MAP
      ) as [SellerFeeFieldKey, FieldConfig][]) {
        const idx = indices[key];
        const rawValue = idx !== -1 ? row[idx] : undefined;
        sellerFeeRow[key] = config.parser(rawValue);
      }
      return sellerFeeRow;
    });
}
