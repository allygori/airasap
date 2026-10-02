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
  ProductReviewIssueDTO,
} from './product.dto';
import parseMassProductsExcel from '@/lib/xlsx/shopee/v1/product';
import type { ParsedOrderRow } from '@/lib/xlsx/shopee/v1/product/types';
import {
  ORDER_PLATFORMS,
  OrderPlatform,
} from '@/constant/order-platform';
import SkuGenerator from './sku/sku-generator';
import { escapeRegex } from '@/lib/string';
import type { QueryFilter } from 'mongoose';
import type { TProduct } from './product.model';
import {
  appendPreviousName,
  mergeUniqueCosts,
  resolveMergedDefaultCost,
  type ProductImportVariantSnapshot,
} from './product-import-reconciliation';

function getProductSearchConditions(
  searchField: ProductFilterDTO['search_field'],
  searchRegex: RegExp
): QueryFilter<TProduct>[] {
  switch (searchField) {
    case 'name':
      return [
        { name: searchRegex },
        { name_history: searchRegex },
      ];
    case 'variant_name':
      return [
        { 'variants.name': searchRegex },
        { 'variants.name_history': searchRegex },
      ];
    case 'product_id':
      return [{ product_id: searchRegex }];
    case 'variant_id':
      return [{ 'variants.variant_id': searchRegex }];
    case 'parent_sku':
      return [{ parent_sku: searchRegex }];
    case 'child_sku':
      return [{ 'variants.child_sku': searchRegex }];
    default:
      return [
        { name: searchRegex },
        { name_history: searchRegex },
        { product_id: searchRegex },
      ];
  }
}

function toImportString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeReviewIssues(
  issues: readonly {
    code: 'variant_cost_conflict';
    candidates: readonly {
      variant_id: string;
      name: string;
      default_cost: number | null;
      effective_from: Date | string | null;
    }[];
  }[]
): ProductReviewIssueDTO[] {
  return issues.map((issue) => ({
    code: issue.code,
    candidates: issue.candidates.map((candidate) => ({
      variant_id: candidate.variant_id,
      name: candidate.name,
      default_cost: candidate.default_cost,
      effective_from:
        candidate.effective_from instanceof Date
          ? candidate.effective_from.toISOString()
          : candidate.effective_from,
    })),
  }));
}

function reviewIssueFingerprint(
  issue: ProductReviewIssueDTO
) {
  return JSON.stringify({
    code: issue.code,
    candidates: issue.candidates.map((candidate) => [
      candidate.variant_id,
      candidate.name,
      candidate.default_cost,
      candidate.effective_from,
    ]),
  });
}

