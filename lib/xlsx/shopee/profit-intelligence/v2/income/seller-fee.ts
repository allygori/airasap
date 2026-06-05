const HEADER_DETECTION_KEY = 'Nama Produk';

export default function parseSellerFeeSheet(
  feeData: unknown[][]
) {
  const productsMap = new Map<
    string,
    {
      id: string;
      name: string;
      quantity: number;
      cogs: number;
    }
  >();
  const orders = new Map<string, any[]>();

  let feeHeaderRowIndex = -1;
  for (let i = 0; i < 5; i++) {
    if (
      feeData[i] &&
      feeData[i].includes(HEADER_DETECTION_KEY)
    ) {
      feeHeaderRowIndex = i;
      break;
    }
  }

  if (feeHeaderRowIndex !== -1) {
    const feeHeaders = feeData[
      feeHeaderRowIndex
    ] as string[];
    const idxOrderId = feeHeaders.findIndex(
      (h) => h === 'No. Pesanan'
    );
    const idxProductId = feeHeaders.findIndex(
      (h) => h === 'ID Produk'
    );
    const idxProductName = feeHeaders.findIndex(
      (h) => h === 'Nama Produk'
    );
    const idxProcessingFee = feeHeaders.findIndex(
      (h) => h === 'Biaya Proses Pesanan'
    );

    const feeRows = feeData.slice(feeHeaderRowIndex + 1);

    for (const row of feeRows) {
      const orderId = String(row[idxOrderId] || '');
      const productId = String(row[idxProductId] || '');
      const productName = String(row[idxProductName] || '');
      const processingFee = row[idxProcessingFee];

      if (
        orderId &&
        productId &&
        productId !== '-' &&
        productName &&
        productName !== '-'
      ) {
        if (orders.has(orderId)) {
          orders.get(orderId)?.push({
            id: orderId,
            productId,
            productName,
            processingFee: Number(processingFee),
          });
        } else {
          orders.set(orderId, [
            {
              id: orderId,
              productId,
              productName,
              processingFee: Number(processingFee),
            },
          ]);

          productsMap.set(productId, {
            id: productId,
            name: productName,
            quantity: 0,
            cogs: 0,
          });
        }
      }
    }
  }

  return {
    orders: Object.fromEntries(orders),
    products: Array.from(productsMap.values()),
  };
}
