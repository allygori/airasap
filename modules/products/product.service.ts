/**
 * Product Service
 * Handles business logic for product operations
 */

import { ProductRepository } from './product.repository';
import {
  CreateProductDTO,
  UpdateProductDTO,
  BulkUpdateStatusDTO,
  ProductFilterDTO,
  MassUploadResponseDTO,
} from './product.dto';
import parseMassProductsExcel from '@/lib/xlsx/shopee/v1/product';
import { ParsedOrderRow } from '@/lib/xlsx/shopee/v1/product/types';
import { PLATFORMS_KV } from '../constant';

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

  // /**
  //  * Get product by ID
  //  */
  // async getProductById(id: string, populate?: string) {
  //   try {
  //     const product = await this.repository.findById(id, populate);
  //     if (!product) {
  //       throw new Error('Produk tidak ditemukan');
  //     }
  //     return product;
  //   } catch (error: any) {
  //     throw new Error(
  //       `Gagal mengambil detail produk: ${error.message}`
  //     );
  //   }
  // }

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
        final_price:
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
            default_cost: variant.default_cost || 0,
            final_price:
              variant.price -
              (variant.price * variant.discount) / 100,
          })
        );

        // dataToUpdate.markModified('variants')
      }

      console.log(JSON.stringify(dataToUpdate, null, 2));

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
   * Update product
   */
  async update(id: string, dto: UpdateProductDTO) {
    console.log({ dto });

    try {
      const product = await this.repository.findById(id);

      if (!product) {
        throw new Error(
          'Produk yang ingin diperbaharui tidak ditemukan.'
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
            default_cost: variant.default_cost || 0,
            final_price:
              variant.price -
              (variant.price * variant.discount) / 100,
          })
        );

        // dataToUpdate.markModified('variants')
      }

      console.log(JSON.stringify(dataToUpdate, null, 2));

      // const updatedProduct = await this.repository.update(
      //   id,
      //   // { ...product, ...dataToUpdate }
      //   dataToUpdate
      // );

      const updatedProduct = await this.repository.save(
        product,
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
   * Get products by multiple ids
   */
  async getByMultipleIds(ids: string[]) {
    try {
      return await this.repository.findByMultipleIds(ids);
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil produk dari nama: ${error.message}`
      );
    }
  }

  /**
   * Get products by names
   */
  async getProductsByNames(
    names: string[],
    filter?: ProductFilterDTO
  ) {
    try {
      return await this.repository.findByNames(names);
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil produk dari nama: ${error.message}`
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

      // const nameToOptionObject = (nameString: string) => {
      //   return nameString
      //     .split(',')
      //     .map((v) => v.trim())
      //     .reduce(
      //       (
      //         acc: Record<string, string>,
      //         currentVariant: string,
      //         index: number
      //       ) => {
      //         // Creates keys dynamically: option1, option2, etc.
      //         acc[`option${index + 1}`] = currentVariant;
      //         return acc;
      //       },
      //       {}
      //     );
      // };

      const addVariantToMatrix = (
        nameString: string,
        matrix: any[] = []
      ) => {
        const parts = nameString
          .split(',')
          .map((v) => v.trim());

        parts.forEach((variant, index) => {
          // 1. Initialize the nested array for this position if it doesn't exist
          if (!matrix[index]) {
            matrix[index] = [];
          }
          // 2. Only add the variant if it isn't already in this position's array
          if (!matrix[index].includes(variant)) {
            matrix[index].push(variant);
          }
        });

        return matrix;
      };

      let options: string[][] = [];
      for (const [
        productId,
        group,
      ] of productsMap.entries()) {
        const variants = group.map((item) => {
          if (item.variantName) {
            // options.push(
            //   // nameToOptionObject(String(item.variantName))
            //   addVariantToMatrix(
            //     String(item.variantName),
            //     options
            //   )
            // );
            options = addVariantToMatrix(
              String(item.variantName),
              options
            );
          }

          return {
            variant_id: item.variantId,
            name:
              item.variantName || item.productName || '-',
            // key: `${productId}::${item.variantId || '-'}`,
            price: item.price,
            // quantity: item.quantity ?? 0,
            discount: 0,
            final_price: item.price,
            parent_sku: item.parentSKU,
            sku: item.SKU,
            gtin: item.GTIN,
            is_default: group.length === 1,
            costs: [],
          };
        });
        console.log(options);
        const existingProduct =
          await this.repository.findByProductId(productId);
        const payload = {
          platform: PLATFORMS_KV.shopee,
          name: group[0]?.productName || '',
          product_id: productId,
          // key: productId,
          options,
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

        options = [];
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
