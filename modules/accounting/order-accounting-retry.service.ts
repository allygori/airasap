import { AccountingDomainError } from './accounting.error';
import { assertAccountingModuleActive } from './accounting-module.guard';
import type { AccountingTenantContext } from './accounting.types';
import { OrderRepository } from '@/modules/orders/order.repository';
import { OrderAccountingIntegrationService } from '@/modules/orders/services/order-accounting-integration.service';

export type RetryAccountingOrdersInput = {
  limit?: number;
  locationId?: string;
};

export class AccountingOrderRetryService {
  private readonly orderRepository: OrderRepository;
  private readonly integration: OrderAccountingIntegrationService;

  constructor(
    private readonly context: AccountingTenantContext
  ) {
    this.orderRepository = new OrderRepository({
      organizationId: context.organizationId,
    });
    this.integration =
      new OrderAccountingIntegrationService(context);
  }

  async retry(input: RetryAccountingOrdersInput = {}) {
    await assertAccountingModuleActive(this.context);
    const limit = input.limit ?? 25;
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new AccountingDomainError(
        'Limit retry order harus antara 1 sampai 100.',
        'ORDER_RETRY_LIMIT_INVALID'
      );
    }

    const orders =
      await this.orderRepository.findAccountingCandidates(
        limit
      );
    const results: Array<{
      order_id: string;
      status: 'posted' | 'blocked';
      journal_entry_id?: string;
      error?: string;
    }> = [];

    for (const order of orders) {
      try {
        const result =
          await this.integration.postCompletedOrder(
            String(order._id),
            { location_id: input.locationId }
          );
        results.push({
          order_id: String(order.order_id),
          status: 'posted',
          ...(result.journal_entry_id
            ? { journal_entry_id: result.journal_entry_id }
            : {}),
        });
      } catch (error) {
        results.push({
          order_id: String(order.order_id),
          status: 'blocked',
          error:
            error instanceof Error
              ? error.message
              : 'Order gagal diintegrasikan ke accounting.',
        });
      }
    }

    return {
      requested: limit,
      selected: orders.length,
      posted: results.filter(
        (result) => result.status === 'posted'
      ).length,
      blocked: results.filter(
        (result) => result.status === 'blocked'
      ).length,
      results,
    };
  }
}
