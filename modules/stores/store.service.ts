/**
 * Store Service
 * Handles business logic for store operations
 */

import { StoreRepository } from './store.repository';
import {
  CreateStoreDTO,
  StoreFilterDTO,
  UpdateStoreDTO,
  UpdateStoreSchema,
} from './store.dto';
import type { QueryFilter } from 'mongoose';
import type { TStore } from './store.model';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Kesalahan tidak diketahui';
}

export class StoreService {
  private repository: StoreRepository;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.repository = new StoreRepository(tenantContext);
  }

  async getCurrentStore() {
    try {
      return await this.repository.findCurrentStore();
    } catch (error: unknown) {
      throw new Error(
        `Gagal mendapatkan toko saat ini: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get all stores
   */
  async getAll() {
    try {
      return await this.repository.findAll({
        deleted_at: null,
      });
    } catch (error: unknown) {
      throw new Error(
        `Gagal mengambil daftar toko: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get stores with pagination and filtering
   */
  async getWithPagination(filter: StoreFilterDTO) {
    try {
      const queryFilter: QueryFilter<TStore> = {
        deleted_at: null,
      };

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
          { code: searchRegex },
        ];
      }

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter
      );
    } catch (error: unknown) {
      throw new Error(
        `Gagal mengambil data toko dengan pagination: ${getErrorMessage(error)}`
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
    } catch (error: unknown) {
      throw new Error(
        `Gagal mengambil detail toko: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Create new store
   */
  async create(dto: CreateStoreDTO) {
    try {
      const newStore = await this.repository.create(dto);
      return newStore;
    } catch (error: unknown) {
      throw new Error(
        `Gagal membuat toko: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Update store
   */
  async update(id: string, dto: UpdateStoreDTO) {
    const validatedData = UpdateStoreSchema.parse(dto);
    return this.repository.updateById(id, validatedData);
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
    } catch (error: unknown) {
      throw new Error(
        `Gagal menghapus toko: ${getErrorMessage(error)}`
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
    } catch (error: unknown) {
      throw new Error(
        `Gagal memulihkan toko: ${getErrorMessage(error)}`
      );
    }
  }

  /**
   * Get active stores only
   */
  async getActive() {
    try {
      return await this.repository.findActive();
    } catch (error: unknown) {
      throw new Error(
        `Gagal mengambil toko aktif: ${getErrorMessage(error)}`
      );
    }
  }
}
