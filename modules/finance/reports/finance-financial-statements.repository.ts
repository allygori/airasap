import { Types } from 'mongoose';
import type { FinanceAccountType } from '../accounts/finance-account.constants';
import { FinanceAccountModel } from '../accounts/finance-account.model';
import { FinanceJournalEntryModel } from '../journal/finance-journal.model';
import {
  assertFinanceTenant,
  type FinanceTenantContext,
} from '../finance.types';

export type FinanceStatementAccountRecord = {
  _id: Types.ObjectId;
  code: string;
  name: string;
  type: FinanceAccountType;
  normal_balance: 'debit' | 'credit';
  is_postable: boolean;
  display_order: number;
};

export type FinanceStatementAccountTotalsRecord = {
  _id: Types.ObjectId;
  debit_total: number;
  credit_total: number;
};

export type FinanceStatementDateRange = {
  start_date?: Date;
  end_date: Date;
};

export class FinanceFinancialStatementsRepository {
  private readonly organizationId: Types.ObjectId;

  constructor(context: FinanceTenantContext) {
    assertFinanceTenant(context);
    this.organizationId = new Types.ObjectId(
      context.organizationId
    );
  }

  async listAccounts(): Promise<
    FinanceStatementAccountRecord[]
  > {
    return FinanceAccountModel.find({
      organization: this.organizationId,
      is_postable: true,
    })
      .select(
        '_id code name type normal_balance is_postable display_order'
      )
      .sort({ display_order: 1, code: 1 })
      .lean<FinanceStatementAccountRecord[]>()
      .exec();
  }

  async aggregatePostedLineTotals(
    range: FinanceStatementDateRange
  ): Promise<FinanceStatementAccountTotalsRecord[]> {
    const transactionDate: {
      $gte?: Date;
      $lte: Date;
    } = { $lte: range.end_date };
    if (range.start_date) {
      transactionDate.$gte = range.start_date;
    }

    return FinanceJournalEntryModel.aggregate<FinanceStatementAccountTotalsRecord>(
      [
        {
          $match: {
            organization: this.organizationId,
            status: 'posted',
            transaction_date: transactionDate,
          },
        },
        { $unwind: '$lines' },
        {
          $group: {
            _id: '$lines.account_id',
            debit_total: { $sum: '$lines.debit' },
            credit_total: { $sum: '$lines.credit' },
          },
        },
      ]
    ).exec();
  }
}
