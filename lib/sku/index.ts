import { customAlphabet } from 'nanoid';
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export type SkuPayload = {
  storeCode: string; // 2 karakter huruf (cth: "JK")
  // categoryCode: string; // 2 karakter angka/huruf (cth: "01")
  // variantCode: string; // 3 karakter alfanumerik (cth: "M01")
};

export default class SkuGenerator {
  private payload: SkuPayload;

  constructor(payload: SkuPayload) {
    this.payload = payload;
  }

  private toBase36(num: number): string {
    if (num < 0 || num > 1295) {
      throw new Error(
        'Kapasitas produk untuk kategori ini sudah penuh (Max 1296)!'
      );
    }
    return num.toString(36).toUpperCase().padStart(2, '0');
  }

  private toBase36Variant(num: number): string {
    // Batas maksimum untuk 3 karakter Base36 adalah (36^3) - 1 = 46655
    const MAX_VARIANT_CAPACITY = 46655;

    if (num < 0 || num > MAX_VARIANT_CAPACITY) {
      throw new Error(
        `Kapasitas kode varian sudah penuh (Max ${MAX_VARIANT_CAPACITY + 1} kombinasi)!`
      );
    }

    // Mengubah ke Base36, kapitalisasi huruf, dan pastikan panjangnya tepat 3 karakter
    return num.toString(36).toUpperCase().padStart(3, '0');
  }

  generateParentSKU() {
    const { storeCode } = this.payload;
    const nanoid = customAlphabet(alphabet, 2);
    const genLastCode = customAlphabet(alphabet, 3);

    // const productCode = this.toBase36(counter);
    const categoryCode = nanoid();
    const productCode = nanoid();
    const lastCode = genLastCode();
    const parentSKU = `${storeCode.toUpperCase()}${categoryCode}${productCode}-${lastCode}`;

    return parentSKU;
  }

  generateChildSKU(parentSKU: string) {
    // const { storeCode } = this.payload;
    const nanoid = customAlphabet(alphabet, 3);
    // const pSKU = parentSKU.slice(0, 8)

    // const variantCode = this.toBase36Variant(counter);
    const variantCode = nanoid();
    const childSKU = `${parentSKU.slice(0, 6)}-${variantCode}`;

    return childSKU;
  }
}

// export default class SkuGenerator {
//   // Mengubah angka desimal biasa (0-1295) menjadi 2 karakter Base36 uppercase
//   private static toBase36(num: number): string {
//     if (num < 0 || num > 1295) {
//       throw new Error(
//         'Kapasitas produk untuk kategori ini sudah penuh (Max 1296)!'
//       );
//     }
//     return num.toString(36).toUpperCase().padStart(2, '0');
//   }

//   /**
//    * Menghasilkan SKU Induk (6 Karakter) & SKU Anak (10 Karakter)
//    * @param counter Counter from db
//    * @param payload Data toko, kategori, dan varian
//    */
//   public static generate(
//     counter: number,
//     payload: SkuPayload
//   ) {
//     const { storeCode, categoryCode, variantCode } =
//       payload;

//     // Validation
//     if (
//       storeCode.length !== 2 ||
//       categoryCode.length !== 2 ||
//       variantCode.length !== 3
//     ) {
//       throw new Error(
//         'Format panjang karakter payload input tidak valid!'
//       );
//     }

//     // // 1. Hitung jumlah produk yang sudah ada di kategori tersebut untuk menentukan nomor urut
//     // const productCount = await db
//     //   .collection('products')
//     //   .countDocuments({
//     //     store_code: storeCode.toUpperCase(),
//     //     category_code: categoryCode,
//     //   });

//     // 2. Ubah nomor urut menjadi 2 karakter Base36
//     const productCode = this.toBase36(counter);

//     // 3. Gabungkan menjadi SKU Induk (6 Karakter)
//     const parentSku = `${storeCode.toUpperCase()}${categoryCode}${productCode}`;

//     // 4. Gabungkan menjadi SKU Anak / Nomor Referensi SKU (10 Karakter)
//     const childSku = `${parentSku}-${variantCode.toUpperCase()}`;

//     return {
//       parentSku, // Tepat 6 karakter tanpa dash
//       childSku, // Tepat 10 karakter dengan dash
//     };
//   }

//   public generateParentSKU() {

//   }
// }
