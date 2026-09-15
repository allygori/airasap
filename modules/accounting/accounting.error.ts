export class AccountingDomainError extends Error {
  readonly code: string;

  constructor(
    message: string,
    code = 'ACCOUNTING_DOMAIN_ERROR'
  ) {
    super(message);
    this.name = 'AccountingDomainError';
    this.code = code;
  }
}
