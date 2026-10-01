import { toTrimmedString } from '@/lib/string';
import { parseIndonesianNumber } from '@/lib/number';
import { parseExcelDate } from '@/lib/date';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
  columnIndex?: number;
};

export const SELLER_FEE_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: parseIndonesianNumber,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: toTrimmedString,
  },
  platformFee: {
    header: 'Biaya Platform',
    parser: parseIndonesianNumber,
  },
  GOXFee: {
    header: 'Biaya Gratis Ongkir XTRA',
    parser: parseIndonesianNumber,
  },
  serviceFee: {
    header: 'Biaya Layanan',
    parser: parseIndonesianNumber,
  },
  promotionFee: {
    header: 'Biaya Promosi',
    parser: parseIndonesianNumber,
  },
  otherFee: {
    header: 'Biaya Lainnya',
    parser: parseIndonesianNumber,
  },
} satisfies Record<string, FieldConfig>;
