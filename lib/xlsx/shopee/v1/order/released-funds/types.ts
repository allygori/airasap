import {
  INCOME_FIELD_MAP,
  SELLER_FEE_FIELD_MAP,
} from './map';

export type OrderItem = {
  productId: string;
  name: string;
  variationName: string;
  quantity: number;
  originalPrice: number;
  discountedPrice: number;
};

export type Order = {
  number: number;
  id: string;
  username: string;
  createdAt: Date;
  releasedAt?: Date;
  completedAt?: Date | null;
  paymentMethod: string;
  originalPrice: number;
  totalDiscount: number;
  sellerVouchers?: [
    {
      code?: string;
      value?: number;
    },
  ];
  sellerCoFundVouchers?: [
    {
      code?: string;
      value?: number;
    },
  ];
  adminFee: number;
  serviceFee: number;
  transactionFee: number;
  processFee: number;
  campaignFee: number;
  income: number;
  logisticService: string;
  items?: OrderItem[];
};

export type ParsedIncome = {
  grossSales: number;
  totalDiscount: number;
  netPayout: number;
  fees: {
    administrasi: number;
    layanan: number;
    transaksi: number;
    prosesPesanan: number;
    kampanye: number;
    ongkirDibayarPenjual: number;
    lainnya: number;
  };
  orders: Order[];
  headers?: string[];
  sampleRows?: unknown[][];
};

export type ParsedProduct = {
  id: string;
  name: string;
  quantity: number;
  hpp: number;
};

export type SummaryGroup = {
  name: string;
  value: number;
  subItems: { name: string; value: number }[];
};

// export type OrderFieldKey = keyof typeof ORDER_FIELD_MAP;

// export type ParsedOrderRow = Record<
//   OrderFieldKey,
//   ReturnType<
//     (typeof ORDER_FIELD_MAP)[OrderFieldKey]['parser']
//   >
// >;

export type IncomeFieldKey = keyof typeof INCOME_FIELD_MAP;
export type ParsedIncomeRow = Record<
  IncomeFieldKey,
  ReturnType<
    (typeof INCOME_FIELD_MAP)[IncomeFieldKey]['parser']
  >
>;
export type SellerFeeFieldKey =
  keyof typeof SELLER_FEE_FIELD_MAP;
export type ParsedSellerFeeRow = Record<
  SellerFeeFieldKey,
  ReturnType<
    (typeof SELLER_FEE_FIELD_MAP)[SellerFeeFieldKey]['parser']
  >
>;
