/**
 * Store Service
 * Handles business logic for store operations
 */

import { StoreRepository } from './store.repository';
import {
  CreateStoreDTO,
  StoreFilterDTO,
  UpdateStoreDTO,
} from './store.dto';

export class StoreService {
  private repository: StoreRepository;

  constructor(tenantContext: {
    organizationId: string;
    // storeId?: string;
  }) {
    this.repository = new StoreRepository(tenantContext);
  }

  /**
   * Get all stores
   */
  async getAll() {
    try {
      return await this.repository.findAll({
        deleted_at: null,
      });
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil daftar toko: ${error.message}`
      );
    }
  }

  /**
   * Get stores with pagination and filtering
   */
  async getWithPagination(filter: StoreFilterDTO) {
    try {
      const queryFilter: any = { deleted_at: null };

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
        `Gagal mengambil data toko dengan pagination: ${error.message}`
      );
    }
  }

  /**
   * Get store by ID
   */
  async getById(id: string) {
    try {
      const store = await this.repository.findById(id);
      if (!store) {
        throw new Error('Toko tidak ditemukan');
      }
      return store;
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil detail toko: ${error.message}`
      );
    }
  }

  /**
   * Create new store
   */
  async create(dto: CreateStoreDTO) {
    /** @TODO implement */
    try {
      console.log(
        'create store dto',
        JSON.stringify(dto, null, 2)
      );
      const newStore = await this.repository.create(dto);
      return newStore;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat toko: ${error.message}`
      );
    }
  }

  /**
   * Update store
   */
  async update(id: string, dto: UpdateStoreDTO) {
    /** @TODO implement */
    // try {
    //   const store = await this.repository.findById(id);
    //   if (!store) {
    //     throw new Error(
    //       'Toko tidak ditemukan untuk diperbarui'
    //     );
    //   }
    //   // Jika product_id diubah, validasi keunikan
    //   if (
    //     dto.product_id &&
    //     dto.product_id !== store.product_id
    //   ) {
    //     const existingProduct =
    //       await this.repository.findByProductId(
    //         dto.product_id
    //       );
    //     if (existingProduct) {
    //       throw new Error(
    //         `Store dengan ID '${dto.product_id}' sudah ada`
    //       );
    //     }
    //   }
    //   // Hitung finalPrice untuk setiap variant jika ada
    //   const dataToUpdate = { ...dto };
    //   if (dataToUpdate.variants) {
    //     dataToUpdate.variants = dataToUpdate.variants.map(
    //       (variant) => ({
    //         ...variant,
    //         finalPrice:
    //           variant.price -
    //           (variant.price * variant.discount) / 100,
    //       })
    //     );
    //   }
    //   const updatedProduct = await this.repository.update(
    //     id,
    //     dataToUpdate
    //   );
    //   if (!updatedProduct) {
    //     throw new Error('Gagal memperbarui store');
    //   }
    //   return updatedProduct;
    // } catch (error: any) {
    //   throw new Error(
    //     `Gagal memperbarui store: ${error.message}`
    //   );
    // }
  }

  /**
   * Soft delete store
   */
  async delete(id: string) {
    try {
      const store = await this.repository.findById(id);
      if (!store) {
        throw new Error(
          'Toko tidak ditemukan untuk dihapus'
        );
      }

      const deletedStore =
        await this.repository.softDelete(id);

      if (!deletedStore) {
        throw new Error('Gagal menghapus toko');
      }

      return deletedStore;
    } catch (error: any) {
      throw new Error(
        `Gagal menghapus toko: ${error.message}`
      );
    }
  }

  /**
   * Restore soft-deleted store
   */
  async restore(id: string) {
    try {
      const store = await this.repository.findById(id);
      if (!store) {
        throw new Error('Toko tidak ditemukan');
      }

      const restoredStore =
        await this.repository.restore(id);

      if (!restoredStore) {
        throw new Error('Gagal memulihkan toko');
      }

      return restoredStore;
    } catch (error: any) {
      throw new Error(
        `Gagal memulihkan toko: ${error.message}`
      );
    }
  }

  /**
   * Get active stores only
   */
  async getActive() {
    try {
      return await this.repository.findActive();
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil toko aktif: ${error.message}`
      );
    }
  }
}
