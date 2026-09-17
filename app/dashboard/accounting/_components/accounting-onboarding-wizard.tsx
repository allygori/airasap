'use client';

import { useState } from 'react';
import {
  Add01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  BankIcon,
  Building03Icon,
  Calendar03Icon,
  Chart03Icon,
  CheckmarkCircle02Icon,
  FileEditIcon,
  InformationCircleIcon,
  Money01Icon,
  Package02Icon,
  SecurityCheckIcon,
  ShoppingCart01Icon,
  SparklesIcon,
  Wallet02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { useAppForm } from '@/components/form/form.hook';
import {
  Stepper,
  type StepperStep,
} from '@/components/ui/stepper';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils/ui';

const steps: StepperStep[] = [
  {
    title: 'Mulai',
    description: 'Tanggal pembukuan',
    icon: Calendar03Icon,
  },
  {
    title: 'Kesiapan data',
    description: 'Produk dan stok',
    icon: Package02Icon,
  },
  {
    title: 'Struktur akun',
    description: 'CoA dan rekening',
    icon: Chart03Icon,
  },
  {
    title: 'Saldo awal',
    description: 'Angka aktual bisnis',
    icon: Wallet02Icon,
  },
  {
    title: 'Review',
    description: 'Konfirmasi dan aktifkan',
    icon: SecurityCheckIcon,
  },
];

const defaultValues = {
  start_date: '2026-09-01',
  inventory_mode: 'detailed',
  bank_bca_name: 'Bank BCA •••• 9910 — a/n Toko ABC',
  bank_bca_balance: '18500000',
  bank_bni_name: 'Bank BNI •••• 2391 — a/n Toko ABC',
  bank_bni_balance: '6500000',
  shopee_receivable: '7200000',
  tokopedia_receivable: '0',
  inventory_value: '42000000',
  supplier_debt: '12000000',
  other_debt: '5000000',
  notes: '',
  new_account_name: '',
  new_account_last4: '',
  new_account_owner: '',
  confirmation: false,
};

const inventoryCandidates = [
  {
    id: 'candidate-tshirt',
    name: 'Kaos Basic Oversize',
    reference: 'SKU-KAOS-001 · 3 varian',
    suggestedCost: 'Rp85.000 / unit',
  },
  {
    id: 'candidate-tumbler',
    name: 'Tumbler Stainless',
    reference: 'SKU-TMB-240 · tanpa varian',
    suggestedCost: 'Rp48.000 / unit',
  },
  {
    id: 'candidate-giftbox',
    name: 'Gift Box Premium',
    reference: 'SKU-GIFT-010 · 2 varian',
    suggestedCost: 'Belum tersedia',
  },
] as const;

type PreviewBankAccount = {
  code: string;
  name: string;
  balance: string;
};

const initialPreviewBankAccounts: PreviewBankAccount[] = [
  {
    code: '1120',
    name: 'Bank BCA •••• 9910',
    balance: 'Rp18.500.000',
  },
  {
    code: '1121',
    name: 'Bank BNI •••• 2391',
    balance: 'Rp6.500.000',
  },
];

const formatIDR = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

function IconTile({
  icon,
  tone = 'primary',
}: {
  icon: typeof Calendar03Icon;
  tone?: 'primary' | 'muted';
}) {
  return (
    <span
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-xl',
        tone === 'primary'
          ? 'bg-primary/12 text-primary'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <HugeiconsIcon icon={icon} size={20} />
    </span>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Calendar03Icon;
}) {
  return (
    <Card size="sm" className="bg-background/70">
      <CardContent className="flex items-start gap-3 p-4">
        <IconTile icon={icon} tone="muted" />
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {note}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-2xl text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

export default function AccountingOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPreviewComplete, setIsPreviewComplete] =
    useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] =
    useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] =
    useState(false);
  const [
    selectedInventoryCandidates,
    setSelectedInventoryCandidates,
  ] = useState<string[]>([
    inventoryCandidates[0].id,
    inventoryCandidates[1].id,
  ]);
  const [previewBankAccounts, setPreviewBankAccounts] =
    useState(initialPreviewBankAccounts);

  const form = useAppForm({
    defaultValues,
    onSubmit: async () => {
      // UI prototype only. Backend finalization will be connected later.
      setIsPreviewComplete(true);
    },
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const goNext = () => {
    setCurrentStep((value) =>
      Math.min(value + 1, steps.length - 1)
    );
  };

  const goPrevious = () => {
    setCurrentStep((value) => Math.max(value - 1, 0));
  };

  const toggleInventoryCandidate = (
    candidateId: string
  ) => {
    setSelectedInventoryCandidates((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId]
    );
  };

  const addPreviewBankAccount = () => {
    const values = form.state.values;
    const bankName = String(
      values.new_account_name || ''
    ).trim();
    const last4 = String(
      values.new_account_last4 || ''
    ).trim();
    const owner = String(
      values.new_account_owner || ''
    ).trim();
    const nextCode = `11${20 + previewBankAccounts.length}`;
    const label = [
      bankName || 'Bank baru',
      last4 ? `•••• ${last4}` : '•••• 0000',
      owner ? `— a/n ${owner}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    setPreviewBankAccounts((current) => [
      ...current,
      {
        code: nextCode,
        name: label,
        balance: 'Belum diisi',
      },
    ]);
    setIsAccountDialogOpen(false);
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 01 · Titik mulai"
            title="Mulai dari tanggal yang jelas."
            description="Tentukan kapan pembukuan baru mulai berjalan. Data lama tetap ada, tetapi setup standar tidak akan merekonstruksi transaksi sebelum tanggal ini."
          />

          <Alert className="border-primary/20 bg-primary/5">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>
              Rekomendasi untuk pembukuan bulanan
            </AlertTitle>
            <AlertDescription>
              Gunakan hari pertama bulan agar saldo awal,
              periode accounting, dan laporan bulanan lebih
              mudah direkonsiliasi.
            </AlertDescription>
          </Alert>

          <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
            <Card className="bg-muted/30 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTile icon={Calendar03Icon} />
                  Tanggal mulai pembukuan
                </CardTitle>
                <CardDescription>
                  Ini akan menjadi tanggal cutover untuk
                  accounting organization Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <form.AppField name="start_date">
                    {(field) => (
                      <field.TextField
                        label="Tanggal mulai"
                        type="date"
                        description="Rekomendasi: gunakan hari pertama bulan untuk cutover yang mudah direkonsiliasi."
                      />
                    )}
                  </form.AppField>
                  <div className="bg-background flex items-start gap-3 rounded-xl border p-4">
                    <IconTile
                      icon={Building03Icon}
                      tone="muted"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Kalender accounting
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm leading-5">
                        Mengikuti timezone toko utama:
                        Asia/Jakarta. Jika organization
                        memiliki toko di timezone berbeda,
                        pengaturannya akan tersedia di
                        Accounting settings.
                      </p>
                    </div>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <div className="bg-foreground text-background relative overflow-hidden rounded-2xl p-5">
                <div className="bg-primary/30 absolute -top-12 -right-10 size-32 rounded-full blur-2xl" />
                <div className="relative flex flex-col gap-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-background/65 text-xs font-medium tracking-[0.16em] uppercase">
                      Cutover preview
                    </span>
                    <Badge variant="secondary">
                      01 Sep 2026
                    </Badge>
                  </div>
                  <div>
                    <p className="text-background/65 text-sm">
                      Accounting aktif mulai
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                      1 September
                    </p>
                    <p className="text-background/65 mt-1 text-sm">
                      Periode 2026-09
                    </p>
                  </div>
                </div>
              </div>
              <Card size="sm">
                <CardContent className="flex gap-3 p-4">
                  <IconTile
                    icon={Building03Icon}
                    tone="muted"
                  />
                  <div>
                    <p className="font-medium">
                      Satu ledger untuk organization
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm leading-5">
                      Store dan platform tetap bisa
                      dianalisis sebagai dimensi transaksi.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 02 · Data readiness"
            title="Rapikan fondasi sebelum angka masuk."
            description="Kami menyiapkan gambaran singkat tentang product, inventory, dan order yang akan menjadi konteks accounting. Tidak ada data yang diubah di tahap ini."
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Product"
              value="186"
              note="terdaftar"
              icon={ShoppingCart01Icon}
            />
            <MetricCard
              label="Inventory item"
              value="142"
              note="aktif"
              icon={Package02Icon}
            />
            <MetricCard
              label="Order selesai"
              value="312"
              note="siap ditinjau"
              icon={FileEditIcon}
            />
            <MetricCard
              label="Perlu perhatian"
              value="17"
              note="cost atau mapping"
              icon={InformationCircleIcon}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory readiness</CardTitle>
              <CardDescription>
                Product tidak otomatis menjadi inventory
                item. Pilih pendekatan yang sesuai dengan
                cara bisnis Anda mengelola stok.
              </CardDescription>
              <CardAction>
                <Badge variant="warning">
                  Review diperlukan
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <form.AppField name="inventory_mode">
                {(field) => (
                  <FieldSet>
                    <FieldLegend>
                      Mode inventory
                    </FieldLegend>
                    <ToggleGroup
                      value={[String(field.state.value)]}
                      onValueChange={(value: unknown) => {
                        const next = value as string[];
                        if (next[0])
                          field.handleChange(next[0]);
                      }}
                      className="grid w-full gap-3 md:grid-cols-2"
                    >
                      <ToggleGroupItem
                        value="detailed"
                        variant="outline"
                        className="data-pressed:border-primary data-pressed:bg-primary/5 h-auto min-h-36 w-full justify-start rounded-2xl px-4 py-4 text-left"
                      >
                        <span className="bg-muted text-muted-foreground data-pressed:bg-primary data-pressed:text-primary-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                          <HugeiconsIcon
                            icon={Package02Icon}
                            size={20}
                          />
                        </span>
                        <span className="flex flex-col items-start gap-1">
                          <span className="font-medium">
                            Lacak stok per item
                          </span>
                          <span className="text-muted-foreground text-sm leading-5 font-normal">
                            Isi quantity, lokasi, dan cost
                            agar item siap dipakai untuk
                            COGS order.
                          </span>
                        </span>
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="aggregate"
                        variant="outline"
                        className="data-pressed:border-primary data-pressed:bg-primary/5 h-auto min-h-36 w-full justify-start rounded-2xl px-4 py-4 text-left"
                      >
                        <span className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-xl">
                          <HugeiconsIcon
                            icon={Money01Icon}
                            size={20}
                          />
                        </span>
                        <span className="flex flex-col items-start gap-1">
                          <span className="font-medium">
                            Mulai dari total nilai
                          </span>
                          <span className="text-muted-foreground text-sm leading-5 font-normal">
                            Catat asset inventory secara
                            agregat dan lengkapi detail item
                            nanti.
                          </span>
                        </span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-muted-foreground text-xs leading-5">
                      Mode detail direkomendasikan jika
                      order existing akan dikonversi ke
                      accounting karena COGS membutuhkan
                      item, quantity, dan cost.
                    </p>
                  </FieldSet>
                )}
              </form.AppField>
              <Separator />
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  [
                    '128',
                    'Sudah ter-mapping',
                    'text-success',
                  ],
                  [
                    '14',
                    'Belum punya cost',
                    'text-warning',
                  ],
                  ['3', 'Stok negatif', 'text-destructive'],
                ].map(([value, label, tone]) => (
                  <div
                    key={label}
                    className="bg-muted/50 rounded-xl p-4"
                  >
                    <p
                      className={cn(
                        'text-2xl font-semibold',
                        tone
                      )}
                    >
                      {value}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                Kandidat dipilih secara eksplisit; product
                tidak dibuat massal menjadi inventory item.
              </p>
              <Dialog
                open={isInventoryDialogOpen}
                onOpenChange={setIsInventoryDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                    />
                  }
                >
                  Tinjau kandidat
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    data-icon="inline-end"
                  />
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      Pilih inventory-managed product
                    </DialogTitle>
                    <DialogDescription>
                      Pilihan ini hanya menentukan
                      product/variant yang akan disiapkan
                      sebagai inventory item. Quantity dan
                      cost diisi pada langkah saldo awal.
                    </DialogDescription>
                  </DialogHeader>
                  <FieldSet>
                    <FieldLegend variant="label">
                      Kandidat dari product catalog
                    </FieldLegend>
                    <div className="flex flex-col gap-3">
                      {inventoryCandidates.map(
                        (candidate) => {
                          const selected =
                            selectedInventoryCandidates.includes(
                              candidate.id
                            );
                          return (
                            <Field
                              key={candidate.id}
                              orientation="horizontal"
                              className={cn(
                                'rounded-xl border p-3 transition-colors',
                                selected
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'bg-background'
                              )}
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() =>
                                  toggleInventoryCandidate(
                                    candidate.id
                                  )
                                }
                              />
                              <FieldContent>
                                <FieldLabel>
                                  {candidate.name}
                                </FieldLabel>
                                <FieldDescription>
                                  {candidate.reference} ·
                                  Cost usulan:{' '}
                                  {candidate.suggestedCost}
                                </FieldDescription>
                              </FieldContent>
                            </Field>
                          );
                        }
                      )}
                    </div>
                  </FieldSet>
                  <DialogFooter>
                    <DialogClose
                      render={
                        <Button
                          type="button"
                          variant="outline"
                        />
                      }
                    >
                      Selesai meninjau
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle>Stock baseline preview</CardTitle>
              <CardDescription>
                Item terpilih akan membutuhkan lokasi,
                quantity, dan unit cost sebelum inventory
                dapat dipakai untuk COGS.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  {selectedInventoryCandidates.length}{' '}
                  dipilih
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">
                      Inventory item
                    </TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Opening quantity</TableHead>
                    <TableHead className="pr-4 text-right">
                      Unit cost
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryCandidates
                    .filter((candidate) =>
                      selectedInventoryCandidates.includes(
                        candidate.id
                      )
                    )
                    .map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">
                            {candidate.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {candidate.reference}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          Gudang utama
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          Belum diisi
                        </TableCell>
                        <TableCell className="pr-4 text-right text-sm">
                          {candidate.suggestedCost}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 03 · Struktur akun"
            title="Buat setiap saldo punya rumah."
            description="Gunakan Chart of Accounts sebagai struktur utama. Rekening bank dan piutang marketplace yang perlu dilihat terpisah dapat memiliki akun postable masing-masing."
          />

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>
                Account structure preview
              </CardTitle>
              <CardDescription>
                Seed hanya baseline. Group account tidak
                dipakai langsung untuk journal line dan akun
                postable dapat disesuaikan.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">
                  Baseline CoA
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">
                      Kode
                    </TableHead>
                    <TableHead>Nama akun</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="pr-4 text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [
                      '1120',
                      'Bank BCA •••• 9910',
                      'Asset',
                      'Postable',
                    ],
                    [
                      '1121',
                      'Bank BNI •••• 2391',
                      'Asset',
                      'Postable',
                    ],
                    [
                      '1211',
                      'Piutang Shopee',
                      'Asset',
                      'Postable',
                    ],
                    [
                      '1212',
                      'Piutang Tokopedia',
                      'Asset',
                      'Postable',
                    ],
                    [
                      '1310',
                      'Persediaan Barang Dagang',
                      'Asset',
                      'Postable',
                    ],
                    [
                      '4100',
                      'Penjualan Barang Dagang',
                      'Revenue',
                      'Postable',
                    ],
                  ].map(([code, name, type, status]) => (
                    <TableRow key={code}>
                      <TableCell className="text-muted-foreground pl-4 font-mono text-xs">
                        {code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {type}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Badge variant="outline">
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTile icon={BankIcon} />
                  Rekening sebagai akun CoA
                </CardTitle>
                <CardDescription>
                  Setiap rekening yang perlu memiliki saldo
                  terpisah menjadi akun postable di bawah
                  Kas dan Setara Kas.
                </CardDescription>
                <CardAction>
                  <Dialog
                    open={isAccountDialogOpen}
                    onOpenChange={setIsAccountDialogOpen}
                  >
                    <DialogTrigger
                      render={
                        <Button type="button" size="sm" />
                      }
                    >
                      <HugeiconsIcon
                        icon={Add01Icon}
                        data-icon="inline-start"
                      />
                      Tambah akun
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          Tambah rekening ke CoA
                        </DialogTitle>
                        <DialogDescription>
                          Rekening baru akan menjadi child
                          dari 1100 Kas dan Setara Kas.
                          Nomor rekening lengkap tidak
                          disimpan.
                        </DialogDescription>
                      </DialogHeader>
                      <FieldGroup>
                        <form.AppField name="new_account_name">
                          {(field) => (
                            <field.TextField
                              label="Nama bank"
                              placeholder="Bank BCA"
                            />
                          )}
                        </form.AppField>
                        <form.AppField name="new_account_last4">
                          {(field) => (
                            <field.TextField
                              label="4 digit terakhir"
                              placeholder="9910"
                              description="Hanya untuk identifikasi tampilan."
                            />
                          )}
                        </form.AppField>
                        <form.AppField name="new_account_owner">
                          {(field) => (
                            <field.TextField
                              label="Pemilik rekening"
                              placeholder="Toko ABC"
                            />
                          )}
                        </form.AppField>
                      </FieldGroup>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button
                              type="button"
                              variant="outline"
                            />
                          }
                        >
                          Batal
                        </DialogClose>
                        <Button
                          type="button"
                          onClick={addPreviewBankAccount}
                        >
                          Tambahkan ke preview
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {previewBankAccounts.map(
                  ({ code, name, balance }) => (
                    <div
                      key={code}
                      className="bg-muted/50 flex items-center justify-between gap-3 rounded-xl px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-muted-foreground font-mono text-xs">
                          {code}
                        </span>
                        <span className="truncate text-sm font-medium">
                          {name}
                        </span>
                      </div>
                      <span className="font-mono text-sm tabular-nums">
                        {balance}
                      </span>
                    </div>
                  )
                )}
              </CardContent>
              <CardFooter>
                <p className="text-muted-foreground text-xs">
                  Rekening adalah akun postable, bukan
                  collection terpisah.
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTile icon={Chart03Icon} />
                  Marketplace receivable
                </CardTitle>
                <CardDescription>
                  Pisahkan account jika saldo tiap
                  marketplace perlu berdiri sendiri.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {[
                    ['1211', 'Piutang Shopee', 'Aktif'],
                    [
                      '1212',
                      'Piutang Tokopedia',
                      'Siap ditambahkan',
                    ],
                  ].map(([code, name, status]) => (
                    <div
                      key={code}
                      className="bg-muted/50 flex items-center justify-between gap-3 rounded-xl px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-muted-foreground font-mono text-xs">
                          {code}
                        </span>
                        <span className="truncate text-sm font-medium">
                          {name}
                        </span>
                      </div>
                      <Badge
                        variant={
                          status === 'Aktif'
                            ? 'success'
                            : 'outline'
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Langkah 04 · Saldo awal"
            title="Masukkan kondisi nyata bisnis."
            description="Saldo awal adalah foto bisnis Anda pada tanggal mulai. Angka ini tidak harus sempurna secara historis, tetapi harus merepresentasikan kondisi aktual yang ingin Anda jadikan titik awal."
          />

          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <Card>
              <CardHeader>
                <CardTitle>Asset dan receivable</CardTitle>
                <CardDescription>
                  Semua nominal dalam Rupiah.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <form.AppField name="bank_bca_balance">
                      {(field) => (
                        <field.MoneyField label="Bank BCA •••• 9910" />
                      )}
                    </form.AppField>
                    <form.AppField name="bank_bni_balance">
                      {(field) => (
                        <field.MoneyField label="Bank BNI •••• 2391" />
                      )}
                    </form.AppField>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <form.AppField name="shopee_receivable">
                      {(field) => (
                        <field.MoneyField
                          label="Piutang Shopee"
                          description="Order tidak batal dan belum released."
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="tokopedia_receivable">
                      {(field) => (
                        <field.MoneyField label="Piutang Tokopedia" />
                      )}
                    </form.AppField>
                  </div>
                  <form.AppField name="inventory_value">
                    {(field) => (
                      <field.MoneyField
                        label="Nilai inventory opening"
                        description="Agregat cost dari opening stock, bukan selling price."
                      />
                    )}
                  </form.AppField>
                  <Alert className="border-primary/20 bg-primary/5">
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                    />
                    <AlertTitle>
                      Inventory dicatat sekali
                    </AlertTitle>
                    <AlertDescription>
                      Nilai inventory pada opening journal
                      harus sama dengan total cost opening
                      stock. Jangan membuat purchase journal
                      tambahan untuk stok yang sudah ada
                      sebelum cutover.
                    </AlertDescription>
                  </Alert>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Liabilities dan catatan
                </CardTitle>
                <CardDescription>
                  Hutang dapat berasal dari supplier, bank,
                  finance, keluarga, atau pihak lain. Untuk
                  sekarang ini dicatat sebagai opening
                  balance; detail jatuh tempo akan hadir di
                  payable/loan workflow terpisah.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <form.AppField name="supplier_debt">
                    {(field) => (
                      <field.MoneyField label="Utang supplier" />
                    )}
                  </form.AppField>
                  <form.AppField name="other_debt">
                    {(field) => (
                      <field.MoneyField label="Liabilitas lain" />
                    )}
                  </form.AppField>
                  <form.AppField name="notes">
                    {(field) => (
                      <field.TextareaField
                        label="Catatan saldo awal"
                        placeholder="Contoh: dihitung dari rekonsiliasi bank dan stok fisik per 1 September."
                        className="min-h-24 resize-none"
                      />
                    )}
                  </form.AppField>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Total asset"
              value={formatIDR(74200000)}
              note="Kas, piutang, inventory"
              icon={Wallet02Icon}
            />
            <MetricCard
              label="Total liability"
              value={formatIDR(17000000)}
              note="Supplier dan lainnya"
              icon={Money01Icon}
            />
            <MetricCard
              label="Modal awal"
              value={formatIDR(57200000)}
              note="Asset dikurangi liability"
              icon={Chart03Icon}
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Opening journal preview</CardTitle>
              <CardDescription>
                Satu journal pembukaan akan menjadi sumber
                saldo awal. Opening stock tidak dibuat
                sebagai purchase journal kedua.
              </CardDescription>
              <CardAction>
                <Badge variant="success">
                  Debit = Credit
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">
                      Akun
                    </TableHead>
                    <TableHead className="text-right">
                      Debit
                    </TableHead>
                    <TableHead className="pr-4 text-right">
                      Credit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [
                      '1120/1121 · Kas dan bank',
                      'Rp25.000.000',
                      '—',
                    ],
                    [
                      '1211/1212 · Piutang marketplace',
                      'Rp7.200.000',
                      '—',
                    ],
                    [
                      '1310 · Persediaan barang dagang',
                      'Rp42.000.000',
                      '—',
                    ],
                    [
                      '2100/2200 · Liabilitas awal',
                      '—',
                      'Rp17.000.000',
                    ],
                    [
                      '3110 · Modal pemilik / saldo awal',
                      '—',
                      'Rp57.200.000',
                    ],
                  ].map(([account, debit, credit]) => (
                    <TableRow key={account}>
                      <TableCell className="pl-4 text-sm font-medium">
                        {account}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {debit}
                      </TableCell>
                      <TableCell className="pr-4 text-right font-mono text-sm tabular-nums">
                        {credit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Langkah 05 · Final review"
          title="Satu pandangan sebelum buku dibuka."
          description="Review ringkasan setup Anda. Pada tahap backend nanti, tombol ini akan membuat opening balance, mengaktifkan accounting, dan mengunci tanggal mulai."
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_0.78fr]">
          <Card>
            <CardHeader>
              <CardTitle>Accounting snapshot</CardTitle>
              <CardDescription>
                Per 1 September 2026 · IDR
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {(
                [
                  [
                    'Kas dan bank',
                    formatIDR(25000000),
                    BankIcon,
                  ],
                  [
                    'Piutang marketplace',
                    formatIDR(7200000),
                    Chart03Icon,
                  ],
                  [
                    'Inventory',
                    formatIDR(42000000),
                    Package02Icon,
                  ],
                  [
                    'Liabilities',
                    formatIDR(17000000),
                    Money01Icon,
                  ],
                  [
                    'Modal awal',
                    formatIDR(57200000),
                    Wallet02Icon,
                  ],
                ] as Array<
                  [string, string, typeof Calendar03Icon]
                >
              ).map(([label, value, icon]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile
                      icon={icon as typeof Calendar03Icon}
                      tone="muted"
                    />
                    <span className="truncate text-sm font-medium">
                      {label}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {value}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="bg-primary/5 border-primary/15 flex items-center justify-between rounded-xl border px-4 py-3">
                <span className="text-sm font-medium">
                  Debit = Credit
                </span>
                <Badge variant="success">Seimbang</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Order conversion policy</CardTitle>
              <CardDescription>
                Konversi order tidak menjadi efek samping
                finalisasi opening balance.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                [
                  'Order baru setelah accounting aktif',
                  'Otomatis jika status, product mapping, cost, dan lokasi sudah siap.',
                  'success',
                ],
                [
                  'Order existing setelah cutover',
                  'Masuk queue untuk ditinjau atau dikonversi secara batch.',
                  'warning',
                ],
                [
                  'Order sebelum cutover',
                  'Tidak disentuh standard onboarding; reconstruction adalah flow terpisah.',
                  'outline',
                ],
              ].map(([title, description, variant]) => (
                <div
                  key={title}
                  className="bg-background/70 flex items-start justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {title}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      variant as
                        | 'success'
                        | 'warning'
                        | 'outline'
                    }
                  >
                    {variant === 'success'
                      ? 'Auto'
                      : variant === 'warning'
                        ? 'Review'
                        : 'Terpisah'}
                  </Badge>
                </div>
              ))}
              <form.AppField name="confirmation">
                {(field) => (
                  <field.SwitchField
                    label="Saya sudah review"
                    description="Saya memahami setup standar tidak merekonstruksi histori."
                  />
                )}
              </form.AppField>
            </CardContent>
            <CardFooter>
              <Alert className="border-warning/20 bg-warning/5 w-full">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                />
                <AlertTitle>Prototype UI</AlertTitle>
                <AlertDescription>
                  Belum ada data yang disimpan atau journal
                  yang dibuat.
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  };

  if (isPreviewComplete) {
    return (
      <main className="bg-muted/20 flex min-h-full flex-col justify-center px-4 py-8 lg:px-8">
        <Card className="mx-auto w-full max-w-2xl overflow-hidden">
          <div className="bg-foreground text-background relative overflow-hidden px-6 py-12 text-center sm:px-12">
            <div className="bg-primary/30 absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full blur-3xl" />
            <div className="relative mx-auto flex max-w-md flex-col items-center gap-5">
              <span className="bg-primary/20 text-primary grid size-16 place-items-center rounded-2xl">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={34}
                />
              </span>
              <div>
                <p className="text-background/60 text-xs font-semibold tracking-[0.18em] uppercase">
                  UI prototype complete
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Flow onboarding selesai.
                </h1>
                <p className="text-background/65 mt-3 text-sm leading-6">
                  Backend belum dipanggil. Halaman ini hanya
                  menunjukkan state setelah user
                  menyelesaikan wizard.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsPreviewComplete(false);
                  setCurrentStep(0);
                }}
              >
                Lihat ulang flow
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  data-icon="inline-end"
                />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-muted/20 min-h-full overflow-x-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-7 shadow-2xl sm:px-8 sm:py-9">
          <div className="bg-primary/25 absolute -top-28 right-12 size-72 rounded-full blur-3xl" />
          <div className="bg-secondary/20 absolute -bottom-36 left-1/3 size-80 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    data-icon="inline-start"
                  />
                  Accounting setup
                </Badge>
                <span className="text-background/60 text-xs">
                  Prototype UI
                </span>
              </div>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Bangun fondasi angka yang bisa dipercaya.
              </h1>
              <p className="text-background/65 mt-4 max-w-xl text-sm leading-6 sm:text-base">
                Setup accounting dengan tenang, satu
                keputusan kecil dalam satu langkah. Review
                dulu struktur akun, inventory, dan saldo
                awal sebelum buku dibuka.
              </p>
            </div>
            <div className="border-background/15 bg-background/10 w-full rounded-2xl border p-4 lg:max-w-56">
              <p className="text-background/60 text-xs font-medium tracking-[0.16em] uppercase">
                Langkah sekarang
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {String(currentStep + 1).padStart(2, '0')}{' '}
                <span className="text-background/50 text-base font-normal">
                  / 05
                </span>
              </p>
              <p className="text-background/65 mt-1 text-sm">
                {step.title}
              </p>
            </div>
          </div>
        </section>

        <div className="overflow-x-auto pb-1">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="min-w-0">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (isLastStep) {
                  void form.handleSubmit();
                } else {
                  goNext();
                }
              }}
            >
              <CardHeader className="bg-background/60 border-b">
                <div className="flex items-center gap-3">
                  <IconTile icon={step.icon} />
                  <div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>
                      {step.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-8">
                {renderStep()}
              </CardContent>
              <CardFooter className="bg-background/60 justify-between gap-3 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goPrevious}
                  disabled={currentStep === 0}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft02Icon}
                    data-icon="inline-start"
                  />
                  Kembali
                </Button>
                <Button type="submit">
                  {isLastStep
                    ? 'Selesaikan prototype'
                    : 'Lanjutkan'}
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    data-icon="inline-end"
                  />
                </Button>
              </CardFooter>
            </form>
          </Card>

          <aside className="flex flex-col gap-4">
            <Card className="bg-primary/5 border-primary/15">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HugeiconsIcon
                    icon={SecurityCheckIcon}
                    size={18}
                  />
                  Prinsip setup
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {(
                  [
                    [
                      'Satu organization, satu ledger.',
                      Building03Icon,
                    ],
                    ['Data lama tetap aman.', FileEditIcon],
                    [
                      'Inventory tidak dibuat massal.',
                      Package02Icon,
                    ],
                  ] as Array<
                    [string, typeof Calendar03Icon]
                  >
                ).map(([label, icon]) => (
                  <div
                    key={String(label)}
                    className="flex items-start gap-3"
                  >
                    <span className="text-primary mt-0.5">
                      <HugeiconsIcon
                        icon={icon as typeof Calendar03Icon}
                        size={18}
                      />
                    </span>
                    <p className="text-muted-foreground text-sm leading-5">
                      {label}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex gap-3 p-4">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                  className="text-muted-foreground mt-0.5 shrink-0"
                />
                <p className="text-muted-foreground text-xs leading-5">
                  Ini masih preview UI. Next/Prev belum
                  menjalankan validasi dan belum menyimpan
                  apa pun ke database.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
