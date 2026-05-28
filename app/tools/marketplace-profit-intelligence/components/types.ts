export type SummaryItem = {
  name: string;
  value: number;
  subItems?: SummaryItem[];
};

export type ProfitProduct = {
  id: string;
  name: string;
  quantity: number;
  cogs?: number;
};

export type ProfitOrderItem = {
  productId?: string;
  name?: string;
  variationName?: string;
  quantity?: number;
  originalPrice?: number;
  discountedPrice?: number;
};

export type ProfitOrder = {
  id: string;
  username?: string;
  createdAt?: string | Date;
  releasedAt?: string | Date;
  completedAt?: string | Date;
  paymentMethod?: string;
  logisticService?: string;
  income?: number;
  profit?: number;
  originalPrice?: number;
  totalDiscount?: number;
  fees?: {
    admin?: number;
    service?: number;
    transaction?: number;
    process?: number;
    campaign?: number;
  };
  items?: ProfitOrderItem[];
};

export type SourceFile = {
  file_type:
    | 'income'
    | 'order'
    | 'ads'
    | 'affiliate'
    | 'other';
  original_name: string;
  mime_type?: string;
  size?: number;
  checksum?: string;
  storage_provider?: string;
  storage_path?: string;
};

export type ProfitReportData = {
  _id?: string;
  sid?: string;
  period: {
    from: Date | string;
    to: Date | string;
  };
  summary?: {
    released_amount?: number;
    total_income?: number;
  };
  extra?: {
    summary_data?: SummaryItem[];
  };
  source_files: SourceFile[];
  products: ProfitProduct[];
  orders?: ProfitOrder[];
};
