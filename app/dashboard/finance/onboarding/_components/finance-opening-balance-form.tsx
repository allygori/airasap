'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  FinanceOpeningBalanceFinalizeResponseDTO,
  FinanceOpeningBalancePreviewDTO,
  FinanceOpeningBalanceSetupResponseDTO,
} from '@/modules/finance';
import {
  FinanceOpeningBalanceFinalizeResponseSchema,
  FinanceOpeningBalancePreviewSchema,
  FinanceOpeningBalanceSetupResponseSchema,
} from '@/modules/finance';

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
    setup.options.inventory_items.find(
      (item) => item.track_quantity && item.track_value
    )?.id ?? '',
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

const getEligibleInventoryItems = (
  setup: FinanceOpeningBalanceSetupResponseDTO
) =>
  setup.options.inventory_items.filter(
    (item) =>
      item.item_type !== 'fixed_asset' &&
      item.track_quantity &&
      item.track_value
  );

export default function FinanceOpeningBalanceForm({
  enabled,
}: FinanceOpeningBalanceFormProps) {
  const router = useRouter();
  const [setup, setSetup] =
    useState<FinanceOpeningBalanceSetupResponseDTO | null>(
      null
    );
  const [form, setForm] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [preview, setPreview] =
    useState<FinanceOpeningBalancePreviewDTO | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [finalized, setFinalized] = useState(false);
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

  const updateForm = (next: Partial<FormState>) => {
    setPreview(null);
    setConfirmed(false);
    setForm((current) =>
      current ? { ...current, ...next } : current
    );
  };

  const saveDraft = async (): Promise<boolean> => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPreview(null);
    setConfirmed(false);

    if (form.mode === 'entered') {
      if (!form.owner_capital_account_id) {
        setErrorMessage(
          'Pilih akun Modal Pemilik terlebih dahulu.'
        );
        return false;
      }
      if (form.owner_capital_amount.trim() === '') {
        setErrorMessage(
          'Isi Modal Pemilik; masukkan 0 jika memang tidak ada modal yang dicatat.'
        );
        return false;
      }
      if (
        form.inventory_lines.some(
          (line) =>
            numberValue(line.quantity) > 0 &&
            line.unit_cost.trim() === ''
        )
      ) {
        setErrorMessage(
          'Isi unit cost untuk setiap inventory yang memiliki quantity.'
        );
        return false;
      }
      if (
        [
          ...form.payable_lines,
          ...form.receivable_lines,
        ].some(
          (line) =>
            numberValue(line.amount) > 0 &&
            !line.counterparty.trim() &&
            !line.reference.trim()
        )
      ) {
        setErrorMessage(
          'Isi nama supplier/counterparty atau reference untuk setiap hutang/piutang.'
        );
        return false;
      }
    }

    setIsSaving(true);

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
                  ...(line.unit_cost.trim() !== ''
                    ? { unit_cost: Number(line.unit_cost) }
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
        return false;
      }

      setSetup(nextSetup);
      setForm(toFormState(nextSetup));
      setSuccessMessage('Draft opening balance tersimpan.');
      return true;
    } catch {
      setErrorMessage(
        'Draft opening balance gagal disimpan. Coba lagi.'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const showPreview = async () => {
    setIsPreviewing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (!(await saveDraft())) return;

      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/opening-balance/preview',
        { cache: 'no-store' }
      );
      const payload: unknown = await response.json();
      const parsed = parsePreviewResponse(payload);
      if (!response.ok || !parsed) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Preview opening balance gagal dibuat.'
        );
        return;
      }
      setPreview(parsed);
      setConfirmed(false);
      setSuccessMessage(
        'Draft tervalidasi. Periksa preview sebelum finalisasi.'
      );
    } catch {
      setErrorMessage(
        'Preview opening balance gagal dibuat. Coba lagi.'
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const finalizeOpeningBalance = async () => {
    setIsFinalizing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/onboarding/opening-balance/finalize',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmed: true }),
        }
      );
      const payload: unknown = await response.json();
      const result = parseFinalizeResponse(payload);
      if (!response.ok || !result) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Finalisasi opening balance gagal.'
        );
        return;
      }
      setFinalized(true);
      setSuccessMessage(
        result.status === 'skipped'
          ? 'Finance aktif dengan pilihan mulai dari nol.'
          : 'Finance aktif dan saldo awal sudah dicatat.'
      );
      router.refresh();
    } catch {
      setErrorMessage('Finalisasi gagal. Coba lagi.');
    } finally {
      setIsFinalizing(false);
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
          <fieldset
            className="contents"
            disabled={
              isSaving ||
              isPreviewing ||
              isFinalizing ||
              finalized
            }
          >
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
                    description="Masukkan saldo tiap akun pada tanggal cut-off. Akun yang dibiarkan kosong dianggap tidak memiliki saldo awal."
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
                  {form.inventory_lines.map(
                    (line, index) => (
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
                    )
                  )}
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
                      getEligibleInventoryItems(setup)
                        .length === 0 ||
                      setup.options.locations.length === 0
                    }
                  >
                    Tambah item inventory
                  </Button>
                  {getEligibleInventoryItems(setup)
                    .length === 0 && (
                    <EmptyHint>
                      Belum ada item yang melacak quantity
                      dan nilai. Item seperti ini tidak
                      dapat dinilai pada saldo awal.
                    </EmptyHint>
                  )}
                  {setup.options.locations.length === 0 && (
                    <EmptyHint>
                      Belum ada lokasi inventory aktif; buat
                      lokasi sebelum memasukkan saldo
                      persediaan.
                    </EmptyHint>
                  )}
                </section>

                <SubledgerSection
                  title="Hutang supplier"
                  description="Gunakan satu baris per supplier. Jika hanya punya angka total, gunakan reference seperti ‘Saldo hutang lama’."
                  lines={form.payable_lines}
                  accounts={
                    setup.options.liability_accounts
                  }
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
                  accounts={
                    setup.options.receivable_accounts
                  }
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
                  {setup.options.equity_accounts.length ===
                    0 && (
                    <EmptyHint>
                      Akun Modal Pemilik belum tersedia atau
                      belum dapat diposting.
                    </EmptyHint>
                  )}
                </section>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              <Button
                type="button"
                onClick={saveDraft}
                disabled={
                  isSaving || isPreviewing || finalized
                }
              >
                {isSaving ? 'Menyimpan…' : 'Simpan draft'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={showPreview}
                disabled={
                  isSaving || isPreviewing || finalized
                }
              >
                {isPreviewing
                  ? 'Memvalidasi…'
                  : 'Preview & validasi'}
              </Button>
              <p className="text-muted-foreground text-xs">
                Finance belum aktif sampai finalisasi
                dikonfirmasi.
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
          </fieldset>
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
            Ini estimasi selama mengisi. Preview server akan
            menunjukkan akun dan nilai journal final.
          </p>
        </CardContent>
      </Card>

      {preview && (
        <Card className="border-primary/30 xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>
              Periksa saldo awal sebelum mulai
            </CardTitle>
            <CardDescription>
              Per tanggal {preview.cut_off_date}. Setelah
              dikonfirmasi, journal dan pergerakan inventory
              tidak dapat diedit; koreksi dilakukan lewat
              transaksi koreksi atau reversal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PreviewMetric
                label="Total debit"
                value={preview.total_debit}
              />
              <PreviewMetric
                label="Total credit"
                value={preview.total_credit}
              />
              <PreviewMetric
                label="Pergerakan inventory"
                value={preview.inventory_movement_count}
                numeric
              />
              <PreviewMetric
                label="Item hutang / piutang"
                value={
                  preview.payable_item_count +
                  preview.receivable_item_count
                }
                numeric
              />
            </div>

            {preview.will_create_journal ? (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[42rem] text-sm">
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
                        Credit
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
              <div className="border-info/30 bg-info/5 text-info-foreground rounded-xl border p-4 text-sm leading-6">
                Pilihan mulai dari nol tidak membuat journal
                atau pergerakan inventory.
              </div>
            )}

            {preview.inventory_movements.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h3 className="font-semibold">
                    Persediaan yang akan dicatat
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Quantity dan nilai yang akan masuk ke
                    lokasi masing-masing.
                  </p>
                </div>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[42rem] text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">
                          Lokasi
                        </th>
                        <th className="px-4 py-3 text-right">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right">
                          Unit cost
                        </th>
                        <th className="px-4 py-3 text-right">
                          Nilai
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {preview.inventory_movements.map(
                        (movement) => (
                          <tr
                            key={`${movement.inventory_item_id}:${movement.location_id}`}
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
                                movement.unit_cost
                              )}
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
            )}

            {preview.subledger_items.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h3 className="font-semibold">
                    Hutang dan piutang per sumber
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Tiap sumber dapat disettle sendiri dari
                    halaman Hutang atau Piutang.
                  </p>
                </div>
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
                              item.balance_type ===
                              'payable'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {item.balance_type === 'payable'
                              ? 'Hutang'
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
            )}

            <label className="border-border flex items-start gap-3 rounded-xl border p-4 text-sm leading-6">
              <input
                type="checkbox"
                className="accent-primary mt-1 size-4"
                checked={confirmed}
                disabled={finalized}
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
              />
              <span>
                Saya sudah memeriksa tanggal dan saldo di
                atas. Aktifkan Finance dengan opening
                balance ini.
              </span>
            </label>
            <Button
              type="button"
              onClick={finalizeOpeningBalance}
              disabled={
                !confirmed || isFinalizing || finalized
              }
            >
              {isFinalizing
                ? 'Mengaktifkan Finance…'
                : 'Konfirmasi dan aktifkan Finance'}
            </Button>
          </CardContent>
        </Card>
      )}
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
  const eligibleItems = getEligibleInventoryItems(setup);
  const item = eligibleItems.find(
    (option) => option.id === line.inventory_item_id
  );

  return (
    <div className="bg-muted/20 grid gap-3 rounded-xl border p-3 md:grid-cols-[1.2fr_1fr_7rem_8rem_auto] md:items-end">
      <SelectField
        label="Item"
        value={line.inventory_item_id}
        options={eligibleItems.map((option) => ({
          value: option.id,
          label: `${option.sku} — ${option.name}`,
        }))}
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

function PreviewMetric({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: number;
  numeric?: boolean;
}) {
  return (
    <div className="bg-muted/30 rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg font-semibold">
        {numeric ? value : formatMoney(value)}
      </p>
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

function parsePreviewResponse(
  payload: unknown
): FinanceOpeningBalancePreviewDTO | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    return null;
  }
  const parsed =
    FinanceOpeningBalancePreviewSchema.safeParse(
      payload.data
    );
  return parsed.success ? parsed.data : null;
}

function parseFinalizeResponse(
  payload: unknown
): FinanceOpeningBalanceFinalizeResponseDTO | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    return null;
  }
  const parsed =
    FinanceOpeningBalanceFinalizeResponseSchema.safeParse(
      payload.data
    );
  return parsed.success ? parsed.data : null;
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
