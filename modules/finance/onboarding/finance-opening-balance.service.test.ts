import { Types } from 'mongoose';
import { FinanceDomainError } from '../finance.error';
import { FinanceOpeningBalanceService } from './finance-opening-balance.service';
import type { FinanceAccountPersistenceRecord } from '../accounts/finance-account.repository';
import type { FinanceInventoryItemPersistenceRecord } from '../inventory/finance-inventory-item.repository';
import type { FinanceInventoryLocationPersistenceRecord } from '../inventory/finance-inventory-location.repository';
import type {
  CreateFinanceOpeningBalanceDraftRecord,
  FinanceOpeningBalanceDraftPersistenceRecord,
} from './finance-opening-balance.repository';

const organizationId = '507f1f77bcf86cd799439010';
const cashId = new Types.ObjectId(
  '507f1f77bcf86cd799439011'
);
const payableId = new Types.ObjectId(
  '507f1f77bcf86cd799439012'
);
const creditPayableId = new Types.ObjectId(
  '507f1f77bcf86cd799439018'
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
    creditPayableId,
    'liability',
    'credit_payable',
    '2400'
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
      {
        account_id: payableId,
        amount: 200_000,
        counterparty: 'Supplier A',
      },
    ],
    receivable_lines: [],
    owner_capital_account_id: equityId,
    owner_capital_amount: 900_000,
    created_at: new Date('2026-09-20T00:00:00.000Z'),
    updated_at: new Date('2026-09-20T00:00:00.000Z'),
  });

const input = {
  cut_off_date: '2026-09-20',
  calendar_timezone: 'Asia/Jakarta' as const,
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
    {
      account_id: String(payableId),
      amount: 200_000,
      counterparty: 'Supplier A',
    },
  ],
  receivable_lines: [],
  owner_capital_account_id: String(equityId),
  owner_capital_amount: 900_000,
};

