'use client';

import { useState, type FormEvent } from 'react';
import {
  Building2,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { z } from 'zod';
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FinanceSupplierCreateInputSchema,
  FinanceSupplierListResponseSchema,
  FinanceSupplierMutationResponseSchema,
  type FinanceSupplierDTO,
  type FinanceSupplierListResponseDTO,
} from '@/modules/finance/client';

const SuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.union([
    FinanceSupplierListResponseSchema,
    FinanceSupplierMutationResponseSchema,
  ]),
});
const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({ message: z.string() }),
});

type SupplierFormValues = {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const emptyForm: SupplierFormValues = {
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export function FinanceSuppliersClient({
  initialData,
}: {
  initialData: FinanceSupplierListResponseDTO;
}) {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] =
    useState<FinanceSupplierDTO | null>(null);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const loadSuppliers = async (
    page: number,
    term: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
        search: term,
      });
      const response = await fetch(
        `/api/v1/dashboard/finance/suppliers?${query}`
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(getErrorMessage(payload));
        return;
      }
      const parsed =
        SuccessEnvelopeSchema.safeParse(payload);
      if (
        !parsed.success ||
        !('suppliers' in parsed.data.data)
      ) {
        setErrorMessage(
          'Respons server Finance tidak valid.'
        );
        return;
      }
      setData(parsed.data.data);
      setActiveSearch(term);
    } catch {
      setErrorMessage(
        'Tidak dapat memuat direktori supplier.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const startEditing = (supplier: FinanceSupplierDTO) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contact_name: supplier.contact_name ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const updateField = (
    field: keyof SupplierFormValues,
    value: string
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitForm = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload =
        FinanceSupplierCreateInputSchema.parse(form);
      const response = await fetch(
        editing
          ? `/api/v1/dashboard/finance/suppliers/${editing.supplier_id}`
          : '/api/v1/dashboard/finance/suppliers',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const responsePayload: unknown =
        await response.json();
      if (!response.ok) {
        setErrorMessage(getErrorMessage(responsePayload));
        return;
      }
      const parsed =
        SuccessEnvelopeSchema.safeParse(responsePayload);
      if (
        !parsed.success ||
        !('supplier' in parsed.data.data)
      ) {
        setErrorMessage(
          'Respons server Finance tidak valid.'
        );
        return;
      }
      setSuccessMessage(
        editing
          ? 'Supplier berhasil diperbarui.'
          : 'Supplier berhasil ditambahkan.'
      );
      resetForm();
      await loadSuppliers(1, activeSearch);
    } catch (error) {
      setErrorMessage(
        error instanceof z.ZodError
          ? (error.issues[0]?.message ??
              'Periksa kembali data supplier.')
          : 'Supplier gagal disimpan.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (
    supplier: FinanceSupplierDTO
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(
        `/api/v1/dashboard/finance/suppliers/${supplier.supplier_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_active: !supplier.is_active,
          }),
        }
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        setErrorMessage(getErrorMessage(payload));
        return;
      }
      const parsed =
        SuccessEnvelopeSchema.safeParse(payload);
      if (
        !parsed.success ||
        !('supplier' in parsed.data.data)
      ) {
        setErrorMessage(
          'Respons server Finance tidak valid.'
        );
        return;
      }
      setSuccessMessage(
        supplier.is_active
          ? 'Supplier dinonaktifkan.'
          : 'Supplier diaktifkan kembali.'
      );
      await loadSuppliers(
        data.pagination.page,
        activeSearch
      );
    } catch {
      setErrorMessage('Status supplier gagal diperbarui.');
    }
  };

  const submitSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    void loadSuppliers(1, search.trim());
  };

  const {
    page,
    total_pages: totalPages,
    total,
  } = data.pagination;

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-3 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Data Usaha
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Direktori supplier
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Kelola kontak pemasok dan pilih supplier aktif
            saat mencatat purchase.
          </p>
        </div>
        <div className="bg-card flex items-baseline gap-2 rounded-lg border px-4 py-2">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {total}
          </span>
          <span className="text-muted-foreground text-xs">
            supplier terdaftar
          </span>
        </div>
      </header>

      {errorMessage ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
        >
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div
          role="status"
          className="border-success/30 bg-success/10 text-success rounded-lg border px-4 py-3 text-sm"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.42fr)]">
        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle>Daftar supplier</CardTitle>
            <CardDescription>
              Supplier nonaktif tetap tersimpan dan tidak
              tersedia untuk purchase baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <form
              onSubmit={submitSearch}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <FieldGroup className="flex-1">
                <Field>
                  <FieldLabel
                    htmlFor="supplier-search"
                    className="sr-only"
                  >
                    Cari supplier
                  </FieldLabel>
                  <Input
                    id="supplier-search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Cari nama, kontak, telepon, atau email"
                    maxLength={100}
                  />
                </Field>
              </FieldGroup>
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading}
              >
                <Search data-icon="inline-start" />
                Cari
              </Button>
            </form>

            {data.suppliers.length === 0 ? (
              <Empty className="min-h-64 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Building2 />
                  </EmptyMedia>
                  <EmptyTitle>
                    {activeSearch
                      ? 'Supplier tidak ditemukan'
                      : 'Belum ada supplier'}
                  </EmptyTitle>
                  <EmptyDescription>
                    {activeSearch
                      ? 'Ubah kata kunci pencarian atau tambahkan supplier baru.'
                      : 'Tambahkan supplier pertama untuk menghubungkannya dengan purchase.'}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.suppliers.map((supplier) => (
                    <TableRow key={supplier.supplier_id}>
                      <TableCell className="min-w-48 whitespace-normal">
                        <p className="font-medium">
                          {supplier.name}
                        </p>
                        {supplier.address ? (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                            {supplier.address}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <p>
                          {supplier.contact_name ?? '—'}
                        </p>
                        {supplier.phone ? (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {supplier.phone}
                          </p>
                        ) : null}
                        {supplier.email ? (
                          <p className="text-muted-foreground text-xs">
                            {supplier.email}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            supplier.is_active
                              ? 'success'
                              : 'outline'
                          }
                        >
                          {supplier.is_active
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              startEditing(supplier)
                            }
                            aria-label={`Ubah ${supplier.name}`}
                          >
                            <Pencil data-icon="inline-start" />
                            Ubah
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void toggleActive(supplier)
                            }
                            aria-label={`${supplier.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${supplier.name}`}
                          >
                            {supplier.is_active
                              ? 'Nonaktifkan'
                              : 'Aktifkan'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-muted-foreground text-xs">
                Halaman {page} dari{' '}
                {Math.max(totalPages, 1)}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading || page <= 1}
                  onClick={() =>
                    void loadSuppliers(
                      page - 1,
                      activeSearch
                    )
                  }
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading || page >= totalPages}
                  onClick={() =>
                    void loadSuppliers(
                      page + 1,
                      activeSearch
                    )
                  }
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {editing
                    ? 'Ubah supplier'
                    : 'Supplier baru'}
                </CardTitle>
                <CardDescription className="mt-1">
                  Data ini berlaku untuk seluruh
                  Organization.
                </CardDescription>
              </div>
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetForm}
                  aria-label="Batalkan perubahan"
                >
                  <X />
                </Button>
              ) : (
                <Badge variant="outline">
                  <Plus data-icon="inline-start" /> Baru
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form
              onSubmit={submitForm}
              className="grid gap-5"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="supplier-name">
                    Nama supplier
                  </FieldLabel>
                  <Input
                    id="supplier-name"
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        'name',
                        event.target.value
                      )
                    }
                    required
                    minLength={1}
                    maxLength={160}
                    placeholder="Contoh: PT Distributor Nusantara"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="supplier-contact">
                    Nama kontak
                  </FieldLabel>
                  <Input
                    id="supplier-contact"
                    value={form.contact_name}
                    onChange={(event) =>
                      updateField(
                        'contact_name',
                        event.target.value
                      )
                    }
                    maxLength={120}
                    placeholder="Nama PIC supplier"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="supplier-phone">
                    Telepon
                  </FieldLabel>
                  <Input
                    id="supplier-phone"
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        'phone',
                        event.target.value
                      )
                    }
                    maxLength={40}
                    placeholder="Nomor telepon"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="supplier-email">
                    Email
                  </FieldLabel>
                  <Input
                    id="supplier-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        'email',
                        event.target.value
                      )
                    }
                    maxLength={160}
                    placeholder="kontak@contoh.id"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="supplier-address">
                    Alamat
                  </FieldLabel>
                  <Textarea
                    id="supplier-address"
                    value={form.address}
                    onChange={(event) =>
                      updateField(
                        'address',
                        event.target.value
                      )
                    }
                    maxLength={300}
                    rows={2}
                    placeholder="Alamat supplier"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="supplier-notes">
                    Catatan
                  </FieldLabel>
                  <Textarea
                    id="supplier-notes"
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        'notes',
                        event.target.value
                      )
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Catatan internal (opsional)"
                  />
                </Field>
              </FieldGroup>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Menyimpan…'
                    : editing
                      ? 'Simpan perubahan'
                      : 'Tambah supplier'}
                </Button>
                {editing ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function getErrorMessage(payload: unknown) {
  const parsed = ErrorEnvelopeSchema.safeParse(payload);
  return parsed.success
    ? parsed.data.error.message
    : 'Permintaan supplier gagal diproses.';
}
