import {
  FinanceJournalEntryResponseSchema,
  FinanceJournalDetailResponseSchema,
  FinanceJournalEntryDetailSchema,
  FinanceJournalEntrySummarySchema,
  FinanceJournalLedgerQuerySchema,
  FinanceJournalLineDetailSchema,
  FinanceJournalListQuerySchema,
  FinanceJournalListResponseSchema,
  FinanceLedgerResponseSchema,
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

export type FinanceJournalListQueryDTO = ReturnType<
  typeof FinanceJournalListQuerySchema.parse
>;

export type FinanceJournalLedgerQueryDTO = ReturnType<
  typeof FinanceJournalLedgerQuerySchema.parse
>;

export type FinanceJournalStatusDTO = ReturnType<
  typeof FinanceJournalStatusSchema.parse
>;

export type FinanceJournalEntryDTO = ReturnType<
  typeof FinanceJournalEntryResponseSchema.parse
>;

export type FinanceJournalEntrySummaryDTO = ReturnType<
  typeof FinanceJournalEntrySummarySchema.parse
>;

export type FinanceJournalEntryDetailDTO = ReturnType<
  typeof FinanceJournalEntryDetailSchema.parse
>;

export type FinanceJournalDetailResponseDTO = ReturnType<
  typeof FinanceJournalDetailResponseSchema.parse
>;

export type FinanceJournalListResponseDTO = ReturnType<
  typeof FinanceJournalListResponseSchema.parse
>;

export type FinanceJournalLineDetailDTO = ReturnType<
  typeof FinanceJournalLineDetailSchema.parse
>;

export type FinanceLedgerResponseDTO = ReturnType<
  typeof FinanceLedgerResponseSchema.parse
>;

export type FinanceJournalPostResultDTO = {
  journal_entry: FinanceJournalEntryDTO;
  replayed: boolean;
};
