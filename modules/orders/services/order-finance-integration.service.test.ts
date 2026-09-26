import { Types } from 'mongoose';
import type {
  FinanceInventoryReservationSyncResult,
  FinanceMarketplaceReleaseService,
  FinanceMarketplaceReleaseResponseDTO,
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

  it('normalizes signed marketplace fees only for Finance posting', async () => {
    const storedFee = {
      admin_fee: -9828,
      processing_fee: -1250,
      gox_fee: -3276,
      tax_pph22: -10,
    };
    let receivedInput: unknown;
    const releaseResult: FinanceMarketplaceReleaseResponseDTO =
      {
        id: 'release-1',
        status: 'blocked',
        source_order_id: 'ORDER-1',
        journal_entry_id: null,
        reason: 'Pajak ditunda.',
        expected_gross_amount: null,
        fee_amount: null,
        refund_amount: 0,
        released_amount: 0,
        reconciliation_difference: null,
      };
    const service = new OrderFinanceIntegrationService(
      { organizationId },
      {
        orderRepository: {
          findById: async () => ({
            ...order('selesai'),
            settlement_reference: 'SETTLEMENT-1',
            released_funds_at: '2026-09-01T00:00:00.000Z',
            released_funds: 0,
            fee: storedFee,
          }),
        },
        marketplaceReleaseService: {
          recordFromOrder: async (input) => {
            receivedInput = input;
            return releaseResult;
          },
        } satisfies Pick<
          FinanceMarketplaceReleaseService,
          'recordFromOrder'
        >,
      }
    );

    const sourceFileId = new Types.ObjectId();
    await service.recordMarketplaceRelease(
      String(orderDocumentId),
      sourceFileId
    );

    expect(receivedInput).toMatchObject({
      source_file_id: sourceFileId.toHexString(),
      fee: {
        admin_fee: 9828,
        processing_fee: 1250,
        gox_fee: 3276,
        tax_pph22: 10,
      },
    });
    expect(storedFee).toEqual({
      admin_fee: -9828,
      processing_fee: -1250,
      gox_fee: -3276,
      tax_pph22: -10,
    });
  });
});
