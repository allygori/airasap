'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowRight01Icon,
  BookOpen01Icon,
  CheckmarkCircle01Icon,
  Edit02Icon,
  EditOffIcon,
  FolderTreeIcon,
  InformationCircleIcon,
  Layers01Icon,
  RefreshIcon,
  Search01Icon,
  SlidersHorizontalIcon,
  Tree01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/ui';
import type { IconSvgObject } from '@/types/icon';

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  parent_account_id: string | null;
  normal_balance: 'debit' | 'credit';
  is_system: boolean;
  is_postable: boolean;
  is_active: boolean;
  description: string | null;
};

type AccountNode = Account & {
  children: AccountNode[];
};

type ApiPayload = {
  success: boolean;
  data?: {
    accounts?: Account[];
    account?: Account;
  };
  error?: { message?: string };
};

const ACCOUNT_TYPES = [
  { value: 'all', label: 'All account types' },
  { value: 'asset', label: 'Assets' },
  { value: 'liability', label: 'Liabilities' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'cost_of_sales', label: 'Cost of sales' },
  { value: 'expense', label: 'Expenses' },
  { value: 'other_income', label: 'Other income' },
  { value: 'other_expense', label: 'Other expenses' },
] as const;

const TYPE_LABELS = Object.fromEntries(
  ACCOUNT_TYPES.map((item) => [item.value, item.label])
);

const EMPTY_ACCOUNTS: Account[] = [];

function buildAccountTree(accounts: Account[]) {
  const nodes = new Map<string, AccountNode>();

  accounts.forEach((account) => {
    nodes.set(account.id, { ...account, children: [] });
  });

  const roots: AccountNode[] = [];
  accounts.forEach((account) => {
    const node = nodes.get(account.id);
    const parent = account.parent_account_id
      ? nodes.get(account.parent_account_id)
      : undefined;

    if (node && parent) {
      parent.children.push(node);
    } else if (node) {
      roots.push(node);
    }
  });

  return roots;
}

function filterAccountTree(
  nodes: AccountNode[],
  query: string,
  typeFilter: string
): AccountNode[] {
  const normalizedQuery = query.trim().toLowerCase();

  return nodes.reduce<AccountNode[]>((result, node) => {
    const searchableText = [
      node.code,
      node.name,
      node.type,
      node.subtype,
      node.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      searchableText.includes(normalizedQuery);
    const matchesType =
      typeFilter === 'all' || node.type === typeFilter;
    const children = filterAccountTree(
      node.children,
      query,
      typeFilter
    );

    if (
      (matchesQuery && matchesType) ||
      children.length > 0
    ) {
      result.push({ ...node, children });
    }

    return result;
  }, []);
}

function flattenNodes(nodes: AccountNode[]): AccountNode[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenNodes(node.children),
  ]);
}

