import { Types } from 'mongoose';
import type {
  FinanceInventoryReservationSyncResult,
  FinanceMarketplaceReleaseService,
  FinanceSalesWorkflowResultDTO,
} from '@/modules/finance';
import { OrderFinanceIntegrationService } from './order-finance-integration.service';

const organizationId = '507f1f77bcf86cd799439010';
const orderDocumentId = new Types.ObjectId();

const order = (status: string) => ({
  _id: orderDocumentId,
  order_id: 'ORDER-1',
  store: new Types.ObjectId('507f1f77bcf86cd799439011'),
  platform: 'shopee' as const,
  status,
  placed_at: '2026-09-24T00:00:00.000Z',
  completed_at:
    status === 'selesai'
      ? '2026-09-24T01:00:00.000Z'
      : undefined,
  total_gross_sales: 100000,
  items: [
    {
      product: new Types.ObjectId(
        '507f1f77bcf86cd799439012'
      ),
      variation_id: 'VAR-1',
      quantity: 1,
      final_quantity: 1,
      subtotal: 100000,
    },
  ],
});

const reservationResult: FinanceInventoryReservationSyncResult =
  {
    status: 'synced',
    source_order_id: 'ORDER-1',
    active_count: 1,
    released_count: 0,
    consumed_count: 0,
    review_count: 0,
    reason: null,
  };

describe('OrderFinanceIntegrationService', () => {
  it('syncs inventory after completed sales posting', async () => {
    const sequence: string[] = [];
    const workflowResult: FinanceSalesWorkflowResultDTO = {
      status: 'posted',
      mode: 'automatic',
      source_order_id: 'ORDER-1',
      transaction_id: String(new Types.ObjectId()),
      journal_entry_id: String(new Types.ObjectId()),
      reason: null,
    };
    const service = new OrderFinanceIntegrationService(
      { organizationId },
      {
        orderRepository: {
          findById: async () => order('selesai'),
        },
        workflowService: {
          process: async () => {
            sequence.push('sales');
            return workflowResult;
          },
        },
        inventoryReservationService: {
          sync: async () => {
            sequence.push('inventory');
            return reservationResult;
          },
        },
        marketplaceReleaseService: {
          recordFromOrder: async () => {
            throw new Error('Not used in this test.');
          },
        } satisfies Pick<
          FinanceMarketplaceReleaseService,
          'recordFromOrder'
        >,
      }
    );

    const result = await service.postCompletedOrder(
      String(orderDocumentId)
    );

    expect(result.status).toBe('posted');
    expect(sequence).toEqual(['sales', 'inventory']);
  });

  it('syncs a reservable order without posting sales', async () => {
    const service = new OrderFinanceIntegrationService(
      { organizationId },
      {
        orderRepository: {
          findById: async () => order('perlu-dikirim'),
        },
        workflowService: {
          process: async () => {
            throw new Error('Sales workflow must not run.');
          },
        },
        inventoryReservationService: {
          sync: async (projection) => ({
            ...reservationResult,
            source_order_id: projection.source_order_id,
          }),
        },
        marketplaceReleaseService: {
          recordFromOrder: async () => {
            throw new Error('Not used in this test.');
          },
        } satisfies Pick<
          FinanceMarketplaceReleaseService,
          'recordFromOrder'
        >,
      }
    );

    const result = await service.syncInventoryLifecycle(
      String(orderDocumentId)
    );

    expect(result).toMatchObject({
      status: 'synced',
      source_order_id: 'ORDER-1',
    });
  });
});