const makeService = (
  draft: FinanceOpeningBalanceDraftPersistenceRecord | null = null
) => {
  const created = draft ?? makeDraft();
  let persisted = created;
  const findCurrent = jest
    .fn()
    .mockResolvedValueOnce(null)
    .mockImplementation(async () => persisted);

  return new FinanceOpeningBalanceService(
    { organizationId },
    {
      lifecycle: {
        assertOwner: jest.fn(async () => true),
        setCalendarTimezone: jest.fn(async () => ({
          status: 'in_progress' as const,
          onboarding_version: 1,
          calendar_timezone: 'Asia/Jakarta' as const,
        })),
        getState: jest.fn(async () => ({
          status: 'in_progress' as const,
          onboarding_version: 1,
          calendar_timezone: 'Asia/Jakarta' as const,
        })),
      },
      draftRepository: {
        findCurrent,
        createDraft: jest.fn(
          async (
            data: CreateFinanceOpeningBalanceDraftRecord
          ) => {
            persisted = {
              ...data,
              _id: created._id,
              organization: created.organization,
            };
            return persisted;
          }
        ),
        updateDraft: jest.fn(
          async (
            _id: string,
            data: Partial<CreateFinanceOpeningBalanceDraftRecord>
          ) => {
            persisted = { ...created, ...data };
            return persisted;
          }
        ),
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
  it('persists the selected cut-off date before the draft is complete', async () => {
    const service = makeService();

    const incompleteDraft = {
      cut_off_date: '2026-09-18',
      calendar_timezone: 'Asia/Jakarta',
      mode: 'entered',
      cash_bank_lines: [],
      inventory_lines: [],
      payable_lines: [],
      receivable_lines: [],
    } as const;

    const result = await service.saveDraft(incompleteDraft);

    expect(result.draft?.cut_off_date).toBe('2026-09-18');
    await expect(service.preview()).rejects.toMatchObject({
      code: 'FINANCE_OPENING_BALANCE_DRAFT_INVALID',
    });
  });

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

  it('accepts a PayLater/credit-card opening payable in the draft', async () => {
    const service = makeService();

    const result = await service.saveDraft({
      ...input,
      payable_lines: [
        ...input.payable_lines,
        {
          account_id: String(creditPayableId),
          amount: 300_000,
          counterparty: 'Bank Digital',
          reference: 'PayLater',
        },
      ],
      owner_capital_amount: 700_000,
    });

    expect(result.draft?.payable_lines).toHaveLength(2);
    expect(result.summary.payable_total).toBe(500_000);
  });

  it('exposes the PayLater account separately in onboarding options', async () => {
    const result = await makeService().getSetup();

    expect(result.options.credit_payable_accounts).toEqual([
      expect.objectContaining({
        id: String(creditPayableId),
        code: '2400',
        subtype: 'credit_payable',
      }),
    ]);
  });

  it('keeps zero-quantity inventory rows in the draft without treating them as duplicate stock', async () => {
    const service = makeService();

    const result = await service.saveDraft({
      ...input,
      inventory_lines: [
        ...input.inventory_lines,
        {
          inventory_item_id: String(itemId),
          location_id: String(locationId),
          quantity: 0,
        },
      ],
    });

    expect(result.draft?.inventory_lines).toHaveLength(2);
    expect(result.draft?.inventory_lines[1]?.quantity).toBe(
      0
    );
    expect(result.summary.inventory_total).toBe(200_000);
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

  it('accepts the current Jakarta business date before UTC midnight', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(
      new Date('2026-09-23T20:00:00.000Z')
    );

    try {
      const draft = {
        ...makeDraft(),
        cut_off_date: new Date('2026-09-24T00:00:00.000Z'),
        mode: 'zero' as const,
        cash_bank_lines: [],
        inventory_lines: [],
        payable_lines: [],
        owner_capital_amount: 0,
      };
      const service = makeService(draft);

      await expect(
        service.saveDraft({
          description: 'Saldo awal Finance',
          calendar_timezone: 'Asia/Jakarta',
          mode: 'zero',
          cut_off_date: '2026-09-24',
          cash_bank_lines: [],
          inventory_lines: [],
          payable_lines: [],
          receivable_lines: [],
          owner_capital_amount: 0,
        })
      ).resolves.toBeDefined();
      await expect(
        service.preview()
      ).resolves.toMatchObject({
        cut_off_date: '2026-09-24',
      });
    } finally {
      jest.useRealTimers();
    }
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

  it('finalizes a zero opening balance without a MongoDB session and replays after activation', async () => {
    let status: 'in_progress' | 'active' = 'in_progress';
    const draft = {
      ...makeDraft(),
      mode: 'zero' as const,
      cash_bank_lines: [],
      inventory_lines: [],
      payable_lines: [],
      owner_capital_amount: 0,
    };
    const beginFinalization = jest.fn(async () => {
      draft.status = 'finalizing';
      return draft;
    });
    const markFinalized = jest.fn(async () => {
      draft.status = 'skipped';
      return draft;
    });
    const activate = jest.fn(async () => {
      status = 'active';
      return {
        status: 'active' as const,
        onboarding_version: 1,
        calendar_timezone: 'Asia/Jakarta' as const,
      };
    });
    const service = new FinanceOpeningBalanceService(
      { organizationId },
      {
        lifecycle: {
          assertOwner: jest.fn(async () => true),
          setCalendarTimezone: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          getState: jest.fn(async () => ({
            status,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          activate,
        },
        draftRepository: {
          findCurrent: jest.fn(async () => draft),
          createDraft: jest.fn(async () => draft),
          updateDraft: jest.fn(async () => draft),
          beginFinalization,
          markFinalized,
        },
      }
    );

    const first = await service.finalize({
      confirmed: true,
    });
    const replay = await service.finalize({
      confirmed: true,
    });

    expect(first).toMatchObject({
      status: 'skipped',
      finance_status: 'active',
      replayed: false,
    });
    expect(replay.replayed).toBe(true);
    expect(beginFinalization).toHaveBeenCalledTimes(1);
    expect(markFinalized).toHaveBeenCalledTimes(1);
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it('resumes a frozen draft after a subledger write fails without duplicating the journal', async () => {
    let status: 'in_progress' | 'active' = 'in_progress';
    const draft = {
      ...makeDraft(),
      cash_bank_lines: [
        { account_id: cashId, amount: 1_000_000 },
      ],
      inventory_lines: [],
      payable_lines: [
        {
          account_id: payableId,
          amount: 200_000,
          counterparty: 'Supplier A',
        },
      ],
      owner_capital_amount: 800_000,
    };
    const journalId = new Types.ObjectId(
      '507f1f77bcf86cd799439019'
    );
    const postOperational = jest.fn(
      async (input: unknown) => {
        void input;
        return {
          journal_entry: {
            id: String(journalId),
            entry_number: 'FIN-OPENING-1',
            transaction_date: '2026-09-20T00:00:00.000Z',
            posting_date: '2026-09-20T00:00:00.000Z',
            period: '2026-09',
            currency: 'IDR',
            description: 'Saldo awal Finance',
            source_type: 'opening_balance',
            source_id: String(draft._id),
            source_event: 'opening_balance_posted',
            idempotency_key: 'opening-test',
            status: 'posted' as const,
            posted_at: '2026-09-20T00:00:00.000Z',
            posted_by: null,
            reversal_of: null,
            lines: [],
          },
          replayed: false,
        };
      }
    );
    const createMany = jest
      .fn()
      .mockRejectedValueOnce(new Error('write interrupted'))
      .mockResolvedValue(undefined);
    const markFinalized = jest.fn(async () => {
      draft.status = 'posted';
      draft.journal_entry = journalId;
      return draft;
    });
    const service = new FinanceOpeningBalanceService(
      { organizationId },
      {
        lifecycle: {
          assertOwner: jest.fn(async () => true),
          setCalendarTimezone: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          getState: jest.fn(async () => ({
            status,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          activate: jest.fn(async () => {
            status = 'active';
            return {
              status: 'active' as const,
              onboarding_version: 1,
              calendar_timezone: 'Asia/Jakarta' as const,
            };
          }),
        },
        draftRepository: {
          findCurrent: jest.fn(async () => draft),
          createDraft: jest.fn(async () => draft),
          updateDraft: jest.fn(async () => draft),
          beginFinalization: jest.fn(async () => {
            draft.status = 'finalizing';
            return draft;
          }),
          markFinalized,
        },
        accountRepository: {
          list: jest.fn(async () => accounts),
          findSelectableByIds: jest.fn(
            async () => accounts
          ),
        },
        itemRepository: {
          listActive: jest.fn(async () => ({
            records: [],
            total: 0,
          })),
          findActiveById: jest.fn(async () => null),
        },
        locationRepository: {
          listActive: jest.fn(async () => []),
          findActiveById: jest.fn(async () => null),
        },
        journalService: { postOperational },
        subledgerItemRepository: { createMany },
      }
    );

    await expect(
      service.finalize({ confirmed: true })
    ).rejects.toThrow('write interrupted');
    expect(draft.status).toBe('finalizing');
    expect(markFinalized).not.toHaveBeenCalled();

    const result = await service.finalize({
      confirmed: true,
    });

    expect(result).toMatchObject({
      status: 'posted',
      finance_status: 'active',
      payable_item_count: 1,
    });
    expect(postOperational).toHaveBeenCalledTimes(2);
    expect(postOperational.mock.calls[0][0]).toEqual(
      postOperational.mock.calls[1][0]
    );
    expect(createMany).toHaveBeenCalledTimes(2);
    expect(markFinalized).toHaveBeenCalledTimes(1);
  });

  it('activates a batch already marked complete after an interrupted activation', async () => {
    const draft = {
      ...makeDraft(),
      status: 'skipped' as const,
      mode: 'zero' as const,
      finalized_at: new Date('2026-09-20T01:00:00.000Z'),
    };
    const activate = jest.fn(async () => ({
      status: 'active' as const,
      onboarding_version: 1,
      calendar_timezone: 'Asia/Jakarta' as const,
    }));
    const service = new FinanceOpeningBalanceService(
      { organizationId },
      {
        lifecycle: {
          assertOwner: jest.fn(async () => true),
          setCalendarTimezone: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          getState: jest.fn(async () => ({
            status: 'in_progress' as const,
            onboarding_version: 1,
            calendar_timezone: 'Asia/Jakarta' as const,
          })),
          activate,
        },
        draftRepository: {
          findCurrent: jest.fn(async () => draft),
          createDraft: jest.fn(async () => draft),
          updateDraft: jest.fn(async () => draft),
          beginFinalization: jest.fn(async () => null),
          markFinalized: jest.fn(async () => null),
        },
      }
    );

    const result = await service.finalize({
      confirmed: true,
    });

    expect(result).toMatchObject({
      status: 'skipped',
      finance_status: 'active',
      replayed: true,
    });
    expect(activate).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: draft.finalized_at,
      }),
      undefined
    );
  });
});
