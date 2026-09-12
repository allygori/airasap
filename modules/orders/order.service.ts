/**
 * Order Service
 * Handles business logic for order operations
 */

import Fuse from 'fuse.js';
import { OrderRepository } from './order.repository';
import {
  CreateOrderDTO,
  UpdateOrderDTO,
  OrderFilterDTO,
  BulkUpdateStatusDTO,
  MassUploadResponseDTO,
} from './order.dto';
import { ProductService } from '../products/product.service';
import { StoreService } from '@/modules/stores/store.service';
import { OrderPlatform } from '@/constant/order-platform';

import {
  applyReleasedFundsFinancialsToItems,
  calculateOrderItemFinancials,
  calculateReleasedFundsAmount,
  cleanOrderItemFinancialFields,
  getCancelledBy,
  getBuyerUsername,
  toNumber,
  valueOrEmpty,
} from './services/utils';
import { massUploadAllOrderShopeeV1 as runAllOrderImport } from './services/mass-upload-all-order-shopee-v1.service';
import { massUploadEnrichWithOrderCompletedShopeeV1 as runCompletedOrderEnrichment } from './services/enrich-order-completed-shopee-v1.service';
import { enrichWithReleasedFunds as runReleasedFundsEnrichment } from './services/enrich-released-funds.service';

