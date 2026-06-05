export type RawIncomeData = {
  summary_rows?: unknown[][];
  seller_fee_rows?: unknown[][];
  income_rows?: unknown[][];
};

export type WorksheetInfo = {
  name: string;
  total_rows: number;
};

export type WorksheetsMap = {
  summary?: WorksheetInfo;
  income?: WorksheetInfo;
  seller_fee?: WorksheetInfo;
};

export type ReaderResult = {
  worksheets: WorksheetsMap;
  raw_data: RawIncomeData;
};

export type OrderDiffItemIncome = {
  id: string;
  username: string;
  createdAt: Date;
  releasedAt?: Date;
  income: number;
  originalPrice: number;
};

export type OrderDiffItemOrder = {
  id: string;
  username: string;
  status: string;
  createdAt: Date | null;
  paidAt: Date | null;
  completedAt: Date | null;
  totalPayment: number;
  itemCount: number;
  quantity: number;
  productNames: string[];
};

export type OrderDiff = {
  income_only: OrderDiffItemIncome[];
  order_only: OrderDiffItemOrder[];
};

export type ParserResult = {
  summary: any[];
  income: any;
  products: {
    id: string;
    name: string;
    variationName: string;
    key: string;
    quantity: number;
    cogs: number;
  }[];
  orderDiff: OrderDiff;
};
