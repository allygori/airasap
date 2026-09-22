import {
  FinanceJournalEntryResponseSchema,
  FinanceJournalReversalSchema,
  FinanceJournalLineSchema,
  FinanceJournalStatusSchema,
  FinanceOperationalPostingSchema,
} from './finance-journal.schema';

export type FinanceJournalLineDTO = ReturnType<
  typeof FinanceJournalLineSchema.parse
>;

export type FinanceOperationalPostingDTO = ReturnType<
  typeof FinanceOperationalPostingSchema.parse
>;

export type FinanceJournalReversalDTO = ReturnType<
  typeof FinanceJournalReversalSchema.parse
>;

export type FinanceJournalStatusDTO = ReturnType<
  typeof FinanceJournalStatusSchema.parse
>;

export type FinanceJournalEntryDTO = ReturnType<
  typeof FinanceJournalEntryResponseSchema.parse
>;

export type FinanceJournalPostResultDTO = {
  journal_entry: FinanceJournalEntryDTO;
  replayed: boolean;
};
