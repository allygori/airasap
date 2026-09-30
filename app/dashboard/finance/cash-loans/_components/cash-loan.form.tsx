/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { formatIDR as formatMoney } from '@/lib/number/money';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import type {
  FinanceCashLoanBalanceSchema,
  FinanceCashLoanEventType,
  FinanceCashLoanLenderType,
} from '@/modules/finance/client';
import type { CashLoanFormValues } from './cash-loan.form.schema';

type AccountOption = {
  id: string;
  code: string;
  name: string;
  subtype?: string | null;
};
type LenderBalance = ReturnType<
  typeof FinanceCashLoanBalanceSchema.parse
>;

export type CashLoanFormDefaults = {
  businessDate: string;
};

export function createCashLoanFormDefaults({
  businessDate,
}: CashLoanFormDefaults): CashLoanFormValues {
  return {
    event_type: 'received',
    lender_type: 'bank',
    lender_name: '',
    owner_account_id: '',
    lender_key: '',
    payment_account_id: '',
    amount: '',
    transaction_date: businessDate,
    description: '',
    reference: '',
  };
}

type CashLoanFormProps = {
  ownerAccounts: AccountOption[];
  paymentAccounts: AccountOption[];
  balances: LenderBalance[];
  eventType: FinanceCashLoanEventType;
  lenderType: FinanceCashLoanLenderType;
  isSubmitting: boolean;
  onEventTypeChange: (
    eventType: FinanceCashLoanEventType
  ) => void;
  onSubmit: () => void;
};

