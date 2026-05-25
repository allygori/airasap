export type Order = {
  number: number;
  id: string;
  username: string;
  createdAt: Date;
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
  processFee: number;
  income: number;
  logisticService: string;
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
  sampleRows: any[];
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