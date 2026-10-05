'use client';

import { useMemo, useState } from 'react';
import { revalidateLogic } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { formatMediumDate as formatDate } from '@/lib/date';
import { formatIDR as formatMoney } from '@/lib/number/money';
import { useAppForm } from '@/components/form/form.hook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FinanceBankAccountCreateInputSchema,
  FinanceCashBankAccountActiveInputSchema,
  FinanceCashBankAccountManagementInputSchema,
  FinanceCashBankManagedAccountResponseSchema,
  FinanceEWalletAccountCreateInputSchema,
  FINANCE_CASH_BANK_SUBTYPE_LABELS,
  type FinanceCashBankAccountDTO,
  type FinanceCashBankAccountManagementInputDTO,
  type FinanceCashBankQueryDTO,
  type FinanceCashBankManagedAccountDTO,
} from '@/modules/finance/client';
import { CashAndBankFilterForm } from './cash-and-bank-filter.form';

type Props = {
  accounts: FinanceCashBankAccountDTO[];
  initialManagedAccounts: FinanceCashBankManagedAccountDTO[];
  query: FinanceCashBankQueryDTO;
};

type AccountSubtype = 'bank' | 'e_wallet';

function getSuccessData(payload: unknown): unknown {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    return undefined;
  }

  return payload.data;
}

function getErrorMessage(payload: unknown): string | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('error' in payload)
  ) {
    return null;
  }

  const error = payload.error;
  if (
    !error ||
    typeof error !== 'object' ||
    !('message' in error) ||
    typeof error.message !== 'string'
  ) {
    return null;
  }

  return error.message;
}