export const CashLoanForm = withForm({
  defaultValues: {
    event_type: 'received',
    lender_type: 'bank',
    lender_name: '',
    owner_account_id: '',
    lender_key: '',
    payment_account_id: '',
    amount: '',
    transaction_date: '',
    description: '',
    reference: '',
  } as CashLoanFormValues,
  props: {
    ownerAccounts: [],
    paymentAccounts: [],
    balances: [],
    eventType: 'received',
    lenderType: 'bank',
    isSubmitting: false,
    onEventTypeChange: () => undefined,
    onSubmit: () => undefined,
  } as CashLoanFormProps,
  render: function Render({
    form,
    ownerAccounts,
    paymentAccounts,
    balances,
    eventType,
    lenderType,
    isSubmitting,
    onEventTypeChange,
    onSubmit,
  }) {
    const isReceipt = eventType === 'received';
    const availablePaymentAccounts = isReceipt
      ? paymentAccounts.filter(
          (account) => account.subtype === 'bank'
        )
      : paymentAccounts;
    const repayableBalances = balances.filter(
      (balance) => balance.outstanding_amount > 0
    );
    const canSubmit =
      availablePaymentAccounts.length > 0 &&
      (isReceipt
        ? lenderType !== 'owner' || ownerAccounts.length > 0
        : repayableBalances.length > 0);

    return (
      <form
        className="grid min-w-0 gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSubmit();
        }}
      >
        <FieldGroup className="grid min-w-0 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-sm font-medium">
              Jenis transaksi
            </p>
            <ToggleGroup
              value={[eventType]}
              onValueChange={(values) => {
                const nextValue = values[0];
                if (
                  nextValue === 'received' ||
                  nextValue === 'repayment'
                ) {
                  onEventTypeChange(nextValue);
                }
              }}
              aria-label="Jenis transaksi pinjaman"
              className="mt-2 w-full"
            >
              <ToggleGroupItem
                value="received"
                className="flex-1"
              >
                Terima pinjaman
              </ToggleGroupItem>
              <ToggleGroupItem
                value="repayment"
                className="flex-1"
              >
                Bayar pokok
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {isReceipt ? (
            <>
              <form.AppField
                name="lender_type"
                children={(field) => (
                  <field.SelectField
                    label="Sumber pinjaman"
                    placeholder="Pilih sumber"
                    className="min-w-0"
                    items={[
                      { label: 'Bank', value: 'bank' },
                      {
                        label:
                          'Bank digital / penyedia pinjaman',
                        value: 'digital_lender',
                      },
                      { label: 'Pemilik', value: 'owner' },
                      { label: 'Lainnya', value: 'other' },
                    ]}
                    description="Pinjaman pemilik tetap dicatat sebagai utang, bukan modal."
                  />
                )}
              />
              {lenderType === 'owner' ? (
                <form.AppField
                  name="owner_account_id"
                  children={(field) => (
                    <field.SelectField
                      label="Pemilik pemberi pinjaman"
                      placeholder="Pilih pemilik"
                      className="min-w-0"
                      disabled={!ownerAccounts.length}
                      items={ownerAccounts.map(
                        (account) => ({
                          label: `${account.code} — ${account.name}`,
                          value: account.id,
                        })
                      )}
                      description={
                        ownerAccounts.length
                          ? 'Identitas pemilik digunakan untuk merangkum sisa pinjaman.'
                          : 'Akun Modal Pemilik belum tersedia di Chart of Accounts.'
                      }
                    />
                  )}
                />
              ) : (
                <form.AppField
                  name="lender_name"
                  children={(field) => (
                    <field.TextField
                      label="Nama pemberi pinjaman"
                      maxLength={150}
                      placeholder={
                        lenderType === 'bank'
                          ? 'Contoh: Bank Mandiri'
                          : lenderType === 'digital_lender'
                            ? 'Contoh: Bank digital / penyedia pinjaman'
                            : 'Nama orang atau lembaga'
                      }
                      className="min-w-0"
                      description="Nama yang sama akan digabung pada ringkasan saldo pinjaman."
                    />
                  )}
                />
              )}
            </>
          ) : (
            <form.AppField
              name="lender_key"
              children={(field) => (
                <field.SelectField
                  label="Pinjaman yang dibayar"
                  placeholder="Pilih pemberi pinjaman"
                  className="min-w-0"
                  disabled={!repayableBalances.length}
                  items={repayableBalances.map(
                    (balance) => ({
                      label: `${balance.lender.name} — sisa ${formatMoney(balance.outstanding_amount)}`,
                      value: balance.lender.key,
                    })
                  )}
                  description="Pembayaran dibatasi sebesar sisa pokok yang tercatat."
                />
              )}
            />
          )}

          <form.AppField
            name="amount"
            children={(field) => (
              <field.MoneyField
                label={
                  isReceipt
                    ? 'Jumlah diterima'
                    : 'Pokok dibayar'
                }
                type="number"
                min={1}
                max={1_000_000_000_000_000}
                step={1}
                inputMode="numeric"
                placeholder="500000"
                className="min-w-0"
                description={
                  isReceipt
                    ? 'Jumlah dana pinjaman yang benar-benar masuk ke rekening usaha.'
                    : 'Hanya pokok pinjaman. Pencatatan bunga ditambahkan pada tahap berikutnya.'
                }
              />
            )}
          />
          <form.AppField
            name="payment_account_id"
            children={(field) => (
              <field.SelectField
                label={
                  isReceipt
                    ? 'Rekening penerima'
                    : 'Bayar dari'
                }
                placeholder={
                  isReceipt
                    ? 'Pilih akun Bank'
                    : 'Pilih akun Kas/Bank'
                }
                className="min-w-0"
                disabled={!availablePaymentAccounts.length}
                items={availablePaymentAccounts.map(
                  (account) => ({
                    label: `${account.code} — ${account.name}`,
                    value: account.id,
                  })
                )}
                description={
                  isReceipt
                    ? 'Pilih akun bank usaha aktif. Akun Bank Operasional induk tidak dapat diposting.'
                    : 'Pilih akun Kas atau Bank tempat pembayaran pokok dilakukan.'
                }
              />
            )}
          />
          <form.AppField
            name="transaction_date"
            children={(field) => (
              <field.DateField
                label="Tanggal transaksi"
                valueType="string"
                placeholder="Pilih tanggal"
                required
                className="min-w-0"
                buttonClassName="w-full"
              />
            )}
          />
          <form.AppField
            name="description"
            children={(field) => (
              <field.TextField
                label="Deskripsi (opsional)"
                maxLength={500}
                placeholder={
                  isReceipt
                    ? 'Contoh: Pinjaman untuk modal kerja'
                    : 'Contoh: Pembayaran pokok pinjaman bulan ini'
                }
                className="min-w-0"
              />
            )}
          />
          <form.AppField
            name="reference"
            children={(field) => (
              <field.TextField
                label="Referensi (opsional)"
                maxLength={120}
                placeholder="Contoh: TRANSFER-2026-09"
                className="min-w-0"
              />
            )}
          />
        </FieldGroup>

        <Alert>
          <AlertTitle>
            {isReceipt
              ? 'Catat setelah dana diterima'
              : 'Pembayaran pokok saja'}
          </AlertTitle>
          <AlertDescription>
            {isReceipt
              ? 'Alur ini untuk pinjaman yang dananya masuk ke rekening usaha. Pembelian yang dibayar langsung oleh pemberi pinjaman dicatat melalui Pembelian.'
              : 'Jurnal akan mengurangi utang pokok dan saldo Kas/Bank. Bunga belum dicatat dalam tahap ini.'}
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {!canSubmit ? (
            <p className="text-muted-foreground text-sm">
              {isReceipt
                ? lenderType === 'owner'
                  ? 'Siapkan akun Modal Pemilik dan rekening Bank aktif sebelum mencatat pinjaman ini.'
                  : 'Tambahkan rekening Bank usaha yang aktif di Kas & Bank sebelum mencatat pinjaman.'
                : 'Belum ada pinjaman dengan sisa pokok untuk dibayar.'}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Menyimpan…
              </>
            ) : isReceipt ? (
              'Simpan & catat dana masuk'
            ) : (
              'Simpan & catat pembayaran pokok'
            )}
          </Button>
        </div>
      </form>
    );
  },
});
