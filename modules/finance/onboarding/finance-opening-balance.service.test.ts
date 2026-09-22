import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import { FinanceOpeningBalanceService } from './finance-opening-balance.service';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceInventoryItemPersistenceRecord } from '../inventory/finance-inventory-item.repository';
import type { FinanceInventoryLocationPersistenceRecord } from '../inventory/finance-inventory-location.repository';
import type { FinanceOpeningBalanceDraftPersistenceRecord } from './finance-opening-balance.repository';

const organizationId = '507f1f77bcf86cd799439010';
const cashId = new Types.ObjectId(
  '507f1f77bcf86cd799439011'
);
const payableId = new Types.ObjectId(
  '507f1f77bcf86cd799439012'
);
const receivableId = new Types.ObjectId(
  '507f1f77bcf86cd799439013'
);
const equityId = new Types.ObjectId(
  '507f1f77bcf86cd799439014'
);
const itemId = new Types.ObjectId(
  '507f1f77bcf86cd799439015'
);
const locationId = new Types.ObjectId(
  '507f1f77bcf86cd799439016'
);

const makeAccount = (
  id: Types.ObjectId,
  type: FinanceAccountPersistenceRecord['type'],
  subtype: string,
  code: string
): FinanceAccountPersistenceRecord => ({
  _id: id,
  organization: new Types.ObjectId(organizationId),
  code,
  name: `${subtype} account`,
  type,
  subtype,
  normal_balance: type === 'asset' ? 'debit' : 'credit',
  is_system: false,
  is_postable: true,
  is_active: true,
  display_order: 1,
});

const accounts = [
  makeAccount(cashId, 'asset', 'bank', '1120'),
  makeAccount(
    payableId,
    'liability',
    'accounts_payable',
    '2100'
  ),
  makeAccount(
    receivableId,
    'asset',
    'marketplace_receivable',
    '1210'
  ),
  makeAccount(equityId, 'equity', 'owner_capital', '3110'),
];

const item: FinanceInventoryItemPersistenceRecord = {
  _id: itemId,
  organization: new Types.ObjectId(organizationId),
  sku: 'SKU-1',
  name: 'Produk 1',
  item_type: 'merchandise',
  unit: 'pcs',
  track_quantity: true,
  track_value: true,
  is_active: true,
};

const location: FinanceInventoryLocationPersistenceRecord =
  {
    _id: locationId,
    organization: new Types.ObjectId(organizationId),
    code: 'MAIN',
    name: 'Gudang utama',
    is_active: true,
  };

const makeDraft =
  (): FinanceOpeningBalanceDraftPersistenceRecord => ({
    _id: new Types.ObjectId('507f1f77bcf86cd799439017'),
    organization: new Types.ObjectId(organizationId),
    onboarding_version: 1,
    status: 'draft',
    cut_off_date: new Date('2026-09-20T00:00:00.000Z'),
    mode: 'entered',
    description: 'Saldo awal Finance',
    cash_bank_lines: [
      { account_id: cashId, amount: 1_000_000 },
    ],
    inventory_lines: [
      {
        inventory_item_id: itemId,
        location_id: locationId,
        quantity: 2,
        unit_cost: 100_000,
      },
    ],
    payable_lines: [
      { account_id: payableId, amount: 200_000 },
    ],
    receivable_lines: [],
    owner_capital_account_id: equityId,
    owner_capital_amount: 900_000,
    created_at: new Date('2026-09-20T00:00:00.000Z'),
    updated_at: new Date('2026-09-20T00:00:00.000Z'),
  });

const input = {
  cut_off_date: '2026-09-20',
  mode: 'entered' as const,
  description: 'Saldo awal Finance',
  cash_bank_lines: [
    { account_id: String(cashId), amount: 1_000_000 },
  ],
  inventory_lines: [
    {
      inventory_item_id: String(itemId),
      location_id: String(locationId),
      quantity: 2,
      unit_cost: 100_000,
    },
  ],
  payable_lines: [
    { account_id: String(payableId), amount: 200_000 },
  ],
  receivable_lines: [],
  owner_capital_account_id: String(equityId),
  owner_capital_amount: 900_000,
};

const makeService = (
  draft: FinanceOpeningBalanceDraftPersistenceRecord | null = null
) => {
  const created = draft ?? makeDraft();
  const findCurrent = jest
    .fn()
    .mockResolvedValueOnce(null)
    .mockResolvedValue(created);

  return new FinanceOpeningBalanceService(
    { organizationId },
    {
      lifecycle: {
        assertOwner: jest.fn(async () => true),
        getState: jest.fn(async () => ({
          status: 'in_progress' as const,
          onboarding_version: 1,
        })),
      },
      draftRepository: {
        findCurrent,
        createDraft: jest.fn(async () => created),
        updateDraft: jest.fn(async () => created),
      },
      accountRepository: {
        list: jest.fn(async () => accounts),
        findSelectableByIds: jest.fn(async () => accounts),
      },
      itemRepository: {
        listActive: jest.fn(async () => ({
          records: [item],
          total: 1,
        })),
        findActiveById: jest.fn(async () => item),
      },
      locationRepository: {
        listActive: jest.fn(async () => [location]),
        findActiveById: jest.fn(async (id: string) =>
          id === String(locationId) ? location : null
        ),
      },
    }
  );
};

describe('FinanceOpeningBalanceService', () => {
  it('saves a validated draft and calculates the balancing summary', async () => {
    const service = makeService();

    const result = await service.saveDraft(input);

    expect(result.draft?.mode).toBe('entered');
    expect(result.summary).toEqual({
      cash_bank_total: 1_000_000,
      inventory_total: 200_000,
      receivable_total: 0,
      total_assets: 1_200_000,
      payable_total: 200_000,
      owner_capital_total: 900_000,
      retained_earnings_balance: 100_000,
    });
  });

  it('rejects a future cut-off date on the server', async () => {
    const service = makeService();

    await expect(
      service.saveDraft({
        ...input,
        cut_off_date: '2099-01-01',
      })
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_OPENING_BALANCE_CUTOFF_INVALID',
    });
  });

  it('rejects an inventory line for an unknown location', async () => {
    const service = makeService();

    await expect(
      service.saveDraft({
        ...input,
        inventory_lines: [
          {
            ...input.inventory_lines[0],
            location_id: '507f1f77bcf86cd799439099',
          },
        ],
      })
    ).rejects.toMatchObject<Partial<FinanceDomainError>>({
      code: 'FINANCE_OPENING_BALANCE_LOCATION_INVALID',
    });
  });
});
