export type ManualJournalLineDirection = 'debit' | 'credit';

export type ManualJournalAccountMatch = {
  codes: readonly string[];
  subtypes: readonly string[];
};

export type ManualJournalTemplate = {
  title: string;
  description: string;
  lines: readonly {
    direction: ManualJournalLineDirection;
    account: ManualJournalAccountMatch;
  }[];
};

/**
 * Add new manual journal templates here. The page uses `direction` to
 * disable the opposite input and uses the account match rules to preselect
 * the first matching postable account.
 */
export const MANUAL_JOURNAL_TEMPLATES = {
  'capital-contribution': {
    title: 'Catat Setoran Modal',
    description:
      'Gunakan debit pada kas/bank yang menerima dana dan credit pada subakun modal pemilik yang sesuai.',
    lines: [
      {
        direction: 'debit',
        account: {
          codes: ['1110', '1120', '1130', '1140'],
          subtypes: [
            'cash',
            'bank',
            'marketplace_balance',
            'e_wallet',
          ],
        },
      },
      {
        direction: 'credit',
        account: {
          codes: ['3110', '3120'],
          subtypes: ['owner_capital'],
        },
      },
    ],
  },
  'owner-distribution': {
    title: 'Catat Penarikan Pemilik',
    description:
      'Gunakan debit pada subakun prive/distribusi pemilik dan credit pada kas/bank yang digunakan.',
    lines: [
      {
        direction: 'debit',
        account: {
          codes: ['3310', '3320'],
          subtypes: ['owner_drawings'],
        },
      },
      {
        direction: 'credit',
        account: {
          codes: ['1110', '1120', '1130', '1140'],
          subtypes: [
            'cash',
            'bank',
            'marketplace_balance',
            'e_wallet',
          ],
        },
      },
    ],
  },
} satisfies Record<string, ManualJournalTemplate>;

export type ManualJournalTemplateKey =
  keyof typeof MANUAL_JOURNAL_TEMPLATES;
