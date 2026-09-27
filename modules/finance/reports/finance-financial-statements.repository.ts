import { Types, type ClientSession } from 'mongoose';
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
  subtype?: string;
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
  account_ids?: string[];
  session?: ClientSession;
};

export type FinanceCashFlowJournalRecord = {
  source_type: string;
  source_event: string;
  lines: Array<{
    account_id: Types.ObjectId;
    debit: number;
    credit: number;
  }>;
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
        '_id code name type subtype normal_balance is_postable display_order'
      )
      .sort({ display_order: 1, code: 1 })
      .lean<FinanceStatementAccountRecord[]>()
      .exec();
  }

  async aggregatePostedLineTotals(
    range: FinanceStatementDateRange
  ): Promise<FinanceStatementAccountTotalsRecord[]> {
    if (range.account_ids?.length === 0) return [];

    const transactionDate: {
      $gte?: Date;
      $lte: Date;
    } = { $lte: range.end_date };
    if (range.start_date) {
      transactionDate.$gte = range.start_date;
    }

    const pipeline = [
      {
        $match: {
          organization: this.organizationId,
          status: 'posted',
          transaction_date: transactionDate,
        },
      },
      { $unwind: '$lines' },
      ...(range.account_ids
        ? [
            {
              $match: {
                'lines.account_id': {
                  $in: range.account_ids.map(
                    (accountId) =>
                      new Types.ObjectId(accountId)
                  ),
                },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: '$lines.account_id',
          debit_total: { $sum: '$lines.debit' },
          credit_total: { $sum: '$lines.credit' },
        },
      },
    ];
    const aggregation =
      FinanceJournalEntryModel.aggregate<FinanceStatementAccountTotalsRecord>(
        pipeline
      );
    if (range.session) aggregation.session(range.session);
    return aggregation.exec();
  }

  async *streamCashFlowJournals(
    startDate: Date,
    endDate: Date,
    cashAccountIds: string[],
    session?: ClientSession
  ): AsyncGenerator<FinanceCashFlowJournalRecord> {
    if (cashAccountIds.length === 0) return;

    const aggregation =
      FinanceJournalEntryModel.aggregate<FinanceCashFlowJournalRecord>(
        [
          {
            $match: {
              organization: this.organizationId,
              status: 'posted',
              transaction_date: {
                $gte: startDate,
                $lte: endDate,
              },
              'lines.account_id': {
                $in: cashAccountIds.map(
                  (accountId) =>
                    new Types.ObjectId(accountId)
                ),
              },
            },
          },
          { $sort: { transaction_date: 1, _id: 1 } },
          {
            $project: {
              _id: 0,
              source_type: 1,
              source_event: 1,
              lines: 1,
            },
          },
        ]
      );
    if (session) aggregation.session(session);
    const cursor = aggregation.cursor({ batchSize: 200 });

    try {
      for await (const record of cursor) {
        yield record;
      }
    } finally {
      await cursor.close();
    }
  }
}
