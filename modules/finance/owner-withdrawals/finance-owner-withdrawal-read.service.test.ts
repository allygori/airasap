import { Types } from 'mongoose';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceJournalRepository } from '../journal/finance-journal.repository';
import type {
  FinanceOwnerWithdrawalPersistenceRecord,
  FinanceOwnerWithdrawalRepository,
} from './finance-owner-withdrawal.repository';
import { FinanceOwnerWithdrawalReadService } from './finance-owner-withdrawal-read.service';

const organizationId = '507f1f77bcf86cd799439010';
const ownerAccountId = new Types.ObjectId();
const paymentAccountId = new Types.ObjectId();
const withdrawalId = new Types.ObjectId();
const journalId = new Types.ObjectId();

const ownerAccount: FinanceAccountPersistenceRecord = {
  _id: ownerAccountId,
  organization: new Types.ObjectId(organizationId),
  code: '3310',
  name: 'Prive Pemilik 1',
  type: 'equity',
  subtype: 'owner_drawings',
  parent_account: null,
  normal_balance: 'credit',
  is_system: true,
  is_postable: true,
  is_active: true,
  display_order: 1,
};

const withdrawal: FinanceOwnerWithdrawalPersistenceRecord =
  {
    _id: withdrawalId,
    organization: new Types.ObjectId(organizationId),
    owner_account: ownerAccountId,
    owner_account_code: ownerAccount.code,
    owner_account_name: ownerAccount.name,
    payment_account: paymentAccountId,
    payment_account_code: '112001',
    payment_account_name: 'Bank Operasional',
    amount: 250_000,
    transaction_date: new Date('2026-09-10T00:00:00.000Z'),
    description: 'Penarikan September',
    reference: null,
    status: 'posted',
    journal_entry: journalId,
    reversal_journal_entry: null,
    idempotency_key: 'withdrawal-key',
  };

describe('FinanceOwnerWithdrawalReadService', () => {
  it('returns a paginated traceable history and posted journal totals', async () => {
    const repository: Pick<
      FinanceOwnerWithdrawalRepository,
      'list'
    > = {
      list: jest.fn(async () => ({
        records: [withdrawal],
        total: 1,
      })),
    };
    const accountRepository = {
      list: jest.fn(async () => [ownerAccount]),
    };
    const journalRepository: Pick<
      FinanceJournalRepository,
      'aggregatePostedOwnerDrawingMovements'
    > = {
      aggregatePostedOwnerDrawingMovements: jest.fn(
        async () => [
          {
            _id: {
              account_id: ownerAccountId,
              period: '2026-09',
            },
            debit_total: 250_000,
            credit_total: 50_000,
          },
        ]
      ),
    };
    const service = new FinanceOwnerWithdrawalReadService(
      { organizationId },
      { repository, accountRepository, journalRepository }
    );

    const result = await service.list({
      from_date: '2026-09-01',
      to_date: '2026-09-30',
      page: 1,
      limit: 25,
    });

    expect(result).toMatchObject({
      withdrawals: [
        {
          withdrawal_id: String(withdrawalId),
          status: 'posted',
          journal_entry_id: String(journalId),
          reversal_journal_entry_id: null,
        },
      ],
      monthly_totals: [
        {
          period: '2026-09',
          owner_account: {
            id: String(ownerAccountId),
            name: 'Prive Pemilik 1',
          },
          debit_total: 250_000,
          credit_total: 50_000,
          net_debit: 200_000,
        },
      ],
      pagination: {
        page: 1,
        limit: 25,
        total: 1,
        total_pages: 1,
      },
      summary_range: {
        from_date: '2026-09-01',
        to_date: '2026-09-30',
      },
    });
    expect(
      journalRepository.aggregatePostedOwnerDrawingMovements
    ).toHaveBeenCalledWith(
      [String(ownerAccountId)],
      '2026-09-01',
      '2026-09-30'
    );
  });

  it('does not aggregate other account types selected as owner drawings', async () => {
    const repository: Pick<
      FinanceOwnerWithdrawalRepository,
      'list'
    > = {
      list: jest.fn(async () => ({
        records: [],
        total: 0,
      })),
    };
    const accountRepository = {
      list: jest.fn(async () => [
        { ...ownerAccount, subtype: 'capital' },
      ]),
    };
    const journalRepository: Pick<
      FinanceJournalRepository,
      'aggregatePostedOwnerDrawingMovements'
    > = {
      aggregatePostedOwnerDrawingMovements: jest.fn(
        async () => []
      ),
    };
    const service = new FinanceOwnerWithdrawalReadService(
      { organizationId },
      { repository, accountRepository, journalRepository }
    );

    await expect(
      service.list({
        from_date: '2026-09-01',
        to_date: '2026-09-30',
        owner_account_id: String(ownerAccountId),
      })
    ).rejects.toMatchObject({
      code: 'FINANCE_OWNER_WITHDRAWAL_OWNER_ACCOUNT_INVALID',
    });
    expect(repository.list).not.toHaveBeenCalled();
    expect(
      journalRepository.aggregatePostedOwnerDrawingMovements
    ).not.toHaveBeenCalled();
  });
});
