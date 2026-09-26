import { z } from 'zod';
import { FinanceCalendarTimezoneValueSchema } from '../calendar/finance-calendar.schema';
import { FINANCE_ACCOUNT_TYPE_VALUES } from '../accounts/finance-account.constants';

export const FinanceStatementPeriodKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const FinanceStatementQuerySchema = z
  .object({
    period: FinanceStatementPeriodKeySchema.optional(),
  })
  .strict();

export const FinanceStatementPeriodSchema = z
  .object({
    period_key: FinanceStatementPeriodKeySchema,
    calendar_timezone: FinanceCalendarTimezoneValueSchema,
    start_date: z.string().date(),
    end_date: z.string().date(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    history_start_date: z.string().date().nullable(),
  })
  .strict();

export const FinanceStatementAccountAmountSchema = z
  .object({
    account_id: z.string().regex(/^[0-9a-fA-F]{24}$/),
    code: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(FINANCE_ACCOUNT_TYPE_VALUES),
    normal_balance: z.enum(['debit', 'credit']),
    debit_total: z.number().int(),
    credit_total: z.number().int(),
    amount: z.number().int(),
  })
  .strict();

export const FinanceTrialBalanceRowSchema = z
  .object({
    account_id: z.string().regex(/^[0-9a-fA-F]{24}$/),
    code: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(FINANCE_ACCOUNT_TYPE_VALUES),
    debit_balance: z.number().int().nonnegative(),
    credit_balance: z.number().int().nonnegative(),
  })
  .strict();

export const FinanceTrialBalanceReportSchema = z
  .object({
    report_type: z.literal('trial_balance'),
    period: FinanceStatementPeriodSchema,
    rows: z.array(FinanceTrialBalanceRowSchema),
    totals: z
      .object({
        debit_balance: z.number().int().nonnegative(),
        credit_balance: z.number().int().nonnegative(),
        difference: z.number().int(),
      })
      .strict(),
  })
  .strict();

const FinanceProfitLossTotalsSchema = z
  .object({
    revenue: z.number().int(),
    other_income: z.number().int(),
    cost_of_sales: z.number().int(),
    expenses: z.number().int(),
    other_expenses: z.number().int(),
    net_income: z.number().int(),
  })
  .strict();

export const FinanceDeferredCogsSummarySchema = z
  .object({
    transaction_count: z.number().int().nonnegative(),
    related_sales_amount: z.number().int().nonnegative(),
    reasons: z.array(
      z
        .object({
          reason: z.string().min(1),
          transaction_count: z.number().int().positive(),
          related_sales_amount: z
            .number()
            .int()
            .nonnegative(),
        })
        .strict()
    ),
  })
  .strict();

export type FinanceDeferredCogsSummary = z.infer<
  typeof FinanceDeferredCogsSummarySchema
>;

export const FinanceProfitLossReportSchema = z
  .object({
    report_type: z.literal('profit_and_loss'),
    period: FinanceStatementPeriodSchema,
    revenue_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    other_income_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    cost_of_sales_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    expense_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    other_expense_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    totals: FinanceProfitLossTotalsSchema,
    deferred_cogs: FinanceDeferredCogsSummarySchema,
  })
  .strict();

export const FinanceBalanceSheetReportSchema = z
  .object({
    report_type: z.literal('balance_sheet'),
    period: FinanceStatementPeriodSchema,
    asset_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    liability_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    equity_rows: z.array(
      FinanceStatementAccountAmountSchema
    ),
    totals: z
      .object({
        assets: z.number().int(),
        liabilities: z.number().int(),
        equity_accounts: z.number().int(),
        unclosed_net_income: z.number().int(),
        equity_and_net_income: z.number().int(),
        liabilities_and_equity: z.number().int(),
        difference: z.number().int(),
      })
      .strict(),
    deferred_cogs: FinanceDeferredCogsSummarySchema,
  })
  .strict();

export const FinanceFinancialStatementReportSchema =
  z.discriminatedUnion('report_type', [
    FinanceTrialBalanceReportSchema,
    FinanceProfitLossReportSchema,
    FinanceBalanceSheetReportSchema,
  ]);

export type FinanceStatementQuery = z.infer<
  typeof FinanceStatementQuerySchema
>;
export type FinanceStatementPeriod = z.infer<
  typeof FinanceStatementPeriodSchema
>;
export type FinanceStatementAccountAmount = z.infer<
  typeof FinanceStatementAccountAmountSchema
>;
export type FinanceTrialBalanceReport = z.infer<
  typeof FinanceTrialBalanceReportSchema
>;
export type FinanceProfitLossReport = z.infer<
  typeof FinanceProfitLossReportSchema
>;
export type FinanceBalanceSheetReport = z.infer<
  typeof FinanceBalanceSheetReportSchema
>;
export type FinanceFinancialStatementReport = z.infer<
  typeof FinanceFinancialStatementReportSchema
>;
