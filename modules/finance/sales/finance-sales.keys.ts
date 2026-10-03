type FinanceSalesOrderIdentity = {
  platform: string;
  store_id: string | null;
  source_order_id: string;
};

const keyPart = (value: string | null | undefined) =>
  encodeURIComponent(value ?? '');

export const makeFinanceSalesIdempotencyKey = (
  source: FinanceSalesOrderIdentity,
  event: 'completed' | 'offline-sale' = 'completed'
) =>
  `finance-sales:${event}:${keyPart(source.platform)}:${keyPart(source.store_id)}:${keyPart(source.source_order_id)}`;

export const makeFinanceSalesCogsIdempotencyKey = (
  source: FinanceSalesOrderIdentity & {
    source_line_id: string;
  }
) =>
  `finance-sales-cogs:${keyPart(source.platform)}:${keyPart(source.store_id)}:${keyPart(source.source_order_id)}:${keyPart(source.source_line_id)}`;

export const makeFinanceSalesCogsRetryJournalIdempotencyKey =
  (transactionId: string) =>
    `finance-sales-cogs-retry:${keyPart(transactionId)}`;