export class OrderService {
  private tenantContext;
  private repository: OrderRepository;
  private productService: ProductService;
  private storeService: StoreService;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
    userId?: string;
  }) {
    this.tenantContext = tenantContext;
    this.repository = new OrderRepository(tenantContext);
    this.productService = new ProductService(tenantContext);
    this.storeService = new StoreService(tenantContext);
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
      const queryFilter: any = {
        deleted_at: null,
      };

      if (filter.platform) {
        queryFilter.platform = filter.platform;
      }

      if (filter.status) {
        queryFilter.status = filter.status;
      }

      if (filter.date_from || filter.date_to) {
        queryFilter.placed_at = {};

        if (filter.date_from) {
          queryFilter.placed_at.$gte = new Date(
            filter.date_from
          );
        }

        if (filter.date_to) {
          const endDate = new Date(filter.date_to);
          endDate.setHours(23, 59, 59, 999);
          queryFilter.placed_at.$lte = endDate;
        }
      }

      const search = filter.search || filter.q;

      return await this.repository.findWithPagination(
        filter.page || 1,
        filter.limit || 10,
        queryFilter,
        filter.sort,
        filter.populate,
        search,
        filter.search_field
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
  async getById(id: string, populate?: string) {
    try {
      const order = await this.repository.findById(
        id,
        populate
      );
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
   * Get order by order_id (unique identifier from marketplace platform)
   */
  async getByOrderId(orderId: string, populate?: string) {
    try {
      const order = await this.repository.findByOrderId(
        orderId,
        populate
      );
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
      const existingOrder =
        await this.repository.findByOrderId(dto.order_id);
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
          await this.repository.findByOrderId(dto.order_id);
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
   * Overwrite order
   */
  async overwrite(id: string, dto: UpdateOrderDTO) {
    try {
      // console.log(
      //   `overwrite: ${id}`,
      //   JSON.stringify(dto, null, 2)
      // );

      const data = { ...dto };
      data.items = (data?.items || []).map((item) => {
        const productCost = item.product_cost || 0;
        const financials = calculateOrderItemFinancials({
          priceAfterDiscount:
            item?.price_after_discount || 0,
          quantity: item.quantity || 0,
          returnedQuantity: item.returned_quantity || 0,
          subtotal: item.subtotal || 0,
          productCostUnit: productCost,
        });

        return cleanOrderItemFinancialFields({
          ...item,
          ...financials,
        });
      });
      if (toNumber(data.released_funds) !== 0) {
        data.items = applyReleasedFundsFinancialsToItems(
          data.items,
          toNumber(data.released_funds)
        ) as typeof data.items;
      }
      data.total_product_cost = data.items.reduce(
        (acc, item) => acc + (item.total_product_cost || 0),
        0
      );
      data.total_gross_sales = data.items.reduce(
        (acc, item) => acc + (item.gross_sales || 0),
        0
      );
      data.total_net_sales = data.items.reduce(
        (acc, item) => acc + (item.net_sales || 0),
        0
      );
      data.total_gross_profit = data.items.reduce(
        (acc, item) => acc + (item.gross_profit || 0),
        0
      );
      data.total_net_profit = data.items.reduce(
        (acc, item) => acc + (item.net_profit || 0),
        0
      );
      // data.total_profit = data.total_net_profit;
      // data.total_net_profit = data.total_profit;

      const updatedOrder = await this.repository.overwrite(
        id,
        data
      );

      if (!updatedOrder) {
        throw new Error('Gagal memperbarui order');
      }

      return updatedOrder;

      // return true;
    } catch (error: any) {
      console.error(
        `[OrderService.overwrite] error: `,
        error
      );
      throw new Error(
        `Gagal memperbarui order: ${error.message}`
      );
    }

    // try {
    //   const order = await this.repository.findById(id);
    //   if (!order) {
    //     throw new Error(
    //       'Order tidak ditemukan untuk diperbarui'
    //     );
    //   }

    //   // Jika order_id diubah, validasi keunikan
    //   if (dto.order_id && dto.order_id !== order.order_id) {
    //     const existingOrder =
    //       await this.repository.findByOrderId(dto.order_id);
    //     if (existingOrder) {
    //       throw new Error(
    //         `Order dengan ID '${dto.order_id}' sudah ada`
    //       );
    //     }
    //   }

    //   // Hitung finalPrice untuk setiap variant jika ada
    //   const dataToUpdate = { ...dto };
    //   // if (dataToUpdate.variants) {
    //   //   dataToUpdate.variants = dataToUpdate.variants.map(
    //   //     (variant) => ({
    //   //       ...variant,
    //   //       finalPrice:
    //   //         variant.price -
    //   //         (variant.price * variant.discount) / 100,
    //   //     })
    //   //   );
    //   // }

    //   const updatedOrder = await this.repository.update(
    //     id,
    //     dataToUpdate
    //   );

    //   if (!updatedOrder) {
    //     throw new Error('Gagal memperbarui order');
    //   }

    //   return updatedOrder;
    // } catch (error: any) {
    //   throw new Error(
    //     `Gagal memperbarui order: ${error.message}`
    //   );
    // }
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
  async getByPlatform(platform: OrderPlatform) {
    try {
      return await this.repository.findByPlatform(platform);
    } catch (error: any) {
      throw new Error(
        `Gagal mengambil order dari platform: ${error.message}`
      );
    }
  }

  /**
   * Count orders by platform
   */
  async countByPlatform(platform: OrderPlatform) {
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

  // async removeDeprecatedItemProfitField() {
  //   return await this.repository.unsetDeprecatedItemProfitField();
  // }

  /**
   * Mass upload all order from shopee
   * @param fileBuffer
   * @returns
   */
  async massUploadAllOrderShopeeV1(
    fileBuffer: ArrayBuffer
  ): Promise<MassUploadResponseDTO> {
    return runAllOrderImport(
      {
        repository: this.repository,
        productService: this.productService,
        tenantContext: this.tenantContext,
      },
      fileBuffer
    );
  }

  /**
   * Mass upload enriched data from shopee order completed
   * @param fileBuffer
   * @returns
   */
  async massUploadEnrichWithOrderCompletedShopeeV1(
    fileBuffer: ArrayBuffer,
    fileId: string
  ): Promise<MassUploadResponseDTO> {
    return runCompletedOrderEnrichment(
      {
        repository: this.repository,
        productService: this.productService,
        tenantContext: this.tenantContext,
      },
      fileBuffer,
      fileId
    );
  }

  /**
   * Enrich order data with released income data from shopee xlsx
   */
  async enrichWithReleasedFunds(
    fileBuffer: ArrayBuffer,
    fileId: string
  ) {
    return runReleasedFundsEnrichment(
      {
        repository: this.repository,
        productService: this.productService,
        storeService: this.storeService,
        tenantContext: this.tenantContext,
      },
      fileBuffer,
      fileId
    );
  }
}
