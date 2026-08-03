import {
  stringParser,
  numberParser,
  dateParser,
} from '@/lib/utils/parser';

export type FieldConfig = {
  header: string;
  parser: (val: unknown) => any;
  columnIndex?: number;
};

export const SELLER_FEE_FIELD_MAP = {
  number: {
    header: 'No.',
    parser: numberParser,
  },
  orderId: {
    header: 'No. Pesanan',
    parser: stringParser,
  },
  platformFee: {
    header: 'Biaya Platform',
    parser: numberParser,
  },
  GOXFee: {
    header: 'Biaya Gratis Ongkir XTRA',
    parser: numberParser,
  },
  serviceFee: {
    header: 'Biaya Layanan',
    parser: numberParser,
  },
  promotionFee: {
    header: 'Biaya Promosi',
    parser: numberParser,
  },
  otherFee: {
    header: 'Biaya Lainnya',
    parser: numberParser,
  },
} satisfies Record<string, FieldConfig>;
