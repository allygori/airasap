import { MongoClient } from 'mongodb';

interface SkuPayload {
  storeCode: string; // 2 karakter huruf (cth: "JK")
  categoryCode: string; // 2 karakter angka/huruf (cth: "01")
  variantCode: string; // 3 karakter alfanumerik (cth: "M01")
}

class SkuGenerator {
  // Mengubah angka desimal biasa (0-1295) menjadi 2 karakter Base36 uppercase
  private static toBase36(num: number): string {
    if (num < 0 || num > 1295) {
      throw new Error(
        'Kapasitas produk untuk kategori ini sudah penuh (Max 1296)!'
      );
    }
    return num.toString(36).toUpperCase().padStart(2, '0');
  }

  /**
   * Menghasilkan SKU Induk (6 Karakter) & SKU Anak (10 Karakter)
   * @param db Instance koneksi MongoDB
   * @param payload Data toko, kategori, dan varian
   */
  public static async generate(
    db: any,
    payload: SkuPayload
  ) {
    const { storeCode, categoryCode, variantCode } =
      payload;

    // Validation
    if (
      storeCode.length !== 2 ||
      categoryCode.length !== 2 ||
      variantCode.length !== 3
    ) {
      throw new Error(
        'Format panjang karakter payload input tidak valid!'
      );
    }

    // 1. Hitung jumlah produk yang sudah ada di kategori tersebut untuk menentukan nomor urut
    const productCount = await db
      .collection('products')
      .countDocuments({
        store_code: storeCode.toUpperCase(),
        category_code: categoryCode,
      });

    // 2. Ubah nomor urut menjadi 2 karakter Base36
    const productCode = this.toBase36(productCount);

    // 3. Gabungkan menjadi SKU Induk (6 Karakter)
    const parentSku = `${storeCode.toUpperCase()}${categoryCode}${productCode}`;

    // 4. Gabungkan menjadi SKU Anak / Nomor Referensi SKU (10 Karakter)
    const childSku = `${parentSku}-${variantCode.toUpperCase()}`;

    return {
      parentSku, // Tepat 6 karakter tanpa dash
      childSku, // Tepat 10 karakter dengan dash
    };
  }
}

// ==========================================
// CONTOH PENGGUNAAN (Usage Example)
// ==========================================
async function run() {
  const client = new MongoClient(
    'mongodb://localhost:27017'
  );
  await client.connect();
  const db = client.db('tokoonline_db');

  // Anggap kita sudah memasukkan 10 produk di toko 'JK' kategori '01'
  // Produk ke-11 otomatis berkode desimal 10 -> dalam Base36 adalah "0A"
  const sku = await SkuGenerator.generate(db, {
    storeCode: 'JK',
    categoryCode: '01',
    variantCode: 'M01',
  });

  console.log('SKU Induk Shopee (6 char):', sku.parentSku); // Output: JK010A
  console.log(
    'Nomor Referensi SKU (10 char):',
    sku.childSku
  ); // Output: JK010A-M01

  await client.close();
}