function formatType(value: string) {
  return (
    TYPE_LABELS[value] ??
    value
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: IconSvgObject;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border-border/70 bg-card flex items-start gap-3 rounded-xl border p-4">
      <div className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
        <HugeiconsIcon icon={icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {hint}
        </p>
      </div>
    </div>
  );
}

function TreeLoading() {
  return (
    <div className="flex flex-col gap-1 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg px-3 py-3"
          style={{
            paddingLeft: `${12 + (index % 3) * 28}px`,
          }}
        >
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="ml-auto h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function AccountTree({
  nodes,
  expanded,
  onExpandedChange,
  selectedId,
  onSelect,
  onEdit,
  autoExpand,
}: {
  nodes: AccountNode[];
  expanded: Record<string, boolean>;
  onExpandedChange: (id: string, open: boolean) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (account: Account) => void;
  autoExpand: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 sm:p-4">
      {nodes.map((node) => (
        <AccountTreeNode
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          autoExpand={autoExpand}
        />
      ))}
    </div>
  );
}

function AccountTreeNode({
  node,
  depth,
  expanded,
  onExpandedChange,
  selectedId,
  onSelect,
  onEdit,
  autoExpand,
}: {
  node: AccountNode;
  depth: number;
  expanded: Record<string, boolean>;
  onExpandedChange: (id: string, open: boolean) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (account: Account) => void;
  autoExpand: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen =
    hasChildren &&
    (autoExpand || expanded[node.id] === true);
  const isSelected = selectedId === node.id;

  const row = (
    <div
      className={cn(
        'group/tree-row flex min-w-0 items-center gap-2 rounded-xl border border-transparent py-1.5 pr-2 transition-colors',
        isSelected
          ? 'border-primary/20 bg-primary/10'
          : 'hover:bg-muted/60 hover:border-border/70'
      )}
      style={{ paddingLeft: `${depth * 28 + 8}px` }}
    >
      {hasChildren ? (
        <CollapsibleTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${node.name}`}
              className="text-muted-foreground shrink-0 cursor-pointer"
            />
          }
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={15}
            className={cn(
              'transition-transform duration-200',
              isOpen && 'rotate-90'
            )}
          />
        </CollapsibleTrigger>
      ) : (
        <span
          className="size-6 shrink-0"
          aria-hidden="true"
        />
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={() => onSelect(node.id)}
        className="h-auto min-w-0 flex-1 justify-start gap-3 px-1.5 py-1 text-left hover:bg-transparent"
      >
        <HugeiconsIcon
          icon={
            node.is_postable
              ? BookOpen01Icon
              : FolderTreeIcon
          }
          size={18}
          className={cn(
            'shrink-0',
            node.is_postable
              ? 'text-primary'
              : 'text-secondary-foreground'
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-xs font-semibold tracking-tight">
              {node.code}
            </span>
            <span className="truncate font-medium">
              {node.name}
            </span>
          </span>
          <span className="text-muted-foreground mt-0.5 block truncate text-xs">
            {node.subtype
              ? formatType(node.subtype)
              : formatType(node.type)}
          </span>
        </span>
        <span className="hidden items-center gap-2 sm:flex">
          <Badge
            variant={
              node.is_active ? 'secondary' : 'outline'
            }
          >
            {node.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">
            {node.is_postable ? 'Postable' : 'Group'}
          </Badge>
        </span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={node.is_system}
        onClick={(event) => {
          event.stopPropagation();
          if (!node.is_system) onEdit(node);
        }}
        aria-label={
          node.is_system
            ? `${node.name} is read-only`
            : `Edit ${node.name}`
        }
        title={
          node.is_system
            ? 'System account tidak dapat diubah'
            : 'Edit account'
        }
        className={cn(
          'text-muted-foreground shrink-0',
          node.is_system ? '' : 'cursor-pointer'
        )}
      >
        <HugeiconsIcon
          icon={node.is_system ? EditOffIcon : Edit02Icon}
          data-icon="inline-start"
        />
      </Button>
    </div>
  );

  if (!hasChildren) return row;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(nextOpen) =>
        onExpandedChange(node.id, nextOpen)
      }
      className="group/account-tree"
    >
      {row}
      <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
        <div className="flex flex-col gap-1">
          {node.children.map((child) => (
            <AccountTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onExpandedChange={onExpandedChange}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              autoExpand={autoExpand}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AccountDetails({
  account,
}: {
  account: Account | null;
}) {
  if (!account) {
    return (
      <Card className="bg-foreground text-background overflow-hidden border-0">
        <CardHeader>
          <div className="text-background/60 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={15}
            />
            Account dossier
          </div>
          <CardTitle className="text-background mt-2 text-xl">
            Select an account
          </CardTitle>
          <CardDescription className="text-background/60 leading-6">
            Pilih baris pada tree untuk melihat detail
            account, status posting, dan posisi parent-nya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-background/15 text-background/50 flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
            <HugeiconsIcon icon={Tree01Icon} size={20} />
            Organization account directory
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-foreground text-background overflow-hidden border-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-background/60 font-mono text-xs">
              {account.code}
            </CardDescription>
            <CardTitle className="text-background mt-2 text-xl leading-tight">
              {account.name}
            </CardTitle>
          </div>
          <HugeiconsIcon
            icon={
              account.is_postable
                ? BookOpen01Icon
                : FolderTreeIcon
            }
            size={22}
            className="text-primary-300 shrink-0"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {formatType(account.type)}
          </Badge>
          <Badge
            variant="outline"
            className="text-background border-background/20"
          >
            Normal {account.normal_balance}
          </Badge>
          <Badge
            variant="outline"
            className="text-background border-background/20"
          >
            {account.is_system
              ? 'System · Read-only'
              : 'Organization account'}
          </Badge>
        </div>
        <div className="border-background/15 grid grid-cols-2 gap-3 border-t pt-4">
          <DetailCell
            label="Posting"
            value={
              account.is_postable ? 'Allowed' : 'Group only'
            }
          />
          <DetailCell
            label="Status"
            value={
              account.is_active ? 'Active' : 'Inactive'
            }
          />
          <DetailCell
            label="System"
            value={account.is_system ? 'System' : 'Custom'}
          />
          <DetailCell
            label="Subtype"
            value={
              account.subtype
                ? formatType(account.subtype)
                : '—'
            }
          />
        </div>
        {account.description ? (
          <p className="text-background/65 text-sm leading-6">
            {account.description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-background/50 text-[10px] font-semibold tracking-[0.16em] uppercase">
        {label}
      </p>
      <p className="text-background mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

function ReadOnlyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs font-medium">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

function AccountEditDialog({
  account,
  open,
  onOpenChange,
  onSaved,
}: {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (account: Account) => void;
}) {
  const [name, setName] = useState(account.name);
  const [description, setDescription] = useState(
    account.description ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextName = name.trim();
    if (!nextName) {
      setError('Nama account wajib diisi.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/dashboard/accounting/accounts/${account.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nextName,
            description: description.trim() || null,
          }),
        }
      );
      const payload = (await response.json()) as ApiPayload;

      if (
        !response.ok ||
        !payload.success ||
        !payload.data?.account
      ) {
        throw new Error(
          payload.error?.message ||
            'Gagal menyimpan perubahan account.'
        );
      }

      onOpenChange(false);
      onSaved(payload.data.account);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Gagal menyimpan perubahan account.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit chart of accounts</DialogTitle>
          <DialogDescription>
            Ubah informasi tampilan account organisasi.
            Struktur, tipe, dan aturan posting tetap dikunci
            agar histori accounting tidak berubah.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <ReadOnlyValue
            label="Code"
            value={account.code}
          />
          <ReadOnlyValue
            label="Account type"
            value={formatType(account.type)}
          />
          <ReadOnlyValue
            label="Normal balance"
            value={account.normal_balance}
          />
          <ReadOnlyValue
            label="Posting"
            value={
              account.is_postable
                ? 'Postable'
                : 'Group only'
            }
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-edit-name">
                Account name
              </FieldLabel>
              <Input
                id="account-edit-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                maxLength={120}
                autoFocus
                disabled={isSaving}
              />
              <FieldDescription>
                Nama dapat disesuaikan tanpa mengubah code
                account.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="account-edit-description">
                Description
              </FieldLabel>
              <Textarea
                id="account-edit-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Tambahkan konteks penggunaan account…"
                maxLength={500}
                rows={4}
                disabled={isSaving}
              />
              <FieldDescription>
                Opsional, maksimal 500 karakter.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {error ? (
            <Alert variant="destructive">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={18}
              />
              <AlertTitle>
                Perubahan belum disimpan
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                />
              }
            >
              Batal
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  data-icon="inline-start"
                />
              )}
              {isSaving ? 'Menyimpan…' : 'Simpan perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountingAccountsPage() {
  const [accounts, setAccounts] =
    useState<Account[]>(EMPTY_ACCOUNTS);
  const [expanded, setExpanded] = useState<
    Record<string, boolean>
  >({});
  const [selectedId, setSelectedId] = useState<
    string | null
  >(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingAccount, setEditingAccount] =
    useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/accounting/accounts?limit=100',
        { cache: 'no-store' }
      );
      const payload = (await response.json()) as ApiPayload;

      if (
        !response.ok ||
        !payload.success ||
        !payload.data
      ) {
        throw new Error(
          payload.error?.message ||
            'Gagal memuat Chart of Accounts.'
        );
      }

      const nextAccounts = payload.data.accounts ?? [];
      setAccounts(nextAccounts);
      setExpanded(
        Object.fromEntries(
          buildAccountTree(nextAccounts)
            .flatMap((node) => flattenNodes([node]))
            .filter((node) => node.children.length > 0)
            .map((node) => [node.id, true])
        )
      );
      setSelectedId((current) =>
        current &&
        nextAccounts.some((item) => item.id === current)
          ? current
          : (nextAccounts[0]?.id ?? null)
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Gagal memuat Chart of Accounts.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // The page synchronizes its tree with the tenant-scoped API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAccounts();
  }, [loadAccounts]);

  const accountTree = useMemo(
    () => buildAccountTree(accounts),
    [accounts]
  );
  const filteredTree = useMemo(
    () => filterAccountTree(accountTree, query, typeFilter),
    [accountTree, query, typeFilter]
  );
  const visibleAccounts = useMemo(
    () => flattenNodes(filteredTree),
    [filteredTree]
  );
  const selectedAccount =
    accounts.find((account) => account.id === selectedId) ??
    null;
  const groupCount = accounts.filter(
    (account) => !account.is_postable
  ).length;
  const activeCount = accounts.filter(
    (account) => account.is_active
  ).length;
  const autoExpand =
    Boolean(query.trim()) || typeFilter !== 'all';

  const setNodeExpanded = (id: string, open: boolean) => {
    setExpanded((current) => ({ ...current, [id]: open }));
  };

  const expandAll = () => {
    setExpanded(
      Object.fromEntries(
        flattenNodes(accountTree)
          .filter((node) => node.children.length > 0)
          .map((node) => [node.id, true])
      )
    );
  };

  const collapseAll = () => setExpanded({});

  const handleAccountSaved = (updatedAccount: Account) => {
    setAccounts((current) =>
      current.map((account) =>
        account.id === updatedAccount.id
          ? updatedAccount
          : account
      )
    );
    setEditingAccount(null);
  };

  return (
    <main className="bg-muted/20 min-h-full overflow-x-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-7 shadow-2xl sm:px-8 sm:py-9">
          <div className="bg-primary/25 absolute -top-28 right-8 size-80 rounded-full blur-3xl" />
          <div className="bg-secondary/20 absolute -bottom-40 left-1/3 size-96 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-background/60 flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase">
                <HugeiconsIcon
                  icon={Tree01Icon}
                  size={15}
                />
                Accounting index / structure
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
                Chart of Accounts
              </h1>
              <p className="text-background/70 mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                Satu peta untuk seluruh akun organization.
                Telusuri hirarki parent dan posting account
                tanpa kehilangan konteks kode, tipe, dan
                statusnya.
              </p>
            </div>
            <div className="border-background/15 bg-background/10 min-w-64 rounded-2xl border p-4 backdrop-blur-sm">
              <p className="text-background/55 text-xs font-semibold tracking-[0.18em] uppercase">
                Directory status
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold tracking-tight">
                    {accounts.length}
                  </p>
                  <p className="text-background/55 mt-1 text-sm">
                    account terdaftar
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-1.5"
                >
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={14}
                  />
                  Details editable
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric
            icon={Layers01Icon}
            label="Accounts"
            value={String(accounts.length)}
            hint="Total account organization"
          />
          <Metric
            icon={BookOpen01Icon}
            label="Postable"
            value={String(accounts.length - groupCount)}
            hint="Bisa menerima journal line"
          />
          <Metric
            icon={FolderTreeIcon}
            label="Groups"
            value={String(groupCount)}
            hint={`${activeCount} account masih aktif`}
          />
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Account hierarchy</CardTitle>
                    <Badge variant="outline">
                      {visibleAccounts.length} visible
                    </Badge>
                  </div>
                  <CardDescription className="mt-1.5 max-w-2xl leading-6">
                    Group account dan posting account
                    ditampilkan dalam satu tree. Klik nama
                    account untuk membuka dossier-nya.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={expandAll}
                    disabled={
                      isLoading || accounts.length === 0
                    }
                  >
                    Expand all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={collapseAll}
                    disabled={
                      isLoading || accounts.length === 0
                    }
                  >
                    Collapse all
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={17}
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
                  />
                  <Input
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    placeholder="Search code, account name, or subtype"
                    aria-label="Search chart of accounts"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(value) =>
                    setTypeFilter(value ?? 'all')
                  }
                >
                  <SelectTrigger
                    className="w-full sm:w-52"
                    aria-label="Filter account type"
                  >
                    <HugeiconsIcon
                      icon={SlidersHorizontalIcon}
                      size={16}
                      className="text-muted-foreground"
                    />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void loadAccounts()}
                  disabled={isLoading}
                  aria-label="Refresh accounts"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <HugeiconsIcon
                      icon={RefreshIcon}
                      size={17}
                    />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? <TreeLoading /> : null}

              {error ? (
                <div className="p-4">
                  <Alert variant="destructive">
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      size={18}
                    />
                    <AlertTitle>
                      Account belum dapat dimuat
                    </AlertTitle>
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : null}

              {!isLoading &&
              !error &&
              filteredTree.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="bg-muted text-foreground grid size-12 place-items-center rounded-2xl">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={22}
                    />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      Tidak ada account yang cocok
                    </p>
                    <p className="mt-1 text-sm">
                      Coba ubah kata kunci atau filter
                      account type.
                    </p>
                  </div>
                </div>
              ) : null}

              {!isLoading &&
              !error &&
              filteredTree.length > 0 ? (
                <AccountTree
                  nodes={filteredTree}
                  expanded={expanded}
                  onExpandedChange={setNodeExpanded}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onEdit={setEditingAccount}
                  autoExpand={autoExpand}
                />
              ) : null}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <AccountDetails account={selectedAccount} />
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={18}
                    className="text-primary"
                  />
                  <CardTitle className="text-base">
                    Reading the tree
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm leading-6">
                <p>
                  Folder adalah account group. Account
                  berikon buku adalah account yang dapat
                  menerima posting.
                </p>
                <div className="border-border/70 flex items-start gap-2 border-t pt-3">
                  <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
                  <span>
                    Parent-child hierarchy mengikuti parent
                    account di database.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {editingAccount ? (
          <AccountEditDialog
            account={editingAccount}
            open
            onOpenChange={(open) => {
              if (!open) setEditingAccount(null);
            }}
            onSaved={handleAccountSaved}
          />
        ) : null}
      </div>
    </main>
  );
}
