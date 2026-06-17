/**
 * Order Service
 * Handles business logic for order operations
 */

import { OrderRepository } from './order.repository';
import {
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderFilterDTO,
  BulkUpdateStatusDTO,
  MassUploadResponseDTO,
} from './order.dto';
import parseMassOrdersExcel, {
  ParsedOrderRow,
} from '@/lib/xlsx/shopee/order';

export class OrderService {
  private repository: OrderRepository;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.repository = new OrderRepository(tenantContext);
  }

  /**
   * Get all orders
   */
  async getAll() {
    try {
      return await this.repository.findAll({
        deleted_at: null,
      });
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil daftar order: ${error.message}`
      );
    }
  }

  /**
   * Get orders with pagination and filtering
   */
  async getWithPagination(filter: OrderFilterDTO) {
    try {
      const queryFilter: any = { deleted_at: null };

      if (filter.search) {
        const searchRegex = {
          $regex: filter.search,
          $options: 'i',
        };
        queryFilter.$or = [
          { name: searchRegex },
          { order_id: searchRegex },
        ];
      }

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter
      );
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order dengan pagination: ${error.message}`
      );
    }
  }

  /**
   * Get order by ID
   */
  async getById(id: string) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error('Order tidak ditemukan');
      }
      return order;
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil detail order: ${error.message}`
      );
    }
  }

  /**
   * Get order by order_id (unique identifier)
   */
  async getByOrderId(orderId: string) {
    try {
      const order = await this.repository.findById(orderId);
      if (!order) {
        throw new Error(
          `Order dengan ID ${orderId} tidak ditemukan`
        );
      }
      return order;
    } catch (error: any) {
      throw new Error(
        `Gagal mencari order: ${error.message}`
      );
    }
  }

  /**
   * Create new order
   */
  async create(dto: CreateOrderDTO) {
    try {
      // Validasi order_id unik
      const existingOrder = await this.repository.findById(
        dto.order_id
      );
      if (existingOrder) {
        throw new Error(
          `Order dengan ID '${dto.order_id}' sudah ada`
        );
      }

      const newOrder = await this.repository.create({
        ...dto,
      });

      return newOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal membuat order: ${error.message}`
      );
    }
  }

  /**
   * Update order
   */
  async update(id: string, dto: UpdateOrderDTO) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error(
          'Order tidak ditemukan untuk diperbarui'
        );
      }

      // Jika order_id diubah, validasi keunikan
      if (dto.order_id && dto.order_id !== order.order_id) {
        const existingOrder =
          await this.repository.findById(dto.order_id);
        if (existingOrder) {
          throw new Error(
            `Order dengan ID '${dto.order_id}' sudah ada`
          );
        }
      }

      // Hitung finalPrice untuk setiap variant jika ada
      const dataToUpdate = { ...dto };
      // if (dataToUpdate.variants) {
      //   dataToUpdate.variants = dataToUpdate.variants.map(
      //     (variant) => ({
      //       ...variant,
      //       finalPrice:
      //         variant.price -
      //         (variant.price * variant.discount) / 100,
      //     })
      //   );
      // }

      const updatedOrder = await this.repository.update(
        id,
        dataToUpdate
      );

      if (!updatedOrder) {
        throw new Error('Gagal memperbarui order');
      }

      return updatedOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal memperbarui order: ${error.message}`
      );
    }
  }

  /**
   * Soft delete order
   */
  async remove(id: string) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error(
          'Order tidak ditemukan untuk dihapus'
        );
      }

      const deletedOrder =
        await this.repository.softDelete(id);

      if (!deletedOrder) {
        throw new Error('Gagal menghapus order');
      }

      return deletedOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal menghapus order: ${error.message}`
      );
    }
  }

  /**
   * Restore soft-deleted order
   */
  async restore(id: string) {
    try {
      const order = await this.repository.findById(id);
      if (!order) {
        throw new Error('Order tidak ditemukan');
      }

      const restoredOrder =
        await this.repository.restore(id);

      if (!restoredOrder) {
        throw new Error('Gagal memulihkan order');
      }

      return restoredOrder;
    } catch (error: any) {
      throw new Error(
        `Gagal memulihkan order: ${error.message}`
      );
    }
  }

  /**
   * Get orders by platform
   */
  async getByPlatform(platform: string) {
    try {
      return await this.repository.findByPlatform(platform);
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order dari platform: ${error.message}`
      );
    }
  }

  /**
   * Get active orders only
   */
  async getActive() {
    try {
      return await this.repository.findActive();
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order aktif: ${error.message}`
      );
    }
  }

  /**
   * Search orders
   */
  async search(query: string) {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      return await this.repository.search(query);
    } catch (error: any) {
      throw new Error(
        `Gagal mencari order: ${error.message}`
      );
    }
  }

  /**
   * Bulk update order status
   */
  async bulkUpdateStatus(dto: BulkUpdateStatusDTO) {
    try {
      const result = await this.repository.bulkUpdateStatus(
        dto.order_ids,
        dto.is_active
      );

      if (result.modifiedCount === 0) {
        throw new Error(
          'Tidak ada order yang berhasil diperbarui'
        );
      }

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} order berhasil diperbarui`,
      };
    } catch (error: any) {
      throw new Error(
        `Gagal memperbarui status order: ${error.message}`
      );
    }
  }

  // /**
  //  * Mass upload shopee orders
  //  * @param fileBuffer
  //  * @returns
  //  */
  // async massUploadShopeeProducts(
  //   fileBuffer: ArrayBuffer
  // ): Promise<MassUploadResponseDTO> {
  //   try {
  //     const orders =
  //       await parseMassProductsExcel(fileBuffer);

  //     if (orders.length === 0) {
  //       throw new Error(
  //         'Tidak ada data order yang valid di file Excel.'
  //       );
  //     }

  //     const ordersMap = new Map<
  //       string,
  //       ParsedOrderRow[]
  //     >();
  //     for (const order of orders) {
  //       const orderId = String(order.orderId);

  //       if (!ordersMap.has(orderId)) {
  //         ordersMap.set(orderId, []);
  //       }
  //       ordersMap.get(orderId)!.push(order);
  //     }

  //     let createdCount = 0;
  //     let updatedCount = 0;

  //     for (const [
  //       orderId,
  //       group,
  //     ] of ordersMap.entries()) {
  //       const variants = group.map((item) => ({
  //         variant_id: item.variantId,
  //         name: item.variantName || item.orderName || '-',
  //         key: `${orderId}::${item.variantId || '-'}`,
  //         price: item.price,
  //         // quantity: item.quantity ?? 0,
  //         discount: 0,
  //         finalPrice: 0,
  //         parent_sku: item.parentSKU,
  //         sku: item.SKU,
  //         gtin: item.GTIN,
  //       }));
  //       const existingOrder =
  //         await this.repository.findByProductId(orderId);
  //       const payload = {
  //         platform: PLATFORMS_KV.shopee,
  //         name: group[0]?.orderName || '',
  //         order_id: orderId,
  //         key: orderId,
  //         variants,
  //         is_active: true,
  //       };
  //       if (existingOrder) {
  //         await this.repository.update(
  //           existingOrder._id.toString(),
  //           payload
  //         );
  //         updatedCount++;
  //       } else {
  //         await this.repository.create(payload);
  //         createdCount++;
  //       }
  //     }

  //     return {
  //       created_count: createdCount,
  //       updated_count: updatedCount,
  //       total_rows: orders.length,
  //       total_orders: ordersMap.size,
  //     };
  //   } catch (error: any) {
  //     throw new Error(
  //       `Gagal memproses mass upload order: ${error.message}`
  //     );
  //   }
  // }

  /**
   * Mass upload shopee orders
   * @param fileBuffer
   * @returns
   */
  async massUploadShopeeOrders(
    fileBuffer: ArrayBuffer
  ): Promise<MassUploadResponseDTO> {
    try {
      const orders = await parseMassOrdersExcel(fileBuffer);

      if (orders.length === 0) {
        throw new Error(
          'Tidak ada data order yang valid di file Excel.'
        );
      }

      const ordersMap = new Map<string, ParsedOrderRow[]>();
      for (const order of orders) {
        const orderId = String(order.orderId);

        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, []);
        }
        ordersMap.get(orderId)!.push(order);
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const [orderId, group] of ordersMap.entries()) {
        console.log(`orderId: ${orderId}`);

        const variants = group.map((item) => ({
          // variant_id: item.variantId,
          // name: item.variantName || item.orderName || '-',
          // key: `${orderId}::${item.variantId || '-'}`,
          // price: item.price,
          // // quantity: item.quantity ?? 0,
          // discount: 0,
          // finalPrice: 0,
          // parent_sku: item.parentSKU,
          // sku: item.SKU,
          // gtin: item.GTIN,
        }));
        // const existingProduct =
        //   await this.repository.findById(orderId);
        // const payload = {
        //   platform: PLATFORMS_KV.shopee,
        //   name: group[0]?.orderName || '',
        //   order_id: orderId,
        //   key: orderId,
        //   variants,
        //   is_active: true,
        // };
        // if (existingProduct) {
        //   await this.repository.update(
        //     existingProduct._id.toString(),
        //     payload
        //   );
        //   updatedCount++;
        // } else {
        //   await this.repository.create(payload);
        //   createdCount++;
        // }
      }

      return {
        created_count: createdCount,
        updated_count: updatedCount,
        total_rows: orders.length,
        total_orders: ordersMap.size,
      };
    } catch (error: any) {
      throw new Error(
        `Gagal memproses mass upload order: ${error.message}`
      );
    }
  }

  /**
   * Count orders by platform
   */
  async countByPlatform(platform: string) {
    try {
      return await this.repository.countByPlatform(
        platform
      );
    } catch (error: any) {
      throw new Error(
        `Gagal menghitung order: ${error.message}`
      );
    }
  }
}
