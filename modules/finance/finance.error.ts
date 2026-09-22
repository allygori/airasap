export type FinanceErrorCode =
  | 'FINANCE_TENANT_REQUIRED'
  | 'FINANCE_ORGANIZATION_NOT_FOUND'
  | 'FINANCE_NOT_ACTIVE';

export class FinanceDomainError extends Error {
  readonly code: FinanceErrorCode;

  constructor(message: string, code: FinanceErrorCode) {
    super(message);
    this.name = 'FinanceDomainError';
    this.code = code;
  }
}
