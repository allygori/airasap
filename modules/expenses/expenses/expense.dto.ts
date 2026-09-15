import {
  CreateExpenseSchema,
  ExpenseBaseSchema,
  ExpenseDimensionsSchema,
  ExpenseResponseSchema,
  ExpenseStatusSchema,
  UpdateExpenseSchema,
} from './expense.schema';

export type ExpenseDimensionsDTO = ReturnType<
  typeof ExpenseDimensionsSchema.parse
>;
export type ExpenseStatusDTO = ReturnType<
  typeof ExpenseStatusSchema.parse
>;
export type ExpenseBaseDTO = ReturnType<
  typeof ExpenseBaseSchema.parse
>;
export type CreateExpenseDTO = ReturnType<
  typeof CreateExpenseSchema.parse
>;
export type UpdateExpenseDTO = ReturnType<
  typeof UpdateExpenseSchema.parse
>;
export type ExpenseResponseDTO = ReturnType<
  typeof ExpenseResponseSchema.parse
>;
