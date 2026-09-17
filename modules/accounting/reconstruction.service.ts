import { AccountingDomainError } from './accounting.error';
import { AccountingLifecycleService } from './accounting-lifecycle.service';
import type { AccountingTenantContext } from './accounting.types';
import {
  OrderAccountingIntegrationService,
  type PostCompletedOrderInput,
} from '@/modules/orders/services/order-accounting-integration.service';

export class AccountingReconstructionService {
  private readonly lifecycle: AccountingLifecycleService;
  private readonly orderAccounting: OrderAccountingIntegrationService;

  constructor(
    private readonly context: AccountingTenantContext
  ) {
    this.lifecycle = new AccountingLifecycleService(
      context
    );
    this.orderAccounting =
      new OrderAccountingIntegrationService(context);
  }

  async reconstructOrder(
    orderId: string,
    input: Omit<PostCompletedOrderInput, 'mode'> = {}
  ) {
    await this.lifecycle.assertOwner();
    await this.lifecycle.assertActive(input.session);
    if (!orderId.trim()) {
      throw new AccountingDomainError(
        'Order ID reconstruction wajib diisi.',
        'RECONSTRUCTION_ORDER_REQUIRED'
      );
    }
    return this.orderAccounting.postCompletedOrder(
      orderId,
      {
        ...input,
        mode: 'reconstruction',
      }
    );
  }
}
