import { COMPLETED_ORDER_FIELD_MAP } from './map';

export type CompletedOrderFieldKey =
  keyof typeof COMPLETED_ORDER_FIELD_MAP;

export type ParsedCompletedOrderRow = Record<
  CompletedOrderFieldKey,
  ReturnType<
    (typeof COMPLETED_ORDER_FIELD_MAP)[CompletedOrderFieldKey]['parser']
  >
>;
