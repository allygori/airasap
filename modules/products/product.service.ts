/**
 * Product Service
 * Handles business logic for product operations
 */

// import * as xlsx from 'xlsx';
import { ProductRepository } from './product.repository';
import {
  CreateProductDTO,
  UpdateProductDTO,
  BulkUpdateStatusDTO,
  ProductFilterDTO,
  MassUploadResponseDTO,
} from './product.dto';
import parseMassProductsExcel from '@/lib/xlsx/shopee/product';
import { ParsedOrderRow } from '@/lib/xlsx/shopee/product/types';
import { PLATFORMS_KV } from '../constant';
// import { ParsedOrderRow } from '@/lib/xlsx/shopee/product/map';

export class ProductService {
  private repository: ProductRepository;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.repository = new ProductRepository(tenantContext);
  }

  /**
   * Get all products
   */
  async getAllProducts() {
    try {
      return await this.repository.findAll({
        deleted_at: null,
      });
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil daftar produk: ${error.message}`
      );
    }
  }

  /**
   * Get products with pagination and filtering
   */
  async getProductsWithPagination(
    filter: ProductFilterDTO
  ) {
    try {
      const queryFilter: any = { deleted_at: null };

      if (filter.platform) {
        queryFilter.platform = filter.platform;
      }

      if (filter.is_active !== undefined) {
        queryFilter.is_active = filter.is_active;
      }

      if (filter.search) {
        const searchRegex = {
          $regex: filter.search,
          $options: 'i',
        };
        queryFilter.$or = [
          { name: searchRegex },
          { product_id: searchRegex },
        ];
      }

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter
      );
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil produk dengan pagination: ${error.message}`
      );
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    try {
      const product = await this.repository.findById(id);
      if (!product) {
        throw new Error('Produk tidak ditemukan');
      }
      return product;
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil detail produk: ${error.message}`
      );
    }
  }

  /**
   * Get product by product_id (unique identifier)
   */
  async getProductByProductId(productId: string) {
    try {
      const product =
        await this.repository.findByProductId(productId);
      if (!product) {
        throw new Error(
          `Produk dengan ID ${productId} tidak ditemukan`
        );
      }
      return product;
    } catch (error: any) {
      throw new Error(
        `Gagal mencari produk: ${error.message}`
      );
    }
  }

  /**
   * Create new product
   */
  async createProduct(dto: CreateProductDTO) {
    try {
      // Validasi product_id unik
      const existingProduct =
        await this.repository.findByProductId(
          dto.product_id
        );
      if (existingProduct) {
        throw new Error(
          `Produk dengan ID '${dto.product_id}' sudah ada`
        );
      }

      // Hitung finalPrice untuk setiap variant jika ada
      const variants = dto.variants?.map((variant) => ({
        ...variant,
        finalPrice:
          variant.price -
          (variant.price * variant.discount) / 100,
      }));

      const newProduct = await this.repository.create({
        ...dto,
        variants,
      });

      return newProduct;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat produk: ${error.message}`
      );
    }
  }

  /**
   * Update product
   */
  async updateProduct(id: string, dto: UpdateProductDTO) {
    try {
      const product = await this.repository.findById(id);
      if (!product) {
        throw new Error(
          'Produk tidak ditemukan untuk diperbarui'
        );
      }

      // Jika product_id diubah, validasi keunikan
      if (
        dto.product_id &&
        dto.product_id !== product.product_id
      ) {
        const existingProduct =
          await this.repository.findByProductId(
            dto.product_id
          );
        if (existingProduct) {
          throw new Error(
            `Produk dengan ID '${dto.product_id}' sudah ada`
          );
        }
      }

      // Hitung finalPrice untuk setiap variant jika ada
      const dataToUpdate = { ...dto };
      if (dataToUpdate.variants) {
        dataToUpdate.variants = dataToUpdate.variants.map(
          (variant) => ({
            ...variant,
            finalPrice:
              variant.price -
              (variant.price * variant.discount) / 100,
          })
        );
      }

      const updatedProduct = await this.repository.update(
        id,
        dataToUpdate
      );

      if (!updatedProduct) {
        throw new Error('Gagal memperbarui produk');
      }

      return updatedProduct;
    } catch (error: any) {
      throw new Error(
        `Gagal memperbarui produk: ${error.message}`
      );
    }
  }

  /**
   * Soft delete product
   */
  async deleteProduct(id: string) {
    try {
      const product = await this.repository.findById(id);
      if (!product) {
        throw new Error(
          'Produk tidak ditemukan untuk dihapus'
        );
      }

      const deletedProduct =
        await this.repository.softDelete(id);

      if (!deletedProduct) {
        throw new Error('Gagal menghapus produk');
      }

      return deletedProduct;
    } catch (error: any) {
      throw new Error(
        `Gagal menghapus produk: ${error.message}`
      );
    }
  }

  /**
   * Restore soft-deleted product
   */
  async restoreProduct(id: string) {
    try {
      const product = await this.repository.findById(id);
      if (!product) {
        throw new Error('Produk tidak ditemukan');
      }

      const restoredProduct =
        await this.repository.restore(id);

      if (!restoredProduct) {
        throw new Error('Gagal memulihkan produk');
      }

      return restoredProduct;
    } catch (error: any) {
      throw new Error(
        `Gagal memulihkan produk: ${error.message}`
      );
    }
  }

  /**
   * Get products by platform
   */
  async getProductsByPlatform(platform: string) {
    try {
      return await this.repository.findByPlatform(platform);
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil produk dari platform: ${error.message}`
      );
    }
  }

  /**
   * Get active products only
   */
  async getActiveProducts() {
    try {
      return await this.repository.findActive();
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil produk aktif: ${error.message}`
      );
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string) {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      return await this.repository.search(query);
    } catch (error: any) {
      throw new Error(
        `Gagal mencari produk: ${error.message}`
      );
    }
  }

  /**
   * Bulk update product status
   */
  async bulkUpdateStatus(dto: BulkUpdateStatusDTO) {
    try {
      const result = await this.repository.bulkUpdateStatus(
        dto.product_ids,
        dto.is_active
      );

      if (result.modifiedCount === 0) {
        throw new Error(
          'Tidak ada produk yang berhasil diperbarui'
        );
      }

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} produk berhasil diperbarui`,
      };
    } catch (error: any) {
      throw new Error(
        `Gagal memperbarui status produk: ${error.message}`
      );
    }
  }

  // async massUploadShopeeProducts(
  //   fileBuffer: ArrayBuffer
  // ): Promise<MassUploadResultDTO> {
  //   try {
  //     const workbook = xlsx.read(Buffer.from(fileBuffer), {
  //       type: 'buffer',
  //     });
  //     const sheetName = workbook.SheetNames[0];
  //     if (!sheetName) {
  //       throw new Error('Sheet Excel tidak ditemukan');
  //     }

  //     const worksheet = workbook.Sheets[sheetName];
  //     const data = xlsx.utils.sheet_to_json<any[]>(
  //       worksheet,
  //       {
  //         header: 1,
  //       }
  //     );

  //     if (!Array.isArray(data) || data.length < 7) {
  //       throw new Error(
  //         'Format Excel tidak valid atau data kosong.'
  //       );
  //     }

  //     type ExcelRow = {
  //       productId: string;
  //       productName: string;
  //       variationId: number;
  //       variationName: string;
  //       sku?: string;
  //       price: number;
  //       gtin?: string;
  //       quantity: number;
  //     };

  //     const rows: ExcelRow[] = [];
  //     for (let i = 6; i < data.length; i++) {
  //       const row: any = data[i];
  //       if (!row || !row[0]) continue;

  //       const productId = Number(row[0]);
  //       if (Number.isNaN(productId)) continue;

  //       const variationId = Number(row[2] || 0);

  //       rows.push({
  //         productId: String(productId),
  //         productName: String(row[1] || ''),
  //         variationId: Number.isNaN(variationId)
  //           ? 0
  //           : variationId,
  //         variationName: String(row[3] || ''),
  //         sku: row[5] ? String(row[5]) : undefined,
  //         price: Number(row[6] || 0),
  //         gtin: row[7] ? String(row[7]) : undefined,
  //         quantity: Number(row[8] || 0),
  //       });
  //     }

  //     if (rows.length === 0) {
  //       throw new Error(
  //         'Tidak ada data produk yang valid di file Excel.'
  //       );
  //     }

  //     const productsMap = new Map<string, ExcelRow[]>();
  //     for (const row of rows) {
  //       if (!productsMap.has(row.productId)) {
  //         productsMap.set(row.productId, []);
  //       }
  //       productsMap.get(row.productId)!.push(row);
  //     }

  //     let createdCount = 0;
  //     let updatedCount = 0;

  //     for (const [
  //       productId,
  //       group,
  //     ] of productsMap.entries()) {
  //       const name =
  //         group[0].productName || `Produk ${productId}`;
  //       const productKey = `${productId}::${
  //         group[0].variationName || 'Default'
  //       }`;

  //       const variants = group.map((item) => ({
  //         variant_id: item.variationId,
  //         name:
  //           item.variationName ||
  //           item.productName ||
  //           'Default',
  //         product_key: `${productId}::${item.variationName || 'Default'}`,
  //         price: item.price,
  //         quantity: item.quantity,
  //         discount: 0,
  //         finalPrice: item.price,
  //         SKU: item.sku,
  //         GTIN: item.gtin,
  //       }));

  //       const existingProduct =
  //         await this.repository.findByProductId(productId);

  //       const payload = {
  //         platform: 'shopee',
  //         name,
  //         product_id: productId,
  //         product_key: productKey,
  //         variants,
  //         is_active: true,
  //       };

  //       if (existingProduct) {
  //         await this.repository.update(
  //           existingProduct._id.toString(),
  //           payload
  //         );
  //         updatedCount++;
  //       } else {
  //         await this.repository.create(payload);
  //         createdCount++;
  //       }
  //     }

  //     return {
  //       createdCount,
  //       updatedCount,
  //       totalRows: rows.length,
  //       totalProducts: productsMap.size,
  //     };
  //   } catch (error: any) {
  //     throw new Error(
  //       `Gagal memproses mass upload produk: ${error.message}`
  //     );
  //   }
  // }

  /**
   * Mass upload shopee products
   * @param fileBuffer
   * @returns
   */
  async massUploadShopeeProducts(
    fileBuffer: ArrayBuffer
  ): Promise<MassUploadResponseDTO> {
    try {
      const products =
        await parseMassProductsExcel(fileBuffer);

      // const workbook = xlsx.read(Buffer.from(fileBuffer), {
      //   type: 'buffer',
      // });
      // const sheetName = workbook.SheetNames[0];
      // if (!sheetName) {
      //   throw new Error('Sheet Excel tidak ditemukan');
      // }

      // const worksheet = workbook.Sheets[sheetName];
      // const data = xlsx.utils.sheet_to_json<any[]>(
      //   worksheet,
      //   {
      //     header: 1,
      //   }
      // );

      // if (!Array.isArray(data) || data.length < 7) {
      //   throw new Error(
      //     'Format Excel tidak valid atau data kosong.'
      //   );
      // }

      // type ExcelRow = {
      //   productId: string;
      //   productName: string;
      //   variationId: number;
      //   variationName: string;
      //   sku?: string;
      //   price: number;
      //   gtin?: string;
      //   quantity: number;
      // };

      // const rows: ExcelRow[] = [];
      // for (let i = 6; i < data.length; i++) {
      //   const row: any = data[i];
      //   if (!row || !row[0]) continue;

      //   const productId = Number(row[0]);
      //   if (Number.isNaN(productId)) continue;

      //   const variationId = Number(row[2] || 0);

      //   rows.push({
      //     productId: String(productId),
      //     productName: String(row[1] || ''),
      //     variationId: Number.isNaN(variationId)
      //       ? 0
      //       : variationId,
      //     variationName: String(row[3] || ''),
      //     sku: row[5] ? String(row[5]) : undefined,
      //     price: Number(row[6] || 0),
      //     gtin: row[7] ? String(row[7]) : undefined,
      //     quantity: Number(row[8] || 0),
      //   });
      // }

      if (products.length === 0) {
        throw new Error(
          'Tidak ada data produk yang valid di file Excel.'
        );
      }

      const productsMap = new Map<
        string,
        ParsedOrderRow[]
      >();
      for (const product of products) {
        const productId = String(product.productId);

        if (!productsMap.has(productId)) {
          productsMap.set(productId, []);
        }
        productsMap.get(productId)!.push(product);
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const [
        productId,
        group,
      ] of productsMap.entries()) {
        // console.log({ productId, group });
        //   const name =
        //     group[0].productName || `Produk ${productId}`;
        //   const productKey = productId && group[0].variantId ? `${productId}::${group[0].variantId}` : `${productId}::${
        //     group[0].variantName || 'Default'
        //   }`;
        const variants = group.map((item) => ({
          variant_id: item.variantId,
          name: item.variantName || item.productName || '-',
          key: `${productId}::${item.variantId || '-'}`,
          price: item.price,
          // quantity: item.quantity ?? 0,
          discount: 0,
          finalPrice: 0,
          parent_sku: item.parentSKU,
          sku: item.SKU,
          gtin: item.GTIN,
        }));
        const existingProduct =
          await this.repository.findByProductId(productId);
        const payload = {
          platform: PLATFORMS_KV.shopee,
          name: group[0]?.productName || '',
          product_id: productId,
          key: productId,
          variants,
          is_active: true,
        };
        if (existingProduct) {
          await this.repository.update(
            existingProduct._id.toString(),
            payload
          );
          updatedCount++;
        } else {
          await this.repository.create(payload);
          createdCount++;
        }
      }

      return {
        created_count: createdCount,
        updated_count: updatedCount,
        total_rows: products.length,
        total_products: productsMap.size,
      };
    } catch (error: any) {
      throw new Error(
        `Gagal memproses mass upload produk: ${error.message}`
      );
    }
  }

  /**
   * Count products by platform
   */
  async countProductsByPlatform(platform: string) {
    try {
      return await this.repository.countByPlatform(
        platform
      );
    } catch (error: any) {
      throw new Error(
        `Gagal menghitung produk: ${error.message}`
      );
    }
  }
}
