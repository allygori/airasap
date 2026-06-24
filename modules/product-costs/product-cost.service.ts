/**
 * Product Cost Service
 * Handles business logic for product cost operations
 */

import { ProductCostRepository } from './product-cost.repository';
import {
  CreateProductCostDTO,
  UpdateProductCostDTO,
  QueryFilterProductCostDTO,
} from './product-cost.dto';

export class ProductCostService {
  private repository: ProductCostRepository;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.repository = new ProductCostRepository(
      tenantContext
    );
  }

  /**
   * Get all product costs
   */
  async getAll() {
    try {
      return await this.repository.findAll({
        deleted_at: null,
      });
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil daftar product cost: ${error.message}`
      );
    }
  }

  /**
   * Get product costs with pagination and filtering
   */
  async getWithPagination(
    filter: QueryFilterProductCostDTO
  ) {
    try {
      const queryFilter: any = { deleted_at: null };

      if (filter.effective_from) {
        queryFilter.effective_from = filter.effective_from;
      }

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter
      );
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil product cost dengan pagination: ${error.message}`
      );
    }
  }

  /**
   * Get product cost by ID
   */
  async getById(id: string) {
    try {
      const file = await this.repository.findById(id);
      if (!file) {
        throw new Error('ProductCost tidak ditemukan');
      }
      return file;
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil detail product cost: ${error.message}`
      );
    }
  }

  /**
   * Create new product cost
   */
  async create(dto: CreateProductCostDTO) {
    try {
      const newProductCost = await this.repository.create({
        ...dto,
      });
      return newProductCost;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat product cost: ${error.message}`
      );
    }
  }

  /**
   * Update product cost
   */
  async update(id: string, dto: UpdateProductCostDTO) {
    try {
      const updatedProductCost =
        await this.repository.update(id, dto);
      if (!updatedProductCost) {
        throw new Error('Gagal memperbarui product cost');
      }
      return updatedProductCost;
    } catch (error: any) {
      throw new Error(
        `Gagal memperbarui product cost: ${error.message}`
      );
    }
  }

  /**
   * Soft delete product cost
   */
  async remove(id: string) {
    try {
      const file = await this.repository.findById(id);
      if (!file) {
        throw new Error(
          'ProductCost tidak ditemukan untuk dihapus'
        );
      }

      const deletedProductCost =
        await this.repository.softDelete(id);

      if (!deletedProductCost) {
        throw new Error('Gagal menghapus product cost');
      }

      return deletedProductCost;
    } catch (error: any) {
      throw new Error(
        `Gagal menghapus product cost: ${error.message}`
      );
    }
  }

  /**
   * Restore soft-deleted file
   */
  async restore(id: string) {
    try {
      const file = await this.repository.findById(id);
      if (!file) {
        throw new Error('ProductCost tidak ditemukan');
      }

      const restoredProductCost =
        await this.repository.restore(id);

      if (!restoredProductCost) {
        throw new Error('Gagal memulihkan product cost');
      }

      return restoredProductCost;
    } catch (error: any) {
      throw new Error(
        `Gagal memulihkan product cost: ${error.message}`
      );
    }
  }

  /**
   * Get active product costs only
   */
  async getActive() {
    try {
      return await this.repository.findActive();
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil product cost aktif: ${error.message}`
      );
    }
  }
}
