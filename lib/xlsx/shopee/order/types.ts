import { ORDER_FIELD_MAP } from './map';

export type OrderFieldKey = keyof typeof ORDER_FIELD_MAP;

export type ParsedOrderRow = Record<
  OrderFieldKey,
  ReturnType<
    (typeof ORDER_FIELD_MAP)[OrderFieldKey]['parser']
  >
>;
