/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldGroup } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import type { FinanceOpeningBalanceFormApi } from '../../finance-opening-balance.form';
import { formatMoney } from './finance-opening-balance.utils';
import type {
  FinanceOpeningBalancePreviewDTO,
  FinanceOpeningBalanceSetupResponseDTO,
} from '@/modules/finance/client';
import { cn } from '@/lib/ui';

export function OpeningSubledgerSection({
  form,
  fieldName,
  title,
  description,
  accounts,
  counterpartyLabel,
  addLabel,
  emptyLabel,
  isDisabled,
}: {
  form: FinanceOpeningBalanceFormApi;
  fieldName: 'payable_lines' | 'receivable_lines';
  title: string;
  description: string;
  accounts: FinanceOpeningBalanceSetupResponseDTO['options']['liability_accounts'];
  counterpartyLabel: string;
  addLabel: string;
  emptyLabel: string;
  isDisabled: boolean;
}) {
  return (
    <section className="grid min-w-0 gap-4">
      <SectionHeading
        title={title}
        description={description}
      />
      {accounts.length === 0 ? (
        <EmptyHint>{emptyLabel}</EmptyHint>
      ) : (
        <form.AppField
          name={fieldName}
          mode="array"
          children={(arrayField) => (
            <div className="grid min-w-0 gap-4">
              {arrayField.state.value.map((line, index) => {
                if (
                  !accounts.some(
                    (account) =>
                      account.id === line.account_id
                  )
                ) {
                  return null;
                }

                return (
                  <div
                    key={line.line_key}
                    className="bg-muted/20 grid min-w-0 gap-4 rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">
                        {title.startsWith('Utang')
                          ? 'Utang'
                          : 'Piutang'}{' '}
                        {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isDisabled}
                        onClick={() =>
                          arrayField.removeValue(index)
                        }
                      >
                        Hapus
                      </Button>
                    </div>
                    <FieldGroup className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <form.AppField
                        name={
                          `${fieldName}[${index}].account_id` as const
                        }
                        children={(field) => (
                          <field.SelectField
                            label="Akun"
                            placeholder="Pilih akun"
                            className="min-w-0"
                            disabled={isDisabled}
                            items={accounts.map(
                              (account) => ({
                                value: account.id,
                                label: `${account.code} — ${account.name}`,
                              })
                            )}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `${fieldName}[${index}].amount` as const
                        }
                        children={(field) => (
                          <field.MoneyField
                            label="Jumlah"
                            inputMode="numeric"
                            min={0}
                            className="min-w-0"
                            disabled={isDisabled}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `${fieldName}[${index}].counterparty` as const
                        }
                        children={(field) => (
                          <field.TextField
                            label={counterpartyLabel}
                            maxLength={160}
                            className="min-w-0"
                            disabled={isDisabled}
                          />
                        )}
                      />
                      <form.AppField
                        name={
                          `${fieldName}[${index}].reference` as const
                        }
                        children={(field) => (
                          <field.TextField
                            label="Referensi (opsional)"
                            maxLength={160}
                            className="min-w-0"
                            disabled={isDisabled}
                          />
                        )}
                      />
                    </FieldGroup>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                disabled={isDisabled}
                onClick={() =>
                  arrayField.pushValue({
                    line_key: crypto.randomUUID(),
                    account_id: accounts[0]?.id ?? '',
                    amount: '',
                    counterparty: '',
                    reference: '',
                  })
                }
              >
                {addLabel}
              </Button>
            </div>
          )}
        />
      )}
    </section>
  );
}

export function OpeningBalancePreview({
  preview,
  confirmed,
  onConfirmedChange,
  onFinalize,
  isFinalizing,
  isFinalized,
}: {
  preview: FinanceOpeningBalancePreviewDTO;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onFinalize: () => void;
  isFinalizing: boolean;
  isFinalized: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-5">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Preview jurnal saldo awal</CardTitle>
          <CardDescription>
            Per tanggal {preview.cut_off_date}. Setelah
            dikonfirmasi, jurnal dan pergerakan persediaan
            tidak dapat diedit langsung.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PreviewMetric
              label="Total debit"
              value={formatMoney(preview.total_debit)}
            />
            <PreviewMetric
              label="Total kredit"
              value={formatMoney(preview.total_credit)}
            />
            <PreviewMetric
              label="Pergerakan stok"
              value={String(
                preview.inventory_movement_count
              )}
            />
            <PreviewMetric
              label="Item utang / piutang"
              value={String(
                preview.payable_item_count +
                  preview.receivable_item_count
              )}
            />
          </div>

          {preview.will_create_journal ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[38rem] text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Akun</th>
                    <th className="px-4 py-3">
                      Keterangan
                    </th>
                    <th className="px-4 py-3 text-right">
                      Debit
                    </th>
                    <th className="px-4 py-3 text-right">
                      Kredit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.journal_lines.map((line) => (
                    <tr key={line.account_id}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">
                          {line.account_code}
                        </span>{' '}
                        {line.account_name}
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {line.description}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {line.debit
                          ? formatMoney(line.debit)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {line.credit
                          ? formatMoney(line.credit)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert>
              <HugeiconsIcon icon={InformationCircleIcon} />
              <AlertDescription>
                {preview.mode === 'zero'
                  ? 'Mulai dari nol tidak membuat jurnal atau pergerakan persediaan.'
                  : 'Semua saldo awal yang dimasukkan bernilai nol. Finance akan diaktifkan tanpa membuat jurnal saldo awal atau pergerakan persediaan. Rekening yang telah disiapkan tetap tersedia.'}
              </AlertDescription>
            </Alert>
          )}

          {preview.inventory_movements.length > 0 ? (
            <section className="grid min-w-0 gap-3">
              <SectionHeading
                title="Stok yang akan dicatat"
                description="Periksa item, lokasi, kuantitas, dan nilai perolehan."
              />
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Lokasi</th>
                      <th className="px-4 py-3 text-right">
                        Jumlah
                      </th>
                      <th className="px-4 py-3 text-right">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.inventory_movements.map(
                      (movement, index) => (
                        <tr
                          key={`${movement.inventory_item_id}:${movement.location_id}:${index}`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">
                              {movement.sku}
                            </span>{' '}
                            {movement.item_name}
                          </td>
                          <td className="px-4 py-3">
                            {movement.location_name}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {movement.quantity}{' '}
                            {movement.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatMoney(
                              movement.total_cost
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {preview.subledger_items.length > 0 ? (
            <section className="grid gap-3">
              <SectionHeading
                title="Utang dan piutang"
                description="Saldo per pihak yang akan tersedia untuk ditinjau di Finance."
              />
              <div className="divide-y rounded-xl border">
                {preview.subledger_items.map(
                  (item, index) => (
                    <div
                      key={`${item.balance_type}:${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span>
                        <Badge
                          variant={
                            item.balance_type === 'payable'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {item.balance_type === 'payable'
                            ? 'Utang'
                            : 'Piutang'}
                        </Badge>{' '}
                        {item.source_label}
                      </span>
                      <span className="font-mono font-medium">
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          <div className="border-border flex items-start gap-3 rounded-xl border p-4 text-sm leading-6">
            <Checkbox
              id="finance-opening-balance-confirmation"
              checked={confirmed}
              disabled={isFinalized || isFinalizing}
              onCheckedChange={(value) =>
                onConfirmedChange(value === true)
              }
              className="mt-1"
            />
            <label htmlFor="finance-opening-balance-confirmation">
              Saya sudah memeriksa tanggal dan saldo.
              Aktifkan Finance dengan saldo awal ini.
            </label>
          </div>
          <Button
            type="button"
            onClick={onFinalize}
            disabled={
              !confirmed || isFinalizing || isFinalized
            }
          >
            {isFinalizing
              ? 'Mengaktifkan Finance…'
              : 'Konfirmasi dan aktifkan Finance'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ModeOption({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-xl border p-4 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'border-border hover:bg-muted/40'
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      <p className="font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm leading-5">
        {description}
      </p>
    </button>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm leading-5">
        {description}
      </p>
    </div>
  );
}

export function EmptyHint({
  children,
}: {
  children: string;
}) {
  return (
    <Alert>
      <HugeiconsIcon icon={InformationCircleIcon} />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/30 min-w-0 rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg font-semibold break-words">
        {value}
      </p>
    </div>
  );
}

export function SummaryRow({
  label,
  value,
  strong = false,
  tone = 'default',
}: {
  label: string;
  value: number;
  strong?: boolean;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span
        className={cn(
          'text-muted-foreground min-w-0',
          strong && 'text-foreground font-semibold'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'shrink-0 font-mono',
          strong && 'font-semibold',
          tone === 'warning' && 'text-warning'
        )}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}
