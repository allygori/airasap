import { Types } from 'mongoose';
import type {
  FinanceExpensePersistenceRecord,
  FinanceExpenseRepository,
} from './finance-expense.repository';
import { FinanceExpenseReadService } from './finance-expense-read.service';

const organizationId = '507f1f77bcf86cd799439010';

const record: FinanceExpensePersistenceRecord = {
  _id: new Types.ObjectId(),
  organization: new Types.ObjectId(organizationId),
  category_account: new Types.ObjectId(),
  category_account_code: '6100',
  category_account_name: 'Beban Operasional',
  amount: 150000,
  expense_date: new Date('2026-09-22T00:00:00.000Z'),
  description: 'Internet toko bulan September',
  vendor_name: 'Penyedia internet',
  reference: 'INV-009',
  payment_timing: 'payable',
  payment_account: null,
  payment_account_code: null,
  payment_account_name: null,
  offset_account: new Types.ObjectId(),
  offset_account_code: '2100',
  offset_account_name: 'Utang Usaha',
  notes: 'Menunggu pembayaran bulan depan',
  attachment_reference: 'drive://invoice-009',
  status: 'posted',
  journal_entry: new Types.ObjectId(),
  idempotency_key: 'expense-key-1',
};

type RepositoryPort = Pick<
  FinanceExpenseRepository,
  'list' | 'findExpenseById'
>;

describe('FinanceExpenseReadService', () => {
  it('maps expense list and detail into stable response contracts', async () => {
    const repository: RepositoryPort = {
      list: async () => ({ records: [record], total: 1 }),
      findExpenseById: async () => record,
    };
    const service = new FinanceExpenseReadService(
      { organizationId },
      { repository }
    );

    const list = await service.list({ page: 1, limit: 25 });
    const detail = await service.get(String(record._id));

    expect(list.expenses[0]).toMatchObject({
      description: 'Internet toko bulan September',
      status: 'posted',
      amount: 150000,
    });
    expect(detail.expense.offset_account?.code).toBe(
      '2100'
    );
    expect(detail.expense.attachment_reference).toBe(
      'drive://invoice-009'
    );
  });

  it('rejects an invalid expense id', async () => {
    const repository: RepositoryPort = {
      list: async () => ({ records: [], total: 0 }),
      findExpenseById: async () => null,
    };
    const service = new FinanceExpenseReadService(
      { organizationId },
      { repository }
    );

    await expect(
      service.get('invalid')
    ).rejects.toMatchObject({
      code: 'FINANCE_EXPENSE_NOT_FOUND',
    });
  });
});
