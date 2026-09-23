import type {
  FinanceSalesPostingDecisionDTO,
  FinanceSalesProjectionDTO,
} from './finance-sales.dto';
import { FinanceSalesPostingDecisionSchema } from './finance-sales.schema';

const COMPLETED_ORDER_STATUS = 'selesai';

export class FinanceSalesPostingRulesService {
  evaluate(
    projection: FinanceSalesProjectionDTO
  ): FinanceSalesPostingDecisionDTO {
    if (
      projection.source_status !== COMPLETED_ORDER_STATUS
    ) {
      return this.decision({
        decision: 'not_eligible',
        source_order_id: projection.source_order_id,
        source_status: projection.source_status,
        event: null,
        reason_code: 'ORDER_STATUS_NOT_ELIGIBLE',
        message:
          'Order belum berstatus selesai untuk posting sales Finance.',
        intent: null,
      });
    }

    if (
      projection.lines.some(
        (line) => line.returned_quantity > 0
      )
    ) {
      return this.decision({
        decision: 'blocked',
        source_order_id: projection.source_order_id,
        source_status: projection.source_status,
        event: 'completed_order',
        reason_code: 'RETURN_REFUND_UNSUPPORTED',
        message:
          'Order memiliki retur/refund; koreksi penjualan Finance belum tersedia.',
        intent: null,
      });
    }

    if (projection.readiness !== 'ready') {
      return this.decision({
        decision: 'blocked',
        source_order_id: projection.source_order_id,
        source_status: projection.source_status,
        event: 'completed_order',
        reason_code: 'PROJECTION_INCOMPLETE',
        message:
          'Data order belum lengkap untuk menyiapkan posting sales Finance.',
        intent: null,
      });
    }

    if (
      projection.sales_amount === null ||
      projection.sales_amount <= 0 ||
      projection.transaction_date === null
    ) {
      return this.decision({
        decision: 'blocked',
        source_order_id: projection.source_order_id,
        source_status: projection.source_status,
        event: 'completed_order',
        reason_code: 'SALES_AMOUNT_INVALID',
        message:
          'Nilai dan tanggal transaksi order belum valid untuk posting sales Finance.',
        intent: null,
      });
    }

    const amount = projection.sales_amount;
    const transactionDate = projection.transaction_date;

    return this.decision({
      decision: 'eligible',
      source_order_id: projection.source_order_id,
      source_status: projection.source_status,
      event: 'completed_order',
      reason_code: null,
      message:
        'Order selesai siap dibuatkan intent journal sales Finance.',
      intent: {
        source_order_id: projection.source_order_id,
        source_order_number: projection.source_order_number,
        source_event: 'completed_order',
        transaction_date: transactionDate,
        currency: projection.currency,
        description: `Penjualan ${projection.platform} ${projection.source_order_number}`,
        idempotency_key: `finance-sales:completed:${projection.source_order_id}`,
        lines: [
          {
            account_role: 'marketplace_receivable',
            debit: amount,
            credit: 0,
          },
          {
            account_role: 'sales_revenue',
            debit: 0,
            credit: amount,
          },
        ],
        inventory_cogs: {
          status: 'deferred',
          reason:
            'Inventory movement dan HPP diproses melalui Plan 05 agar tidak tercampur dengan rule sales.',
        },
      },
    });
  }

  private decision(value: FinanceSalesPostingDecisionDTO) {
    return FinanceSalesPostingDecisionSchema.parse(value);
  }
}
