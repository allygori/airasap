export type RawOrderRow = {
  orderId: string;
  status: string;
  productName: string;
  sku: string;
  parentSku: string;
  variationName: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  completedAt: Date | null;
};

export type ParsedOrderCompleted = {
  orderId: string;
  status: string;
  username: string;
  createdAt: Date | null;
  paidAt: Date | null;
  completedAt: Date | null;
  totalPayment: number;
  items: {
    productName: string;
    sku: string;
    variationName: string;
    originalPrice: number;
    discountedPrice: number;
    quantity: number;
  }[];
};
