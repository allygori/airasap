import { Types } from 'mongoose';
import type { FinanceAccountRepository } from '../accounts/finance-account.repository';
import type { FinanceJournalRepository } from '../journal/finance-journal.repository';
import { FinanceCashBankReadService } from './finance-cash-bank-read.service';

const organizationId = '507f1f77bcf86cd799439010';
const bankId = new Types.ObjectId();
const cashId = new Types.ObjectId();

const makeAccount = (
  id: Types.ObjectId,
  subtype: 'bank' | 'cash',
  normalBalance: 'debit' | 'credit' = 'debit'
) => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code: subtype === 'bank' ? '1120' : '1110',
  name:
    subtype === 'bank' ? 'Bank Operasional' : 'Kas Toko',
  type: 'asset',
  subtype,
  parent_account: new Types.ObjectId(),
  normal_balance: normalBalance,
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: subtype === 'bank' ? 112 : 111,
  account_metadata:
    subtype === 'bank'
      ? {
          institution: 'Bank Contoh',
          account_last4: '1234',
          account_holder: 'Toko Contoh',
        }
      : undefined,
});

type AccountPort = Pick<
  FinanceAccountRepository,
  'listPostableBySubtypes'
>;
type JournalPort = Pick<
  FinanceJournalRepository,
  'aggregatePostedAccountBalances'
>;

describe('FinanceCashBankReadService', () => {
  it('derives current and opening balances from posted journal lines', async () => {
    const accountRepository: AccountPort = {
      listPostableBySubtypes: async () => [
        makeAccount(bankId, 'bank'),
        makeAccount(cashId, 'cash'),
      ],
    };
    const journalRepository: JournalPort = {
      aggregatePostedAccountBalances: async () => [
        {
          _id: bankId,
          debit_total: 1500000,
          credit_total: 250000,
          opening_debit_total: 1000000,
          opening_credit_total: 0,
          journal_line_count: 4,
          last_transaction_date: new Date(
            '2026-09-22T00:00:00.000Z'
          ),
        },
      ],
    };
    const service = new FinanceCashBankReadService(
      { organizationId },
      { accountRepository, journalRepository }
    );

    const result = await service.list({});

    expect(result).toMatchObject({
      meta: {
        total_accounts: 2,
        accounts_with_activity: 1,
        total_balance: 1250000,
      },
    });
    expect(result.accounts[0]).toMatchObject({
      code: '1120',
      opening_balance: 1000000,
      current_balance: 1250000,
      journal_line_count: 4,
      account_metadata: {
        institution: 'Bank Contoh',
        account_last4: '1234',
      },
    });
    expect(result.accounts[1]).toMatchObject({
      code: '1110',
      opening_balance: 0,
      current_balance: 0,
      journal_line_count: 0,
    });
  });

  it('uses the account normal balance when calculating the balance', async () => {
    const accountRepository: AccountPort = {
      listPostableBySubtypes: async () => [
        makeAccount(bankId, 'bank', 'credit'),
      ],
    };
    const journalRepository: JournalPort = {
      aggregatePostedAccountBalances: async () => [
        {
          _id: bankId,
          debit_total: 250000,
          credit_total: 1000000,
          opening_debit_total: 0,
          opening_credit_total: 500000,
          journal_line_count: 2,
          last_transaction_date: null,
        },
      ],
    };
    const service = new FinanceCashBankReadService(
      { organizationId },
      { accountRepository, journalRepository }
    );

    const result = await service.list({});

    expect(result.accounts[0]).toMatchObject({
      opening_balance: 500000,
      current_balance: 750000,
    });
  });

  it('keeps inactive cash and bank accounts visible with their posted balance', async () => {
    const inactiveAccount = makeAccount(bankId, 'bank');
    inactiveAccount.is_active = false;
    const accountRepository: AccountPort = {
      listPostableBySubtypes: async (_subtypes, filter) => {
        expect(filter.status).toBe('all');
        return [inactiveAccount];
      },
    };
    const journalRepository: JournalPort = {
      aggregatePostedAccountBalances: async () => [
        {
          _id: bankId,
          debit_total: 875000,
          credit_total: 125000,
          opening_debit_total: 0,
          opening_credit_total: 0,
          journal_line_count: 3,
          last_transaction_date: new Date(
            '2026-10-01T00:00:00.000Z'
          ),
        },
      ],
    };
    const service = new FinanceCashBankReadService(
      { organizationId },
      { accountRepository, journalRepository }
    );

    const result = await service.list({});

    expect(result.accounts[0]).toMatchObject({
      is_active: false,
      opening_balance: 0,
      current_balance: 750000,
      journal_line_count: 3,
    });
    expect(result.meta.total_balance).toBe(750000);
  });

  it('can filter cash and bank accounts by status', async () => {
    const listPostableBySubtypes = jest.fn(async () => []);
    const service = new FinanceCashBankReadService(
      { organizationId },
      {
        accountRepository: { listPostableBySubtypes },
        journalRepository: {
          aggregatePostedAccountBalances: async () => [],
        },
      }
    );

    await service.list({ status: 'inactive' });

    expect(listPostableBySubtypes).toHaveBeenCalledWith(
      expect.arrayContaining(['bank', 'e_wallet']),
      { status: 'inactive', limit: 100 },
      undefined
    );
  });
});
