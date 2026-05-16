import mongoose, { Schema, Document } from 'mongoose';

export interface IShopeeReport extends Document {
  email?: string;
  grossSales: number;
  totalDiscount: number;
  fees: {
    administrasi: number;
    layanan: number;
    transaksi: number;
    prosesPesanan: number;
    kampanye: number;
    ongkirDibayarPenjual: number;
    lainnya: number;
  };
  netPayout: number;
  products: {
    id: string;
    name: string;
    quantity: number;
    hpp: number;
  }[];
  summaryData?: any;
  rawJson?: any;
  createdAt: Date;
}

const ShopeeReportSchema = new Schema<IShopeeReport>({
  email: { type: String, required: false },
  grossSales: { type: Number, required: true },
  totalDiscount: { type: Number, required: true },
  fees: {
    administrasi: { type: Number, required: true, default: 0 },
    layanan: { type: Number, required: true, default: 0 },
    transaksi: { type: Number, required: true, default: 0 },
    prosesPesanan: { type: Number, required: true, default: 0 },
    kampanye: { type: Number, required: true, default: 0 },
    ongkirDibayarPenjual: { type: Number, required: true, default: 0 },
    lainnya: { type: Number, required: true, default: 0 },
  },
  netPayout: { type: Number, required: true },
  products: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    hpp: { type: Number, required: true, default: 0 },
  }],
  summaryData: { type: Schema.Types.Mixed, required: false },
  rawJson: { type: Schema.Types.Mixed, required: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ShopeeReport || mongoose.model<IShopeeReport>('ShopeeReport', ShopeeReportSchema);
