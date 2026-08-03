import { INCOME_FIELD_MAP } from './map';

export type IncomeFieldKey = keyof typeof INCOME_FIELD_MAP;
export type ParsedIncomeRow = Record<
  IncomeFieldKey,
  ReturnType<
    (typeof INCOME_FIELD_MAP)[IncomeFieldKey]['parser']
  >
>;
