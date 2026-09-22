import { FinanceDomainError } from '../finance.error';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';
import type { FinanceSalesProjectionDTO } from './finance-sales.dto';
import { projectFinanceSalesOrder } from './finance-sales.adapter';
import { FinanceSalesOrderSourceSchema } from './finance-sales.schema';

export class FinanceSalesProjectionService {
  constructor(
    private readonly context: FinanceTenantContext
  ) {
    assertFinanceTenant(context);
  }

  projectOrder(input: unknown): FinanceSalesProjectionDTO {
    const source =
      FinanceSalesOrderSourceSchema.parse(input);

    if (
      source.organization_id !== this.context.organizationId
    ) {
      throw new FinanceDomainError(
        'Order source tidak berada pada organization Finance aktif.',
        'FINANCE_SALES_SOURCE_TENANT_CONFLICT'
      );
    }

    return projectFinanceSalesOrder(source);
  }
}
