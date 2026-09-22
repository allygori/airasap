export type FinanceErrorCode =
  | 'FINANCE_TENANT_REQUIRED'
  | 'FINANCE_ORGANIZATION_NOT_FOUND'
  | 'FINANCE_NOT_ACTIVE'
  | 'FINANCE_OWNER_REQUIRED'
  | 'FINANCE_ONBOARDING_ALREADY_COMPLETED'
  | 'FINANCE_LIFECYCLE_CONFLICT'
  | 'FINANCE_ACCOUNT_NOT_SELECTABLE'
  | 'FINANCE_JOURNAL_ACCOUNT_NOT_SELECTABLE'
  | 'FINANCE_JOURNAL_IDEMPOTENCY_CONFLICT'
  | 'FINANCE_JOURNAL_CREATE_CONFLICT';

export class FinanceDomainError extends Error {
  readonly code: FinanceErrorCode;

  constructor(message: string, code: FinanceErrorCode) {
    super(message);
    this.name = 'FinanceDomainError';
    this.code = code;
  }
}
