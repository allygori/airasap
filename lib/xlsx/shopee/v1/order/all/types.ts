import { ALL_ORDER_FIELD_MAP } from './map';

export type AllOrderFieldKey =
  keyof typeof ALL_ORDER_FIELD_MAP;

export type ParsedAllOrderRow = Record<
  AllOrderFieldKey,
  ReturnType<
    (typeof ALL_ORDER_FIELD_MAP)[AllOrderFieldKey]['parser']
  >
>;
