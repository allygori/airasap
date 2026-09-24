import type {
  FinanceSalesPostingDecisionDTO,
  FinanceSalesProjectionDTO,
} from './finance-sales.dto';
import { makeFinanceSalesIdempotencyKey } from './finance-sales.keys';
import { FinanceSalesPostingDecisionSchema } from './finance-sales.schema';

const COMPLETED_ORDER_STATUS = 'selesai';

export class FinanceSalesPostingRulesService {
  evaluate(
    projection: FinanceSalesProjectionDTO,
    options?: { payment_account_id?: string }
  ): FinanceSalesPostingDecisionDTO {
    const isOfflineSale = projection.platform === 'offline';
    const paymentAccountId = options?.payment_account_id;
    const event = isOfflineSale
      ? 'offline_sale'
      : 'completed_order';

    if (
      !isOfflineSale &&
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
        event,
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
        event,
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
        event,
        reason_code: 'SALES_AMOUNT_INVALID',
        message:
          'Nilai dan tanggal transaksi order belum valid untuk posting sales Finance.',
        intent: null,
      });
    }

    if (isOfflineSale && !paymentAccountId) {
      return this.decision({
        decision: 'blocked',
        source_order_id: projection.source_order_id,
        source_status: projection.source_status,
        event,
        reason_code: 'PAYMENT_ACCOUNT_REQUIRED',
        message:
          'Pilih akun Kas, Bank, atau E-wallet untuk penjualan offline.',
        intent: null,
      });
    }

    const amount = projection.sales_amount;
    const transactionDate = projection.transaction_date;

    return this.decision({
      decision: 'eligible',
      source_order_id: projection.source_order_id,
      source_status: projection.source_status,
      event,
      reason_code: null,
      message: isOfflineSale
        ? 'Penjualan offline siap dibuatkan journal Finance.'
        : 'Order selesai siap dibuatkan intent journal sales Finance.',
      intent: {
        source_order_id: projection.source_order_id,
        source_order_number: projection.source_order_number,
        source_event: event,
        transaction_date: transactionDate,
        currency: projection.currency,
        description: isOfflineSale
          ? `Penjualan offline ${projection.source_order_number}`
          : `Penjualan ${projection.platform} ${projection.source_order_number}`,
        idempotency_key: makeFinanceSalesIdempotencyKey(
          projection,
          isOfflineSale ? 'offline-sale' : 'completed'
        ),
        lines: isOfflineSale
          ? [
              {
                account_id: paymentAccountId ?? '',
                debit: amount,
                credit: 0,
              },
              {
                account_role: 'sales_revenue',
                debit: 0,
                credit: amount,
              },
            ]
          : [
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
