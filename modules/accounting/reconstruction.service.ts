import { AccountingDomainError } from './accounting.error';
import { AccountingLifecycleService } from './accounting-lifecycle.service';
import {
  getPeriodKeyFromDate,
  parseAccountingDate,
  type AccountingTenantContext,
} from './accounting.types';
import {
  OrderAccountingIntegrationService,
  type PostCompletedOrderInput,
} from '@/modules/orders/services/order-accounting-integration.service';
import { OrderRepository } from '@/modules/orders/order.repository';

type ReconstructionInput = Omit<
  PostCompletedOrderInput,
  'mode'
> & {
  confirm?: boolean;
};

export class AccountingReconstructionService {
  private readonly lifecycle: AccountingLifecycleService;
  private readonly orderAccounting: OrderAccountingIntegrationService;
  private readonly orderRepository: OrderRepository;

  constructor(
    private readonly context: AccountingTenantContext
  ) {
    this.lifecycle = new AccountingLifecycleService(
      context
    );
    this.orderAccounting =
      new OrderAccountingIntegrationService(context);
    this.orderRepository = new OrderRepository({
      organizationId: context.organizationId,
    });
  }

  async previewOrder(orderId: string) {
    await this.lifecycle.assertOwner();
    const state = await this.lifecycle.assertActive();
    if (!orderId.trim()) {
      throw new AccountingDomainError(
        'Order ID reconstruction wajib diisi.',
        'RECONSTRUCTION_ORDER_REQUIRED'
      );
    }

    const order =
      await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AccountingDomainError(
        'Order tidak ditemukan pada organization aktif.',
        'ORDER_NOT_FOUND'
      );
    }

    const blockers: string[] = [];
    if (order.accounting_status === 'posted') {
      blockers.push(
        'Order sudah memiliki posting accounting.'
      );
    }
    if (order.status !== 'selesai') {
      blockers.push(
        'Order harus berstatus selesai sebelum reconstruction.'
      );
    }
    if (!order.store) {
      blockers.push(
        'Order belum memiliki store/workspace.'
      );
    }
    if (!order.items || order.items.length === 0) {
      blockers.push('Order tidak memiliki item.');
    }

    const occurredAt = parseAccountingDate(
      order.completed_at ?? order.placed_at ?? new Date(),
      'completed_at'
    );
    const beforeCutover = Boolean(
      state.cutover_date && occurredAt < state.cutover_date
    );

    return {
      order_id: String(order._id),
      external_order_id: order.order_id,
      platform: order.platform,
      store_id: order.store
        ? String(order.store)
        : undefined,
      accounting_status:
        order.accounting_status ?? 'pending',
      transaction_date: occurredAt.toISOString(),
      period: getPeriodKeyFromDate(
        occurredAt,
        state.calendar_timezone
      ),
      cutover_date: state.cutover_date?.toISOString(),
      before_cutover: beforeCutover,
      mode: 'reconstruction' as const,
      requires_confirmation: true,
      can_reconstruct: blockers.length === 0,
      blockers,
      item_count: order.items?.length ?? 0,
    };
  }

  async reconstructOrder(
    orderId: string,
    input: ReconstructionInput = {}
  ) {
    await this.lifecycle.assertOwner();
    await this.lifecycle.assertActive(input.session);
    if (!orderId.trim()) {
      throw new AccountingDomainError(
        'Order ID reconstruction wajib diisi.',
        'RECONSTRUCTION_ORDER_REQUIRED'
      );
    }
    if (input.confirm !== true) {
      throw new AccountingDomainError(
        'Reconstruction membutuhkan konfirmasi eksplisit setelah preview.',
        'RECONSTRUCTION_CONFIRMATION_REQUIRED'
      );
    }
    const postingInput = { ...input };
    delete postingInput.confirm;
    return this.orderAccounting.postCompletedOrder(
      orderId,
      {
        ...postingInput,
        mode: 'reconstruction',
      }
    );
  }
}
