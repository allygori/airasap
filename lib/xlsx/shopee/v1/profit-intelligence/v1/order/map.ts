export const HEADER_MAP: Record<string, string> = {
  noOrder: 'No. Pesanan',
  orderStatus: 'Status Pesanan',
  shippedByAdvanceFulfilment:
    'Shipped by Advance Fulfillment',
  cancellationReturnStatus:
    'Status Pembatalan/ Pengembalian',
  trackingNumber: 'No. Resi',
  shippingOption: 'Opsi Pengiriman',
  dropOffCounterPickUp: 'Antar ke counter/ pick-up',
  orderMustBeShippedBeforeAvoidLateShipment:
    'Pesanan Harus Dikirimkan Sebelum (Menghindari keterlambatan)',
  shippingTimeArranged: 'Waktu Pengiriman Diatur',
  orderCreationTime: 'Waktu Pesanan Dibuat',
  paymentTimeCompleted: 'Waktu Pembayaran Dilakukan',
  paymentMethod: 'Metode Pembayaran',
  parentSku: 'SKU Induk',
  productName: 'Nama Produk',
  skuReferenceNumber: 'Nomor Referensi SKU',
  variationName: 'Nama Variasi',
  originalPrice: 'Harga Awal',
  priceAfterDiscount: 'Harga Setelah Diskon',
  quantity: 'Jumlah',
  returnedQuantity: 'Returned quantity',
  orderSubtotal: 'Subtotal Pesanan',
  totalDiscount: 'Total Diskon',
  discountFromSeller: 'Diskon Dari Penjual',
  discountFromShopee: 'Diskon Dari Shopee',
  productWeight: 'Berat Produk',
  numberOfProductsOrdered: 'Jumlah Produk di Pesan',
  totalWeight: 'Total Berat',
  voucherBorneBySeller: 'Voucher Ditanggung Penjual',
  coinCashback: 'Cashback Koin',
  voucherBorneByShopee: 'Voucher Ditanggung Shopee',
  bundleDeal: 'Paket Diskon',
  bundleDealDiscountFromShopee:
    'Paket Diskon (Diskon dari Shopee)',
  bundleDealDiscountFromSeller:
    'Paket Diskon (Diskon dari Penjual)',
  shopeeCoinOffset: 'Potongan Koin Shopee',
  creditCardDiscount: 'Diskon Kartu Kredit',
  shippingCostPaidByBuyer:
    'Ongkos Kirim Dibayar oleh Pembeli',
  estimatedShippingCostDiscount:
    'Estimasi Potongan Biaya Pengiriman',
  returnShippingFee: 'Ongkos Kirim Pengembalian Barang',
  totalPayment: 'Total Pembayaran',
  estimatedShippingCost: 'Perkiraan Ongkos Kirim',
  buyerNote: 'Catatan dari Pembeli',
  note: 'Catatan',
  buyerUsername: 'Username (Pembeli)',
  receiverName: 'Nama Penerima',
  phoneNumber: 'No. Telepon',
  deliveryAddress: 'Alamat Pengiriman',
  cityRegency: 'Kota/Kabupaten',
  province: 'Provinsi',
  orderCompletionTime: 'Waktu Pesanan Selesai',
};

// Opsional: Membuat Type khusus berbasis Key dari Map di atas
export type OrderHeaderKey = keyof typeof HEADER_MAP;
