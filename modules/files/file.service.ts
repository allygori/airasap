/**
 * File Service
 * Handles business logic for file operations
 */

import { FileRepository } from './file.repository';
import {
  CreateFileDTO,
  QueryFilterFileDTO,
  UpdateFileDTO,
} from './file.dto';

export class FileService {
  private repository: FileRepository;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.repository = new FileRepository(tenantContext);
  }

  /**
   * Get all files
   */
  async getAll() {
    try {
      return await this.repository.findAll({
        deleted_at: null,
      });
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil daftar file: ${error.message}`
      );
    }
  }

  /**
   * Get files with pagination and filtering
   */
  async getWithPagination(filter: QueryFilterFileDTO) {
    try {
      const queryFilter: any = { deleted_at: null };

      if (filter.fileType) {
        queryFilter.fileType = filter.fileType;
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
        `Gagal mengambil file dengan pagination: ${error.message}`
      );
    }
  }

  /**
   * Get file by ID
   */
  async getById(id: string) {
    try {
      const file = await this.repository.findById(id);
      if (!file) {
        throw new Error('File tidak ditemukan');
      }
      return file;
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil detail file: ${error.message}`
      );
    }
  }

  /**
   * Get file by filename (hash SHA-256)
   */
  async getByFilename(filename: string) {
    try {
      return await this.repository.findOne({
        filename,
      });
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil detail file: ${error.message}`
      );
    }
  }

  /**
   * Create new file
   */
  async create(dto: CreateFileDTO) {
    try {
      // Validasi filename unik
      const existingFile = await this.repository.findOne({
        filename: dto.filename,
      });
      if (existingFile) {
        throw new Error(
          `File dengan filename '${dto.filename}' sudah ada`
        );
      }

      const newFile = await this.repository.create({
        ...dto,
      });
      return newFile;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat file: ${error.message}`
      );
    }

    /** @TODO implement */
    // try {
    //   // Validasi product_id unik
    //   const existingProduct =
    //     await this.repository.findByProductId(
    //       dto.product_id
    //     );
    //   if (existingProduct) {
    //     throw new Error(
    //       `File dengan ID '${dto.product_id}' sudah ada`
    //     );
    //   }
    //   // Hitung finalPrice untuk setiap variant jika ada
    //   const variants = dto.variants?.map((variant) => ({
    //     ...variant,
    //     finalPrice:
    //       variant.price -
    //       (variant.price * variant.discount) / 100,
    //   }));
    //   const newProduct = await this.repository.create({
    //     ...dto,
    //     variants,
    //   });
    //   return newProduct;
    // } catch (error: any) {
    //   throw new Error(
    //     `Gagal membuat file: ${error.message}`
    //   );
    // }
  }

  /**
   * Update file
   */
  async update(id: string, dto: UpdateFileDTO) {
    /** @TODO implement */
    // try {
    //   const file = await this.repository.findById(id);
    //   if (!file) {
    //     throw new Error(
    //       'File tidak ditemukan untuk diperbarui'
    //     );
    //   }
    //   // Jika product_id diubah, validasi keunikan
    //   if (
    //     dto.product_id &&
    //     dto.product_id !== file.product_id
    //   ) {
    //     const existingProduct =
    //       await this.repository.findByProductId(
    //         dto.product_id
    //       );
    //     if (existingProduct) {
    //       throw new Error(
    //         `File dengan ID '${dto.product_id}' sudah ada`
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
    //     throw new Error('Gagal memperbarui file');
    //   }
    //   return updatedProduct;
    // } catch (error: any) {
    //   throw new Error(
    //     `Gagal memperbarui file: ${error.message}`
    //   );
    // }
  }

  /**
   * Soft delete file
   */
  async remove(id: string) {
    try {
      const file = await this.repository.findById(id);
      if (!file) {
        throw new Error(
          'File tidak ditemukan untuk dihapus'
        );
      }

      const deletedFile =
        await this.repository.softDelete(id);

      if (!deletedFile) {
        throw new Error('Gagal menghapus file');
      }

      return deletedFile;
    } catch (error: any) {
      throw new Error(
        `Gagal menghapus file: ${error.message}`
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
        throw new Error('File tidak ditemukan');
      }

      const restoredFile =
        await this.repository.restore(id);

      if (!restoredFile) {
        throw new Error('Gagal memulihkan file');
      }

      return restoredFile;
    } catch (error: any) {
      throw new Error(
        `Gagal memulihkan file: ${error.message}`
      );
    }
  }

  /**
   * Get active files only
   */
  async getActive() {
    try {
      return await this.repository.findActive();
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil file aktif: ${error.message}`
      );
    }
  }

  /**
   * Get or create file
   */
  async getOrCreate() {
    /** @TODO implement */
  }
}
