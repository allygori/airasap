import { z } from 'zod';
import type { FinanceSubledgerBalanceDTO } from '@/modules/finance/client';
import type { FinanceSubledgerPaymentAccountOption } from '../_lib/load-subledger-page-data';

type FinanceSubledgerSettlementSchemaOptions = {
  balances: FinanceSubledgerBalanceDTO[];
  paymentAccounts: FinanceSubledgerPaymentAccountOption[];
};

export const createFinanceSubledgerSettlementFormSchema = ({
  balances,
  paymentAccounts,
}: FinanceSubledgerSettlementSchemaOptions) =>
  z
    .object({
      source_key: z
        .string()
        .min(1, 'Pilih saldo yang ingin diselesaikan.'),
      amount: z
        .string()
        .regex(
          /^\d+$/,
          'Masukkan nominal dalam angka bulat.'
        )
        .refine(
          (value) =>
            Number.isSafeInteger(Number(value)) &&
            Number(value) > 0 &&
            Number(value) <= 1_000_000_000_000_000,
          'Nominal harus lebih dari 0 dan tidak melebihi batas.'
        ),
      settlement_date: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          'Pilih tanggal settlement.'
        )
        .refine((value) => {
          const date = new Date(`${value}T00:00:00.000Z`);
          return (
            Number.isFinite(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
          );
        }, 'Tanggal settlement tidak valid.'),
      payment_account_id: z
        .string()
        .min(1, 'Pilih akun Kas/Bank.'),
      reference: z.string().max(120),
    })
    .superRefine((values, context) => {
      const balance = balances.find(
        (item) => item.source_key === values.source_key
      );
      if (!balance) {
        context.addIssue({
          code: 'custom',
          path: ['source_key'],
          message:
            'Saldo yang dipilih sudah tidak tersedia.',
        });
        return;
      }

      if (
        !paymentAccounts.some(
          (account) =>
            account.id === values.payment_account_id
        )
      ) {
        context.addIssue({
          code: 'custom',
          path: ['payment_account_id'],
          message: 'Pilih akun Kas/Bank yang tersedia.',
        });
      }

      if (
        Number(values.amount) > balance.outstanding_amount
      ) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `Nominal tidak boleh melebihi saldo terbuka ${balance.outstanding_amount}.`,
        });
      }
    });

export type FinanceSubledgerSettlementFormValues = z.input<
  ReturnType<
    typeof createFinanceSubledgerSettlementFormSchema
  >
>;
