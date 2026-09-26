import { Types } from 'mongoose';
import type { OrderPlatform } from '@/constant/order-platform';
import {
  FinanceDomainError,
  FinanceSalesProjectionService,
  FinanceSalesWorkflowService,
  FinanceMarketplaceReleaseService,
  FinanceInventoryReservationService,
  type FinanceSalesProjectionDTO,
  type FinanceSalesWorkflowResultDTO,
  type FinanceMarketplaceReleaseResponseDTO,
  type FinanceMarketplaceReleaseSourceInputDTO,
  type FinanceTenantContext,
  type FinanceInventoryReservationSyncResult,
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

type OrderRepositoryPort = {
  findById(orderId: string): Promise<unknown>;
};

type FinanceMarketplaceReleasePort = Pick<
  FinanceMarketplaceReleaseService,
  'recordFromOrder'
>;

type FinanceInventoryReservationPort = Pick<
  FinanceInventoryReservationService,
  'sync'
>;

const toObjectIdString = (
  value: unknown
): string | undefined => {
  if (value instanceof Types.ObjectId) {
    return value.toHexString();
  }

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

const toAbsoluteFeeAmount = (amount: number | undefined) =>
  amount === undefined ? undefined : Math.abs(amount);

// Shopee stores marketplace deductions as negative amounts. Finance journal
// lines represent fee expenses as positive debit magnitudes, so normalize a
// copy at this integration boundary and leave the stored Orders values intact.
const toFinanceMarketplaceReleaseFee = (
  fee:
    | FinanceMarketplaceReleaseSourceInputDTO['fee']
    | undefined
): FinanceMarketplaceReleaseSourceInputDTO['fee'] => ({
  admin_fee: toAbsoluteFeeAmount(fee?.admin_fee),
  processing_fee: toAbsoluteFeeAmount(fee?.processing_fee),
  affiliate_fee: toAbsoluteFeeAmount(fee?.affiliate_fee),
  gox_fee: toAbsoluteFeeAmount(fee?.gox_fee),
  service_fee: toAbsoluteFeeAmount(fee?.service_fee),
  shipping_saver_program_fee: toAbsoluteFeeAmount(
    fee?.shipping_saver_program_fee
  ),
  transaction_fee: toAbsoluteFeeAmount(
    fee?.transaction_fee
  ),
  campaign_fee: toAbsoluteFeeAmount(fee?.campaign_fee),
  other_fee: toAbsoluteFeeAmount(fee?.other_fee),
  premium_fee: toAbsoluteFeeAmount(fee?.premium_fee),
  fbs_fee: toAbsoluteFeeAmount(fee?.fbs_fee),
  tax_pph22: toAbsoluteFeeAmount(fee?.tax_pph22),
  import_duty_vat_income_tax: toAbsoluteFeeAmount(
    fee?.import_duty_vat_income_tax
  ),
  auto_top_up_fee_from_income: toAbsoluteFeeAmount(
    fee?.auto_top_up_fee_from_income
  ),
  return_shipping_fee: toAbsoluteFeeAmount(
    fee?.return_shipping_fee
  ),
  return_to_sender_shipping_fee: toAbsoluteFeeAmount(
    fee?.return_to_sender_shipping_fee
  ),
  shipping_fee_refund: toAbsoluteFeeAmount(
    fee?.shipping_fee_refund
  ),
  refund_to_buyer: toAbsoluteFeeAmount(
    fee?.refund_to_buyer
  ),
});

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
  private readonly inventoryReservationService: FinanceInventoryReservationPort;

  constructor(
    private readonly context: FinanceTenantContext,
    dependencies?: {
      orderRepository?: OrderRepositoryPort;
      projectionService?: FinanceProjectionPort;
      workflowService?: FinanceWorkflowPort;
      marketplaceReleaseService?: FinanceMarketplaceReleasePort;
      inventoryReservationService?: FinanceInventoryReservationPort;
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
    this.inventoryReservationService =
      dependencies?.inventoryReservationService ??
      new FinanceInventoryReservationService(context);
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

    const result = await this.workflowService.process(
      projection,
      {
        mode: 'automatic',
      }
    );
    await this.inventoryReservationService.sync(projection);
    return result;
  }

  async syncInventoryLifecycle(
    orderId: string
  ): Promise<FinanceInventoryReservationSyncResult> {
    const order =
      await this.orderRepository.findById(orderId);
    if (!order) {
      throw new FinanceDomainError(
        'Order tidak ditemukan pada organization aktif.',
        'FINANCE_SALES_SOURCE_NOT_FOUND'
      );
    }

    const projection = this.projectionService.projectOrder(
      toProjectionInput(
        this.context,
        order as unknown as OrderFinanceSource
      )
    );
    return this.inventoryReservationService.sync(
      projection
    );
  }

  async recordMarketplaceRelease(
    orderId: string,
    sourceFileId?: string | Types.ObjectId
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
    const normalizedSourceFileId =
      toObjectIdString(sourceFileId);
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
      ...(normalizedSourceFileId
        ? { source_file_id: normalizedSourceFileId }
        : {}),
      has_returns:
        source.marketplace_return_detected === true ||
        (source.items ?? []).some(
          (item) => (item.returned_quantity ?? 0) > 0
        ),
      fee: toFinanceMarketplaceReleaseFee(source.fee),
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
