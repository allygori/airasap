'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  FinanceOpeningBalanceDraftInputDTO,
  FinanceOpeningBalanceSetupResponseDTO,
} from '@/modules/finance';
import { FinanceOpeningBalanceSetupResponseSchema } from '@/modules/finance';

type FinanceOpeningBalanceFormProps = {
  enabled: boolean;
};

type InventoryLineState = {
  inventory_item_id: string;
  location_id: string;
  quantity: string;
  unit_cost: string;
};

type SubledgerLineState = {
  account_id: string;
  amount: string;
  counterparty: string;
  reference: string;
};

type FormState = {
  cut_off_date: string;
  mode: 'entered' | 'zero';
  description: string;
  cash_bank_amounts: Record<string, string>;
  inventory_lines: InventoryLineState[];
  payable_lines: SubledgerLineState[];
  receivable_lines: SubledgerLineState[];
  owner_capital_account_id: string;
  owner_capital_amount: string;
};

const moneyFormatter = new Intl.NumberFormat('id-ID');

const todayInputValue = () =>
  new Date().toISOString().slice(0, 10);

const emptyInventoryLine = (
  setup: FinanceOpeningBalanceSetupResponseDTO
): InventoryLineState => ({
  inventory_item_id:
    setup.options.inventory_items[0]?.id ?? '',
  location_id: setup.options.locations[0]?.id ?? '',
  quantity: '',
  unit_cost: '',
});

const emptySubledgerLine = (
  accountId: string
): SubledgerLineState => ({
  account_id: accountId,
  amount: '',
  counterparty: '',
  reference: '',
});

const toFormState = (
  setup: FinanceOpeningBalanceSetupResponseDTO
): FormState => {
  const amounts = Object.fromEntries(
    setup.options.cash_bank_accounts.map((account) => [
      account.id,
      String(
        setup.draft?.cash_bank_lines.find(
          (line) => line.account_id === account.id
        )?.amount ?? ''
      ),
    ])
  );

  return {
    cut_off_date:
      setup.draft?.cut_off_date ?? todayInputValue(),
    mode: setup.draft?.mode ?? 'entered',
    description:
      setup.draft?.description ?? 'Saldo awal Finance',
    cash_bank_amounts: amounts,
    inventory_lines:
      setup.draft?.inventory_lines.map((line) => ({
        inventory_item_id: line.inventory_item_id,
        location_id: line.location_id,
        quantity: String(line.quantity),
        unit_cost: String(line.unit_cost ?? ''),
      })) ?? [],
    payable_lines:
      setup.draft?.payable_lines.map((line) => ({
        account_id: line.account_id,
        amount: String(line.amount),
        counterparty: line.counterparty ?? '',
        reference: line.reference ?? '',
      })) ?? [],
    receivable_lines:
      setup.draft?.receivable_lines.map((line) => ({
        account_id: line.account_id,
        amount: String(line.amount),
        counterparty: line.counterparty ?? '',
        reference: line.reference ?? '',
      })) ?? [],
    owner_capital_account_id:
      setup.draft?.owner_capital_account_id ??
      setup.options.equity_accounts[0]?.id ??
      '',
    owner_capital_amount: String(
      setup.draft?.owner_capital_amount ?? ''
    ),
  };
};

const numberValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatMoney = (value: number) =>
  `Rp ${moneyFormatter.format(value)}`;

