import { SELLER_FEE_FIELD_MAP } from './map';

export type SellerFeeFieldKey =
  keyof typeof SELLER_FEE_FIELD_MAP;
export type ParsedSellerFeeRow = Record<
  SellerFeeFieldKey,
  ReturnType<
    (typeof SELLER_FEE_FIELD_MAP)[SellerFeeFieldKey]['parser']
  >
>;
