import { Types } from 'mongoose';
import type { OrderPlatform } from '@/constant/order-platform';
import {
  FinanceDomainError,
  FinanceSalesProjectionService,
  FinanceSalesWorkflowService,
  FinanceMarketplaceReleaseService,
  type FinanceSalesProjectionDTO,
  type FinanceSalesWorkflowResultDTO,
  type FinanceMarketplaceReleaseResponseDTO,
  type FinanceMarketplaceReleaseSourceInputDTO,
  type FinanceTenantContext,
} from '@/modules/finance';
import { OrderRepository } from '../order.repository';

type OrderFinanceSourceLine = {
  product?: unknown;
  product_id?: string;
  variation_id?: string;
  product_name?: string;
  variation_name?: string;
  parent_sku?: string;
  child_sku?: string;
  quantity?: number;
  returned_quantity?: number;
  final_quantity?: number;
  subtotal?: number;
  gross_sales?: number;
  net_sales?: number;
  product_cost?: number;
  total_product_cost?: number;
};

type OrderFinanceSource = {
  order_id?: string;
  store?: unknown;
  platform?: OrderPlatform;
  status?: string;
  marketplace_return_detected?: boolean;
  placed_at?: Date | string;
  completed_at?: Date | string;
  total_gross_sales?: number;
  order_subtotal?: number;
  items?: OrderFinanceSourceLine[];
};

type FinanceProjectionPort = Pick<
  FinanceSalesProjectionService,
  'projectOrder'
>;

type FinanceWorkflowPort = Pick<
  FinanceSalesWorkflowService,
  'process'
>;

type OrderRepositoryPort = Pick<
  OrderRepository,
  'findById'
>;

type FinanceMarketplaceReleasePort = Pick<
  FinanceMarketplaceReleaseService,
  'recordFromOrder'
>;

const toObjectIdString = (
  value: unknown
): string | undefined => {
  if (
    value &&
    typeof value === 'object' &&
    '_id' in value
  ) {
    return toObjectIdString(value._id);
  }

  if (value === undefined || value === null)
    return undefined;
  const id = String(value);
  return Types.ObjectId.isValid(id) ? id : undefined;
};

const toProjectionInput = (
  context: FinanceTenantContext,
  order: OrderFinanceSource
) => ({
  source_order_id: order.order_id ?? '',
  source_order_number: order.order_id ?? '',
  organization_id: context.organizationId,
  store_id: toObjectIdString(order.store),
  platform: order.platform,
  status: order.status,
  currency: 'IDR',
  placed_at: order.placed_at,
  completed_at: order.completed_at,
  total_gross_sales: order.total_gross_sales,
  order_subtotal: order.order_subtotal,
  items: (order.items ?? []).map((item) => ({
    product_reference_id: toObjectIdString(item.product),
    product_id: item.product_id,
    variation_id: item.variation_id,
    product_name: item.product_name,
    variation_name: item.variation_name,
    parent_sku: item.parent_sku,
    child_sku: item.child_sku,
    quantity: item.quantity,
    returned_quantity: item.returned_quantity,
    final_quantity: item.final_quantity,
    subtotal: item.subtotal,
    gross_sales: item.gross_sales,
    net_sales: item.net_sales,
    product_cost: item.product_cost,
    total_product_cost: item.total_product_cost,
  })),
});

export class OrderFinanceIntegrationService {
  private readonly orderRepository: OrderRepositoryPort;
  private readonly projectionService: FinanceProjectionPort;
  private readonly workflowService: FinanceWorkflowPort;
  private readonly marketplaceReleaseService: FinanceMarketplaceReleasePort;

  constructor(
    private readonly context: FinanceTenantContext,
    dependencies?: {
      orderRepository?: OrderRepositoryPort;
      projectionService?: FinanceProjectionPort;
      workflowService?: FinanceWorkflowPort;
      marketplaceReleaseService?: FinanceMarketplaceReleasePort;
    }
  ) {
    this.orderRepository =
      dependencies?.orderRepository ??
      new OrderRepository({
        organizationId: context.organizationId,
      });
    this.projectionService =
      dependencies?.projectionService ??
      new FinanceSalesProjectionService(context);
    this.workflowService =
      dependencies?.workflowService ??
      new FinanceSalesWorkflowService(context);
    this.marketplaceReleaseService =
      dependencies?.marketplaceReleaseService ??
      new FinanceMarketplaceReleaseService(context);
  }

  async postCompletedOrder(
    orderId: string
  ): Promise<FinanceSalesWorkflowResultDTO> {
    const order =
      await this.orderRepository.findById(orderId);
    if (!order) {
      throw new FinanceDomainError(
        'Order tidak ditemukan pada organization aktif.',
        'FINANCE_SALES_SOURCE_NOT_FOUND'
      );
    }

    const source = order as unknown as OrderFinanceSource;
    const projection: FinanceSalesProjectionDTO =
      this.projectionService.projectOrder(
        toProjectionInput(this.context, source)
      );

    return this.workflowService.process(projection, {
      mode: 'automatic',
    });
  }

  async recordMarketplaceRelease(
    orderId: string,
    sourceFileId?: string
  ): Promise<FinanceMarketplaceReleaseResponseDTO> {
    const order =
      await this.orderRepository.findById(orderId);
    if (!order) {
      throw new FinanceDomainError(
        'Order tidak ditemukan pada organization aktif.',
        'FINANCE_SALES_SOURCE_NOT_FOUND'
      );
    }

    const source =
      order as unknown as OrderFinanceSource & {
        _id?: unknown;
        settlement_reference?: string;
        released_funds_at?: Date | string;
        released_funds?: number;
        fee?: FinanceMarketplaceReleaseSourceInputDTO['fee'];
      };
    const sourceOrderId = source.order_id ?? '';
    const platform = source.platform;
    if (!platform) {
      throw new FinanceDomainError(
        'Platform order tidak tersedia untuk pencatatan released funds.',
        'FINANCE_SALES_SOURCE_NOT_FOUND'
      );
    }
    const input: FinanceMarketplaceReleaseSourceInputDTO = {
      source_order_reference:
        toObjectIdString(source._id) ?? '',
      source_order_id: sourceOrderId,
      source_order_number: sourceOrderId,
      organization_id: this.context.organizationId,
      ...(toObjectIdString(source.store)
        ? { store_id: toObjectIdString(source.store) }
        : {}),
      platform,
      ...(source.settlement_reference
        ? {
            settlement_reference:
              source.settlement_reference,
          }
        : {}),
      ...(source.released_funds_at
        ? { released_at: source.released_funds_at }
        : {}),
      ...(source.released_funds !== undefined
        ? { released_amount: source.released_funds }
        : {}),
      ...(sourceFileId &&
      Types.ObjectId.isValid(sourceFileId)
        ? { source_file_id: sourceFileId }
        : {}),
      has_returns:
        source.marketplace_return_detected === true ||
        (source.items ?? []).some(
          (item) => (item.returned_quantity ?? 0) > 0
        ),
      fee: source.fee ?? {},
    };

    return this.marketplaceReleaseService.recordFromOrder(
      input
    );
  }
}

export const safeFinanceIntegrationError = (
  error: unknown
) =>
  error instanceof FinanceDomainError
    ? error.message
    : 'Terjadi kendala internal; order tetap tersimpan dan pencatatan Finance dapat ditinjau atau dicoba kembali.';

export const mapOrderToFinanceProjectionInput =
  toProjectionInput;
