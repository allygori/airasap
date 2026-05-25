// export default function parseSellerFeeSheet(feeData: any[][]) {
//   const productsMap = new Map<string, any>();

//   let feeHeaderRowIndex = -1;
//   for (let i = 0; i < 5; i++) {
//     if (feeData[i] && feeData[i].includes('Nama Produk')) {
//       feeHeaderRowIndex = i;
//       break;
//     }
//   }

//   if (feeHeaderRowIndex !== -1) {
//     const feeHeaders = feeData[feeHeaderRowIndex];
//     const idxProductId = feeHeaders.findIndex((h: string) => h === 'ID Produk');
//     const idxProductName = feeHeaders.findIndex((h: string) => h === 'Nama Produk');

//     const feeRows = feeData.slice(feeHeaderRowIndex + 1);
//     feeRows.forEach(row => {
//       const pId = row[idxProductId];
//       const pName = row[idxProductName];
//       if (pId && pName && pId !== '-' && pName !== '-') {
//         const strId = String(pId);
//         if (productsMap.has(strId)) {
//           productsMap.get(strId)!.quantity += 1;
//         } else {
//           productsMap.set(strId, { id: strId, name: pName, quantity: 1, hpp: 0 });
//         }
//       }
//     });
//   }

//   return Array.from(productsMap.values());
// }


const HEADER_DETECTION_KEY = "Nama Produk";


type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  processingFee: number;
}

export default function parseSellerFeeSheet(feeData: any[][]) {
  const productsMap = new Map<string, any>();
  const orders = new Map<string, OrderItem[]>();

  let feeHeaderRowIndex = -1;
  for (let i = 0; i < 5; i++) {
    if (feeData[i] && feeData[i].includes(HEADER_DETECTION_KEY)) {
      feeHeaderRowIndex = i;
      break;
    }
  }

  if (feeHeaderRowIndex !== -1) {
    const feeHeaders = feeData[feeHeaderRowIndex];
    const idxOrderId = feeHeaders.findIndex((h: string) => h === 'No. Pesanan');
    const idxProductId = feeHeaders.findIndex((h: string) => h === 'ID Produk');
    const idxProductName = feeHeaders.findIndex((h: string) => h === 'Nama Produk');
    const idxProcessingFee = feeHeaders.findIndex((h: string) => h === 'Biaya Proses Pesanan');

    const feeRows = feeData.slice(feeHeaderRowIndex + 1);


    for (const row of feeRows) {
      const orderId = row[idxOrderId];
      const productId = String(row[idxProductId]);
      const productName = row[idxProductName];
      const processingFee = row[idxProcessingFee];
  
      if (orderId && (productId && productId !== '-') && (productName && productName !== '-')) {
        if (orders.has(orderId)) {
          orders.get(orderId)?.push({
            id: orderId,
            productId,
            productName,
            processingFee: Number(processingFee),
          })
          // productsMap.get(productId)!.quantity += 1;
        } else {
          orders.set(orderId, [{
            id: orderId,
            productId,
            productName,
            processingFee: Number(processingFee),
          }])

          productsMap.set(productId, {
            id: productId,
            name: productName,
            quantity: 0,
            cogs: 0,
          })
        }
      }
    }




    // feeRows.forEach(row => {
    //   const pId = row[idxProductId];
    //   const pName = row[idxProductName];
    //   if (pId && pName && pId !== '-' && pName !== '-') {
    //     const strId = String(pId);
    //     if (productsMap.has(strId)) {
    //       productsMap.get(strId)!.quantity += 1;
    //     } else {
    //       productsMap.set(strId, { id: strId, name: pName, quantity: 1, hpp: 0 });
    //     }
    //   }
    // });
  }

  // return Array.from(productsMap.values());
  // return Array.from(orders.values());
  // return orders;
  return {
    orders: Object.fromEntries(orders),
    products: Array.from(productsMap.values()),
  }
}