function toStoredReviewIssue(issue: ProductReviewIssueDTO) {
  return {
    code: issue.code,
    candidates: issue.candidates.map((candidate) => ({
      variant_id: candidate.variant_id,
      name: candidate.name,
      default_cost: candidate.default_cost,
      effective_from: candidate.effective_from
        ? new Date(candidate.effective_from)
        : null,
    })),
  };
}

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
      const queryFilter: QueryFilter<TProduct> = {
        deleted_at: null,
      };

      if (filter.platform) {
        queryFilter.platform = filter.platform;
      }

      if (filter.is_active !== undefined) {
        queryFilter.is_active = filter.is_active;
      }

      if (filter.search) {
        const searchRegex = new RegExp(
          escapeRegex(filter.search),
          'i'
        );
        queryFilter.$or = getProductSearchConditions(
          filter.search_field,
          searchRegex
        );
      }

      const sort: Record<string, 1 | -1> = filter.sort
        ? {
            updated_at:
              filter.sort === '-updated_at' ? -1 : 1,
          }
        : { created_at: -1 };

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter,
        sort
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
        const existingVariantsById = new Map(
          (product.variants ?? []).map((variant) => [
            variant.variant_id,
            variant,
          ])
        );
        dataToUpdate.variants = dataToUpdate.variants.map(
          (variant) => {
            const existingVariant =
              existingVariantsById.get(variant.variant_id);

            return {
              ...(existingVariant ?? {}),
              ...variant,
              ...(existingVariant?.sku
                ? { sku: existingVariant.sku }
                : {}),
              default_cost:
                variant.default_cost ??
                existingVariant?.default_cost ??
                0,
              final_price:
                variant.price -
                (variant.price * variant.discount) / 100,
            };
          }
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

  async markProductReviewed(id: string, userId: string) {
    const product = await this.repository.markReviewed(
      id,
      userId
    );

    if (!product) {
      throw new Error(
        'Produk tidak ditemukan untuk ditinjau'
      );
    }

    return product;
  }

  /**
   * Get products by platform
   */
  async getProductsByPlatform(platform: OrderPlatform) {
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

  async getProductsForOrderMatching(input: {
    names?: string[];
    parentSkus?: string[];
    childSkus?: string[];
    productIds?: string[];
  }) {
    return await this.repository.findForOrderMatching(
      input
    );
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

      const skuGenerator = new SkuGenerator({
        storeCode: 'KD',
      });
      for (const [
        productId,
        group,
      ] of productsMap.entries()) {
        const existingProduct =
          await this.repository.findByProductId(productId);
        const existingVariants =
          existingProduct?.variants ?? [];
        const options: string[][] = [];

        for (const item of group) {
          const variantName = toImportString(
            item.variantName
          );
          if (!variantName) continue;

          variantName
            .split(',')
            .map((value) => value.trim())
            .forEach((value, index) => {
              if (!options[index]) options[index] = [];
              if (!options[index].includes(value)) {
                options[index].push(value);
              }
            });
        }

        const hasVariation = options.length > 0;
        const existingByVariantId = new Map(
          existingVariants.map((variant) => [
            variant.variant_id,
            variant,
          ])
        );
        const singleSourceVariant =
          existingVariants.length === 1
            ? existingVariants[0]
            : undefined;
        const isSplitFromSingleVariant =
          Boolean(singleSourceVariant) && group.length > 1;
        const isMergeToSingleVariant =
          !hasVariation &&
          existingVariants.length > 1 &&
          group.length === 1;
        const mergedDefaultCost = isMergeToSingleVariant
          ? resolveMergedDefaultCost(existingVariants)
          : undefined;
        const mergedCosts = isMergeToSingleVariant
          ? mergeUniqueCosts(existingVariants)
          : undefined;

        const fileParentSKU = group
          .map((item) => toImportString(item.parentSKU))
          .find(Boolean);
        const parentSKU =
          toImportString(existingProduct?.parent_sku) ||
          fileParentSKU ||
          skuGenerator.generateParentSKU();
        const productName =
          toImportString(group[0]?.productName) ||
          existingProduct?.name ||
          '';

        const variants = group.map((item) => {
          const variantId = toImportString(item.variantId);
          const matchedVariant =
            existingByVariantId.get(variantId);
          const existingVariant =
            matchedVariant ??
            (group.length === 1 &&
            existingVariants.length === 1
              ? singleSourceVariant
              : undefined);
          const importedVariantName =
            toImportString(item.variantName) ||
            productName ||
            '-';
          const importedSKU = toImportString(item.SKU);
          const childSKU =
            toImportString(existingVariant?.child_sku) ||
            importedSKU ||
            skuGenerator.generateChildSKU(parentSKU);
          const usesMergedCost = isMergeToSingleVariant;
          const usesSplitSeed =
            isSplitFromSingleVariant && !existingVariant;
          let variantHistory = existingVariant
            ? appendPreviousName(
                existingVariant.name_history,
                matchedVariant?.name,
                importedVariantName
              )
            : usesSplitSeed && singleSourceVariant
              ? appendPreviousName(
                  singleSourceVariant.name_history,
                  singleSourceVariant.name,
                  importedVariantName
                )
              : [];

          if (usesMergedCost) {
            for (const sourceVariant of existingVariants) {
              variantHistory = appendPreviousName(
                variantHistory,
                sourceVariant.name,
                importedVariantName
              );
              for (const oldName of sourceVariant.name_history ??
                []) {
                variantHistory = appendPreviousName(
                  variantHistory,
                  oldName,
                  importedVariantName
                );
              }
            }
          }

          const costs = usesMergedCost
            ? (mergedCosts ?? [])
            : (existingVariant?.costs ??
              (usesSplitSeed
                ? (singleSourceVariant?.costs ?? [])
                : []));
          const defaultCost = usesMergedCost
            ? mergedDefaultCost?.defaultCost
            : (existingVariant?.default_cost ??
              (usesSplitSeed
                ? singleSourceVariant?.default_cost
                : undefined));
          const price = Number(item.price);

          return {
            ...(existingVariant ?? {}),
            variant_id: variantId,
            name: importedVariantName,
            name_history: variantHistory,
            price,
            discount: 0,
            final_price: price,
            child_sku: childSKU,
            gtin: toImportString(item.GTIN),
            is_native: existingVariant?.is_native ?? true,
            is_default: group.length === 1,
            costs,
            ...(typeof defaultCost === 'number'
              ? { default_cost: defaultCost }
              : {}),
          };
        });

        const importedNameHistory = existingProduct
          ? appendPreviousName(
              existingProduct.name_history,
              existingProduct.name,
              productName
            )
          : [];
        const newReviewIssue =
          mergedDefaultCost?.reviewIssue;
        const existingReviewIssues =
          existingProduct?.review_issues ?? [];
        const reviewIssues = normalizeReviewIssues(
          existingReviewIssues
        );

        if (
          newReviewIssue &&
          !reviewIssues.some(
            (issue) =>
              reviewIssueFingerprint(issue) ===
              reviewIssueFingerprint(newReviewIssue)
          )
        ) {
          reviewIssues.push(newReviewIssue);
        }

        const payload = {
          platform: ORDER_PLATFORMS.shopee.value,
          product_id: productId,
          name: productName,
          name_history: importedNameHistory,
          parent_sku: hasVariation
            ? parentSKU
            : existingProduct?.parent_sku ||
              variants[0]?.child_sku ||
              parentSKU,
          has_variation: hasVariation,
          options,
          variants,
          is_active: existingProduct?.is_active ?? true,
          needs_review: Boolean(
            existingProduct?.needs_review || newReviewIssue
          ),
          review_issues: reviewIssues.map(
            toStoredReviewIssue
          ),
          reviewed_at: newReviewIssue
            ? null
            : (existingProduct?.reviewed_at ?? null),
          reviewed_by: newReviewIssue
            ? null
            : (existingProduct?.reviewed_by ?? null),
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
   * Count products by tenant
   */
  async countProductsByTenant() {
    try {
      return await this.repository.count();
    } catch (error: any) {
      throw new Error(
        `Gagal menghitung produk: ${error.message}`
      );
    }
  }

  /**
   * Count products by platform
   */
  async countProductsByPlatform(platform: OrderPlatform) {
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