export default function FinanceOpeningBalanceForm({
  enabled,
}: FinanceOpeningBalanceFormProps) {
  const [setup, setSetup] =
    useState<FinanceOpeningBalanceSetupResponseDTO | null>(
      null
    );
  const [form, setForm] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const loadSetup = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          '/api/v1/dashboard/finance/onboarding/opening-balance',
          { cache: 'no-store' }
        );
        const payload: unknown = await response.json();
        const nextSetup = parseSetupResponse(payload);

        if (!response.ok || !nextSetup) {
          if (!cancelled) {
            setErrorMessage(
              getErrorMessage(payload) ??
                'Setup opening balance gagal dimuat.'
            );
          }
          return;
        }

        if (!cancelled) {
          setSetup(nextSetup);
          setForm(toFormState(nextSetup));
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(
            'Setup opening balance gagal dimuat. Coba lagi.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSetup();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const summary = useMemo(() => {
    if (!setup || !form || form.mode === 'zero') {
      return {
        cashBank: 0,
        inventory: 0,
        receivable: 0,
        payable: 0,
        capital: 0,
        retained: 0,
      };
    }

    const cashBank = Object.values(
      form.cash_bank_amounts
    ).reduce((sum, value) => sum + numberValue(value), 0);
    const inventory = form.inventory_lines.reduce(
      (sum, line) =>
        sum +
        numberValue(line.quantity) *
          numberValue(line.unit_cost),
      0
    );
    const receivable = form.receivable_lines.reduce(
      (sum, line) => sum + numberValue(line.amount),
      0
    );
    const payable = form.payable_lines.reduce(
      (sum, line) => sum + numberValue(line.amount),
      0
    );
    const capital = numberValue(form.owner_capital_amount);
    const totalAssets = cashBank + inventory + receivable;

    return {
      cashBank,
      inventory,
      receivable,
      payable,
      capital,
      retained: totalAssets - payable - capital,
    };
  }, [form, setup]);

  if (!enabled) return null;

  if (isLoading || !form || !setup) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-sm">
          Memuat pilihan akun, inventory, dan lokasi untuk
          opening balance…
        </CardContent>
      </Card>
    );
  }

  const updateForm = (next: Partial<FormState>) =>
    setForm((current) =>
      current ? { ...current, ...next } : current
    );

  const saveDraft = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: FinanceOpeningBalanceDraftInputDTO = {
        cut_off_date: form.cut_off_date,
        mode: form.mode,
        description: form.description,
        cash_bank_lines:
          form.mode === 'entered'
            ? Object.entries(form.cash_bank_amounts)
                .filter(
                  ([, amount]) => numberValue(amount) > 0
                )
                .map(([account_id, amount]) => ({
                  account_id,
                  amount: numberValue(amount),
                }))
            : [],
        inventory_lines:
          form.mode === 'entered'
            ? form.inventory_lines
                .filter(
                  (line) => numberValue(line.quantity) > 0
                )
                .map((line) => ({
                  inventory_item_id: line.inventory_item_id,
                  location_id: line.location_id,
                  quantity: numberValue(line.quantity),
                  ...(numberValue(line.unit_cost) > 0
                    ? {
                        unit_cost: numberValue(
                          line.unit_cost
                        ),
                      }
                    : {}),
                }))
            : [],
        payable_lines:
          form.mode === 'entered'
            ? form.payable_lines
                .filter(
                  (line) => numberValue(line.amount) > 0
                )
                .map((line) => ({
                  account_id: line.account_id,
                  amount: numberValue(line.amount),
                  ...(line.counterparty.trim()
                    ? {
                        counterparty:
                          line.counterparty.trim(),
                      }
                    : {}),
                  ...(line.reference.trim()
                    ? { reference: line.reference.trim() }
                    : {}),
                }))
            : [],
        receivable_lines:
          form.mode === 'entered'
            ? form.receivable_lines
                .filter(
                  (line) => numberValue(line.amount) > 0
                )
                .map((line) => ({
                  account_id: line.account_id,
                  amount: numberValue(line.amount),
                  ...(line.counterparty.trim()
                    ? {
                        counterparty:
                          line.counterparty.trim(),
                      }
                    : {}),
                  ...(line.reference.trim()
                    ? { reference: line.reference.trim() }
                    : {}),
                }))
            : [],
        ...(form.mode === 'entered'
          ? {
              owner_capital_account_id:
                form.owner_capital_account_id,
              owner_capital_amount: numberValue(
                form.owner_capital_amount
              ),
            }
          : {}),
      };

      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/opening-balance',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const responsePayload: unknown =
        await response.json();
      const nextSetup = parseSetupResponse(responsePayload);

      if (!response.ok || !nextSetup) {
        setErrorMessage(
          getErrorMessage(responsePayload) ??
            'Draft opening balance gagal disimpan.'
        );
        return;
      }

      setSetup(nextSetup);
      setForm(toFormState(nextSetup));
      setSuccessMessage('Draft opening balance tersimpan.');
    } catch {
      setErrorMessage(
        'Draft opening balance gagal disimpan. Coba lagi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Saldo awal Finance</CardTitle>
              <CardDescription className="mt-1">
                Masukkan kondisi toko pada satu tanggal
                cut-off. Ini belum membuat journal atau
                mengaktifkan Finance.
              </CardDescription>
            </div>
            <Badge variant="info">Draft</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
            <div className="space-y-2">
              <Label htmlFor="opening-cut-off-date">
                Tanggal cut-off
              </Label>
              <Input
                id="opening-cut-off-date"
                type="date"
                value={form.cut_off_date}
                onChange={(event) =>
                  updateForm({
                    cut_off_date: event.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening-description">
                Catatan
              </Label>
              <Input
                id="opening-description"
                value={form.description}
                maxLength={240}
                onChange={(event) =>
                  updateForm({
                    description: event.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ModeOption
              active={form.mode === 'entered'}
              title="Masukkan saldo awal"
              description="Catat kas, inventory, hutang, dan modal yang benar-benar ada."
              onClick={() =>
                updateForm({ mode: 'entered' })
              }
            />
            <ModeOption
              active={form.mode === 'zero'}
              title="Mulai dari nol"
              description="Tidak ada saldo awal yang perlu dicatat sekarang."
              onClick={() => updateForm({ mode: 'zero' })}
            />
          </div>

          {form.mode === 'entered' && (
            <div className="space-y-8">
              <section className="space-y-4">
                <SectionHeading
                  title="Kas, Bank, dan Saldo Marketplace"
                  description="Isi hanya akun yang memiliki saldo pada tanggal cut-off."
                />
                <div className="grid gap-3">
                  {setup.options.cash_bank_accounts
                    .length === 0 ? (
                    <EmptyHint>
                      Belum ada akun Kas, Bank, E-wallet,
                      atau Saldo Marketplace yang dapat
                      diposting.
                    </EmptyHint>
                  ) : (
                    setup.options.cash_bank_accounts.map(
                      (account) => (
                        <div
                          key={account.id}
                          className="bg-muted/20 grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_12rem] md:items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {account.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {account.code} ·{' '}
                              {account.subtype ?? 'asset'}
                            </p>
                          </div>
                          <Input
                            aria-label={`Saldo ${account.name}`}
                            inputMode="numeric"
                            placeholder="0"
                            value={
                              form.cash_bank_amounts[
                                account.id
                              ] ?? ''
                            }
                            onChange={(event) =>
                              updateForm({
                                cash_bank_amounts: {
                                  ...form.cash_bank_amounts,
                                  [account.id]:
                                    event.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      )
                    )
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <SectionHeading
                  title="Persediaan barang"
                  description="Satu baris untuk satu item pada satu lokasi. Unit cost dipakai untuk nilai inventory."
                />
                {form.inventory_lines.map((line, index) => (
                  <InventoryLine
                    key={`${index}-${line.inventory_item_id}-${line.location_id}`}
                    line={line}
                    setup={setup}
                    onChange={(next) => {
                      const lines = [
                        ...form.inventory_lines,
                      ];
                      lines[index] = next;
                      updateForm({
                        inventory_lines: lines,
                      });
                    }}
                    onRemove={() =>
                      updateForm({
                        inventory_lines:
                          form.inventory_lines.filter(
                            (_, lineIndex) =>
                              lineIndex !== index
                          ),
                      })
                    }
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateForm({
                      inventory_lines: [
                        ...form.inventory_lines,
                        emptyInventoryLine(setup),
                      ],
                    })
                  }
                  disabled={
                    setup.options.inventory_items.length ===
                    0
                  }
                >
                  Tambah item inventory
                </Button>
                {setup.options.inventory_items.length ===
                  0 && (
                  <EmptyHint>
                    Belum ada Finance inventory item aktif.
                    Inventory dapat disiapkan pada tahap
                    inventory Finance.
                  </EmptyHint>
                )}
              </section>

              <SubledgerSection
                title="Hutang supplier"
                description="Gunakan satu baris per supplier. Jika hanya punya angka total, gunakan reference seperti ‘Saldo hutang lama’."
                lines={form.payable_lines}
                accounts={setup.options.liability_accounts}
                emptyLabel="Belum ada akun liability postable."
                addLabel="Tambah hutang"
                onChange={(lines) =>
                  updateForm({ payable_lines: lines })
                }
              />

              <SubledgerSection
                title="Piutang (opsional)"
                description="Masukkan hanya piutang yang memang ingin ditampilkan dan disettle dari Finance."
                lines={form.receivable_lines}
                accounts={setup.options.receivable_accounts}
                emptyLabel="Belum ada akun piutang postable."
                addLabel="Tambah piutang"
                onChange={(lines) =>
                  updateForm({ receivable_lines: lines })
                }
              />

              <section className="space-y-4">
                <SectionHeading
                  title="Modal pemilik"
                  description="Saldo laba/retained earnings akan dihitung otomatis saat finalisasi."
                />
                <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
                  <select
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                    aria-label="Akun modal pemilik"
                    value={form.owner_capital_account_id}
                    onChange={(event) =>
                      updateForm({
                        owner_capital_account_id:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Pilih akun modal pemilik
                    </option>
                    {setup.options.equity_accounts.map(
                      (account) => (
                        <option
                          key={account.id}
                          value={account.id}
                        >
                          {account.code} — {account.name}
                        </option>
                      )
                    )}
                  </select>
                  <Input
                    aria-label="Jumlah modal pemilik"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.owner_capital_amount}
                    onChange={(event) =>
                      updateForm({
                        owner_capital_amount:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </section>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t pt-5">
            <Button
              type="button"
              onClick={saveDraft}
              disabled={isSaving}
            >
              {isSaving ? 'Menyimpan…' : 'Simpan draft'}
            </Button>
            <p className="text-muted-foreground text-xs">
              Draft dapat diubah sebelum finalisasi.
            </p>
          </div>

          {errorMessage && (
            <p
              className="text-destructive text-sm"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p
              className="text-success text-sm"
              role="status"
            >
              {successMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Ringkasan cepat</CardTitle>
          <CardDescription>
            Estimasi dari draft yang sedang diisi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SummaryRow
            label="Kas & saldo"
            value={summary.cashBank}
          />
          <SummaryRow
            label="Persediaan"
            value={summary.inventory}
          />
          <SummaryRow
            label="Piutang"
            value={summary.receivable}
          />
          <SummaryRow
            label="Total aset"
            value={
              summary.cashBank +
              summary.inventory +
              summary.receivable
            }
            strong
          />
          <div className="border-t pt-3" />
          <SummaryRow
            label="Hutang"
            value={summary.payable}
          />
          <SummaryRow
            label="Modal pemilik"
            value={summary.capital}
          />
          <SummaryRow
            label="Saldo laba otomatis"
            value={summary.retained}
            tone={
              summary.retained < 0 ? 'warning' : 'default'
            }
          />
          <p className="text-muted-foreground pt-3 text-xs leading-5">
            Nilai ini belum menjadi journal. Phase
            berikutnya akan memvalidasi dan mem-posting satu
            opening batch yang immutable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ModeOption({
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
      className={`rounded-xl border p-4 text-left transition-colors ${
        active
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'border-border hover:bg-muted/40'
      }`}
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

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm leading-5">
        {description}
      </p>
    </div>
  );
}

function EmptyHint({ children }: { children: string }) {
  return (
    <div className="border-border bg-muted/20 text-muted-foreground rounded-xl border border-dashed p-4 text-sm leading-5">
      {children}
    </div>
  );
}

function InventoryLine({
  line,
  setup,
  onChange,
  onRemove,
}: {
  line: InventoryLineState;
  setup: FinanceOpeningBalanceSetupResponseDTO;
  onChange: (line: InventoryLineState) => void;
  onRemove: () => void;
}) {
  const item = setup.options.inventory_items.find(
    (option) => option.id === line.inventory_item_id
  );

  return (
    <div className="bg-muted/20 grid gap-3 rounded-xl border p-3 md:grid-cols-[1.2fr_1fr_7rem_8rem_auto] md:items-end">
      <SelectField
        label="Item"
        value={line.inventory_item_id}
        options={setup.options.inventory_items.map(
          (option) => ({
            value: option.id,
            label: `${option.sku} — ${option.name}`,
          })
        )}
        onChange={(value) =>
          onChange({ ...line, inventory_item_id: value })
        }
      />
      <SelectField
        label="Lokasi"
        value={line.location_id}
        options={setup.options.locations.map((option) => ({
          value: option.id,
          label: `${option.code} — ${option.name}`,
        }))}
        onChange={(value) =>
          onChange({ ...line, location_id: value })
        }
      />
      <NumericField
        label={`Quantity${item ? ` (${item.unit})` : ''}`}
        value={line.quantity}
        onChange={(value) =>
          onChange({ ...line, quantity: value })
        }
      />
      <NumericField
        label="Unit cost"
        value={line.unit_cost}
        onChange={(value) =>
          onChange({ ...line, unit_cost: value })
        }
      />
      <Button
        type="button"
        variant="ghost"
        onClick={onRemove}
      >
        Hapus
      </Button>
    </div>
  );
}

function SubledgerSection({
  title,
  description,
  lines,
  accounts,
  emptyLabel,
  addLabel,
  onChange,
}: {
  title: string;
  description: string;
  lines: SubledgerLineState[];
  accounts: FinanceOpeningBalanceSetupResponseDTO['options']['liability_accounts'];
  emptyLabel: string;
  addLabel: string;
  onChange: (lines: SubledgerLineState[]) => void;
}) {
  return (
    <section className="space-y-4">
      <SectionHeading
        title={title}
        description={description}
      />
      {lines.map((line, index) => (
        <div
          key={`${index}-${line.account_id}`}
          className="bg-muted/20 grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_8rem_1fr_1fr_auto] md:items-end"
        >
          <SelectField
            label="Akun"
            value={line.account_id}
            options={accounts.map((account) => ({
              value: account.id,
              label: `${account.code} — ${account.name}`,
            }))}
            onChange={(value) => {
              const next = [...lines];
              next[index] = { ...line, account_id: value };
              onChange(next);
            }}
          />
          <NumericField
            label="Jumlah"
            value={line.amount}
            onChange={(value) => {
              const next = [...lines];
              next[index] = { ...line, amount: value };
              onChange(next);
            }}
          />
          <TextField
            label="Counterparty"
            value={line.counterparty}
            onChange={(value) => {
              const next = [...lines];
              next[index] = {
                ...line,
                counterparty: value,
              };
              onChange(next);
            }}
          />
          <TextField
            label="Reference"
            value={line.reference}
            onChange={(value) => {
              const next = [...lines];
              next[index] = { ...line, reference: value };
              onChange(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              onChange(
                lines.filter(
                  (_, lineIndex) => lineIndex !== index
                )
              )
            }
          >
            Hapus
          </Button>
        </div>
      ))}
      {accounts.length === 0 && (
        <EmptyHint>{emptyLabel}</EmptyHint>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={accounts.length === 0}
        onClick={() =>
          onChange([
            ...lines,
            emptySubledgerLine(accounts[0].id),
          ])
        }
      >
        {addLabel}
      </Button>
    </section>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium">
      {label}
      <select
        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border px-2 text-sm font-normal outline-none focus-visible:ring-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Pilih</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumericField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium">
      {label}
      <Input
        inputMode="numeric"
        value={value}
        placeholder="0"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium">
      {label}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SummaryRow({
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
    <div className="flex items-center justify-between gap-3">
      <span
        className={
          strong ? 'font-semibold' : 'text-muted-foreground'
        }
      >
        {label}
      </span>
      <span
        className={`${strong ? 'font-semibold' : 'font-medium'} ${
          tone === 'warning' ? 'text-warning' : ''
        }`}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}

function parseSetupResponse(
  payload: unknown
): FinanceOpeningBalanceSetupResponseDTO | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    return null;
  }

  try {
    return parseSetupData(payload.data);
  } catch {
    return null;
  }
}

function parseSetupData(
  value: unknown
): FinanceOpeningBalanceSetupResponseDTO {
  return FinanceOpeningBalanceSetupResponseSchema.parse(
    value
  );
}

function getErrorMessage(payload: unknown) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('error' in payload) ||
    !payload.error ||
    typeof payload.error !== 'object' ||
    !('message' in payload.error) ||
    typeof payload.error.message !== 'string'
  ) {
    return null;
  }

  return payload.error.message;
}
