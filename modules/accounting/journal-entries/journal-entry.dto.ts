import {
  CreateJournalEntrySchema,
  JournalDimensionsSchema,
  JournalEntryBaseSchema,
  JournalEntryResponseSchema,
  JournalEntrySchema,
  JournalLineSchema,
  UpdateJournalEntrySchema,
} from './journal-entry.schema';

export type JournalDimensionsDTO = ReturnType<
  typeof JournalDimensionsSchema.parse
>;
export type JournalLineDTO = ReturnType<
  typeof JournalLineSchema.parse
>;
export type JournalEntryBaseDTO = ReturnType<
  typeof JournalEntryBaseSchema.parse
>;
export type CreateJournalEntryDTO = ReturnType<
  typeof CreateJournalEntrySchema.parse
>;
export type UpdateJournalEntryDTO = ReturnType<
  typeof UpdateJournalEntrySchema.parse
>;
export type JournalEntryDTO = ReturnType<
  typeof JournalEntrySchema.parse
>;
export type JournalEntryResponseDTO = ReturnType<
  typeof JournalEntryResponseSchema.parse
>;