export function FinanceCashBankAccountManager({
  accounts: cashBankAccounts,
  initialManagedAccounts,
  query,
}: Props) {
  const router = useRouter();
  const [createdAccounts, setCreatedAccounts] = useState<
    FinanceCashBankManagedAccountDTO[]
  >([]);
  const [accountOverrides, setAccountOverrides] = useState<
    Record<string, FinanceCashBankManagedAccountDTO>
  >({});
  const [formSubtype, setFormSubtype] =
    useState<AccountSubtype>('bank');
  const [editingAccount, setEditingAccount] =
    useState<FinanceCashBankManagedAccountDTO | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busyAccountId, setBusyAccountId] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const accounts = useMemo(() => {
    const initialAccountIds = new Set(
      initialManagedAccounts.map((account) => account.id)
    );
    const combinedAccounts = [
      ...initialManagedAccounts,
      ...createdAccounts.filter(
        (account) => !initialAccountIds.has(account.id)
      ),
    ];

    return combinedAccounts.map(
      (account) => accountOverrides[account.id] ?? account
    );
  }, [
    accountOverrides,
    createdAccounts,
    initialManagedAccounts,
  ]);

  const managedAccountById = useMemo(
    () =>
      new Map(
        accounts.map((account) => [account.id, account])
      ),
    [accounts]
  );

  const saveAccount = async (
    input: FinanceCashBankAccountManagementInputDTO
  ) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const validatedInput =
        FinanceCashBankAccountManagementInputSchema.parse(
          input
        );
      const response = await fetch(
        editingAccount
          ? `/api/v1/dashboard/finance/cash-and-bank/accounts/${editingAccount.id}`
          : '/api/v1/dashboard/finance/cash-and-bank/accounts',
        {
          method: editingAccount ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedInput),
        }
      );
      const payload: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Rekening gagal disimpan. Silakan coba lagi.'
        );
        return;
      }

      const parsed =
        FinanceCashBankManagedAccountResponseSchema.safeParse(
          getSuccessData(payload)
        );
      if (!parsed.success) {
        setErrorMessage(
          'Respons server untuk rekening tidak valid.'
        );
        return;
      }

      const savedAccount = parsed.data.account;
      if (editingAccount) {
        setAccountOverrides((current) => ({
          ...current,
          [savedAccount.id]: savedAccount,
        }));
      } else {
        setCreatedAccounts((current) => [
          ...current.filter(
            (account) => account.id !== savedAccount.id
          ),
          savedAccount,
        ]);
      }
      setIsDialogOpen(false);
      setEditingAccount(null);
      setSuccessMessage(
        editingAccount
          ? `${savedAccount.name} berhasil diperbarui.`
          : `${savedAccount.name} berhasil ditambahkan.`
      );
      router.refresh();
    } catch {
      setErrorMessage(
        'Periksa kembali isian rekening lalu coba lagi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const bankForm = useAppForm({
    defaultValues: {
      institution: '',
      account_last4: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceBankAccountCreateInputSchema,
    },
    onSubmit: ({ value }) =>
      saveAccount({ ...value, subtype: 'bank' }),
  });

  const eWalletForm = useAppForm({
    defaultValues: {
      provider: '',
      account_last4: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceEWalletAccountCreateInputSchema,
    },
    onSubmit: ({ value }) =>
      saveAccount({ ...value, subtype: 'e_wallet' }),
  });

  const startAdding = (subtype: AccountSubtype) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingAccount(null);
    setFormSubtype(subtype);
    if (subtype === 'bank') {
      bankForm.reset();
    } else {
      eWalletForm.reset();
    }
    setIsDialogOpen(true);
  };

  const startEditing = (
    account: FinanceCashBankManagedAccountDTO
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingAccount(account);
    setFormSubtype(account.subtype);
    if (account.subtype === 'bank') {
      bankForm.reset();
      bankForm.setFieldValue(
        'institution',
        account.account_metadata.institution ?? ''
      );
      bankForm.setFieldValue(
        'account_last4',
        account.account_metadata.account_last4 ?? ''
      );
    } else {
      eWalletForm.reset();
      eWalletForm.setFieldValue(
        'provider',
        account.account_metadata.provider ?? ''
      );
      eWalletForm.setFieldValue(
        'account_last4',
        account.account_metadata.account_last4 ?? ''
      );
    }
    setIsDialogOpen(true);
  };

  const toggleAccountActive = async (
    account: FinanceCashBankManagedAccountDTO
  ) => {
    setBusyAccountId(account.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const input =
        FinanceCashBankAccountActiveInputSchema.parse({
          is_active: !account.is_active,
        });
      const response = await fetch(
        `/api/v1/dashboard/finance/cash-and-bank/accounts/${account.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const payload: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          getErrorMessage(payload) ??
            'Status rekening gagal diperbarui.'
        );
        return;
      }

      const parsed =
        FinanceCashBankManagedAccountResponseSchema.safeParse(
          getSuccessData(payload)
        );
      if (!parsed.success) {
        setErrorMessage(
          'Respons server untuk rekening tidak valid.'
        );
        return;
      }

      const updatedAccount = parsed.data.account;
      setAccountOverrides((current) => ({
        ...current,
        [updatedAccount.id]: updatedAccount,
      }));
      setSuccessMessage(
        `${updatedAccount.name} ${updatedAccount.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      router.refresh();
    } catch {
      setErrorMessage('Status rekening gagal diperbarui.');
    } finally {
      setBusyAccountId(null);
    }
  };

  const dialogTitle = editingAccount
    ? 'Ubah rekening'
    : formSubtype === 'bank'
      ? 'Tambah rekening bank'
      : 'Tambah e-wallet';

  return (
    <>
      <Card className="w-full">
        <CardHeader className="grid w-full gap-4 border-b">
          <div className="min-w-52">
            <CardTitle>Rekening dan saldo</CardTitle>
            <CardDescription>
              Saldo dihitung dari journal posted. Rekening
              nonaktif dan riwayatnya tetap ditampilkan.
            </CardDescription>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <CashAndBankFilterForm
              key={`${query.search ?? ''}-${query.status}`}
              initialValues={{
                search: query.search ?? '',
                status: query.status,
              }}
            />
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Button
                type="button"
                variant="constructive"
                onClick={() => startAdding('bank')}
              >
                Tambah rekening bank
              </Button>
              <Button
                type="button"
                variant="constructive"
                onClick={() => startAdding('e_wallet')}
              >
                Tambah e-wallet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errorMessage ? (
            <p
              className="text-destructive text-sm"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p
              className="text-success text-sm"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}
          {cashBankAccounts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Tidak ada akun Cash & Bank yang cocok dengan
              pencarian dan status ini.
            </p>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Akun</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Opening balance</TableHead>
                    <TableHead>
                      Aktivitas terakhir
                    </TableHead>
                    <TableHead className="text-right">
                      Saldo saat ini
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashBankAccounts.map((account) => (
                    <CashBankAccountRow
                      key={account.id}
                      account={account}
                      managedAccount={
                        managedAccountById.get(
                          account.id
                        ) ?? null
                      }
                      busy={busyAccountId !== null}
                      isUpdating={
                        busyAccountId === account.id
                      }
                      onEdit={startEditing}
                      onToggleActive={toggleAccountActive}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {formSubtype === 'bank'
                ? 'Isi nama bank dan empat digit terakhir rekening. Nomor lengkap tidak diperlukan.'
                : 'Isi penyedia e-wallet dan empat digit terakhir nomor handphone. Jangan masukkan PIN atau OTP.'}
            </DialogDescription>
          </DialogHeader>

          {formSubtype === 'bank' ? (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void bankForm.handleSubmit();
              }}
            >
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <bankForm.AppField name="institution">
                  {(field) => (
                    <field.TextField
                      label="Nama bank"
                      placeholder="Contoh: BCA"
                      maxLength={120}
                      required
                    />
                  )}
                </bankForm.AppField>
                <bankForm.AppField name="account_last4">
                  {(field) => (
                    <field.TextField
                      label="4 digit terakhir nomor rekening"
                      placeholder="1234"
                      inputMode="numeric"
                      maxLength={4}
                      minLength={4}
                      required
                    />
                  )}
                </bankForm.AppField>
              </FieldGroup>
              <p className="text-muted-foreground text-xs">
                Nama akun dibuat otomatis dari nama bank dan
                empat digit terakhir.
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Menyimpan…'
                    : editingAccount
                      ? 'Simpan perubahan'
                      : 'Tambahkan rekening'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void eWalletForm.handleSubmit();
              }}
            >
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <eWalletForm.AppField name="provider">
                  {(field) => (
                    <field.TextField
                      label="Penyedia e-wallet"
                      placeholder="Contoh: ShopeePay, GoPay, DANA"
                      maxLength={120}
                      required
                    />
                  )}
                </eWalletForm.AppField>
                <eWalletForm.AppField name="account_last4">
                  {(field) => (
                    <field.TextField
                      label="4 digit terakhir nomor handphone"
                      placeholder="1234"
                      inputMode="numeric"
                      maxLength={4}
                      minLength={4}
                      required
                    />
                  )}
                </eWalletForm.AppField>
              </FieldGroup>
              <p className="text-muted-foreground text-xs">
                Nama akun dibuat otomatis dari penyedia dan
                empat digit terakhir handphone.
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Menyimpan…'
                    : editingAccount
                      ? 'Simpan perubahan'
                      : 'Tambahkan e-wallet'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CashBankAccountRow({
  account,
  managedAccount,
  busy,
  isUpdating,
  onEdit,
  onToggleActive,
}: {
  account: FinanceCashBankAccountDTO;
  managedAccount: FinanceCashBankManagedAccountDTO | null;
  busy: boolean;
  isUpdating: boolean;
  onEdit: (
    account: FinanceCashBankManagedAccountDTO
  ) => void;
  onToggleActive: (
    account: FinanceCashBankManagedAccountDTO
  ) => void;
}) {
  const accountName = managedAccount?.name ?? account.name;
  const institutionOrProvider =
    managedAccount?.account_metadata.institution ??
    managedAccount?.account_metadata.provider ??
    account.account_metadata.institution ??
    account.account_metadata.provider;
  const accountLast4 =
    managedAccount?.account_metadata.account_last4 ??
    account.account_metadata.account_last4;
  const isActive =
    managedAccount?.is_active ?? account.is_active;
  const metadata = [
    institutionOrProvider,
    accountLast4 ? `•••• ${accountLast4}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{accountName}</div>
        <div className="text-muted-foreground mt-1 font-mono text-xs">
          {account.code}
          {metadata ? ` · ${metadata}` : ''}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {
            FINANCE_CASH_BANK_SUBTYPE_LABELS[
              account.subtype
            ]
          }
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {formatMoney(account.opening_balance)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {account.last_transaction_date
          ? formatDate(account.last_transaction_date)
          : 'Belum ada journal'}
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-semibold">
        <span
          className={
            account.current_balance < 0
              ? 'text-destructive'
              : undefined
          }
        >
          {formatMoney(account.current_balance)}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={isActive ? 'success' : 'secondary'}>
          {isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      </TableCell>
      <TableCell>
        {managedAccount ? (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onEdit(managedAccount)}
            >
              Ubah
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onToggleActive(managedAccount)}
            >
              {isUpdating
                ? 'Menyimpan…'
                : isActive
                  ? 'Nonaktifkan'
                  : 'Aktifkan'}
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground block text-right text-sm">
            —
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
