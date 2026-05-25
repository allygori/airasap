export type OrderItem = {
  productId: string;
  name: string;
  variationName: string;
  quantity: number;
  originalPrice: number;
  discountedPrice: number;
}

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
    }
  ];
  sellerCoFundVouchers?: [
    {
      code?: string;
      value?: number;
    }
  ];
  adminFee: number;
  serviceFee: number;
  transactionFee: number;
  processFee: number;
  campaignFee: number;
  income: number;
  logisticService: string;
  items?: OrderItem[];
}

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
  headers: string[];
  sampleRows: unknown[][];
}

export type ParsedProduct = {
  id: string;
  name: string;
  quantity: number;
  hpp: number;
}

export type SummaryGroup = {
  name: string;
  value: number;
  subItems: { name: string; value: number }[];
}
