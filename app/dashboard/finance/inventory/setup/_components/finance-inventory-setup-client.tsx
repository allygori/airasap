'use client';

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import Link from 'next/link';
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/ui';
import {
  FinanceInventorySetupActionResponseSchema,
  FinanceInventorySetupResponseSchema,
  type FinanceInventorySetupActionInputDTO,
  type FinanceInventorySetupQueryDTO,
  type FinanceInventorySetupResponseDTO,
} from '@/modules/finance/client';

type FinanceInventorySetupClientProps = {
  initialData: FinanceInventorySetupResponseDTO;
  initialQuery: FinanceInventorySetupQueryDTO;
};

type ProductOption =
  FinanceInventorySetupResponseDTO['product_options'][number];
type ManualItemType = Extract<
  FinanceInventorySetupActionInputDTO,
  { action: 'create_manual' }
>['item_type'];

type ItemDraft = {
  sku: string;
  name: string;
  unit: string;
  track_quantity: boolean;
  track_value: boolean;
};

const itemTypes: Array<{
  label: string;
  value: ManualItemType;
}> = [
  { label: 'Barang dagang', value: 'merchandise' },
  { label: 'Kemasan', value: 'packaging' },
  { label: 'Perlengkapan', value: 'supplies' },
  { label: 'Aset tetap', value: 'fixed_asset' },
];

const getResponseData = (payload: unknown): unknown => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('success' in payload) ||
    payload.success !== true ||
    !('data' in payload)
  ) {
    return undefined;
  }
  return payload.data;
};

const getResponseError = (payload: unknown) => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('error' in payload) ||
    typeof payload.error !== 'object' ||
    payload.error === null ||
    !('message' in payload.error) ||
    typeof payload.error.message !== 'string'
  ) {
    return null;
  }
  return payload.error.message;
};

const getResponseErrorCode = (payload: unknown) => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('error' in payload) ||
    typeof payload.error !== 'object' ||
    payload.error === null ||
    !('code' in payload.error) ||
    typeof payload.error.code !== 'string'
  ) {
    return null;
  }
  return payload.error.code;
};

const productLabel = (product: ProductOption) =>
  `${product.product_name}${product.variant_name ? ` — ${product.variant_name}` : ''}`;

const productItemDraft = (
  product?: ProductOption
): ItemDraft => ({
  sku: product?.sku ?? '',
  name: product ? productLabel(product) : '',
  unit: 'pcs',
  track_quantity: true,
  track_value: true,
});

const platformLabel = (platform?: string) => {
  if (platform === 'tiktok-shop') return 'TikTok Shop';
  if (!platform) return 'Katalog';
  return (
    platform.charAt(0).toUpperCase() + platform.slice(1)
  );
};

const buildSetupUrl = (
  query: FinanceInventorySetupQueryDTO
) => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set('search', query.search);
  if (query.item_search) {
    params.set('item_search', query.item_search);
  }
  return `/api/v1/dashboard/finance/inventory/setup?${params.toString()}`;
};

export function FinanceInventorySetupClient({
  initialData,
  initialQuery,
}: FinanceInventorySetupClientProps) {
  const [setup, setSetup] = useState(initialData);
  const [query, setQuery] = useState(initialQuery);
  const [productSearch, setProductSearch] = useState(
    initialQuery.search ?? ''
  );
  const [itemSearch, setItemSearch] = useState(
    initialQuery.item_search ?? ''
  );
  const [selectedProductKey, setSelectedProductKey] =
    useState(initialData.product_options[0]?.key ?? '');
  const [productDraft, setProductDraft] =
    useState<ItemDraft>(() =>
      productItemDraft(initialData.product_options[0])
    );
  const [manualDraft, setManualDraft] = useState<ItemDraft>(
    {
      sku: '',
      name: '',
      unit: 'pcs',
      track_quantity: true,
      track_value: true,
    }
  );
  const [manualItemType, setManualItemType] =
    useState<ManualItemType>('packaging');
  const [targetItemId, setTargetItemId] = useState(
    initialData.product_options[0]?.mapped_inventory_item
      ?.id ?? ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const selectedProduct = setup.product_options.find(
    (product) => product.key === selectedProductKey
  );
  const refreshSetup = async (
    nextQuery: FinanceInventorySetupQueryDTO,
    options?: { showLoading?: boolean }
  ) => {
    if (options?.showLoading !== false) setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        buildSetupUrl(nextQuery),
        {
          cache: 'no-store',
        }
      );
      const payload: unknown = await response.json();
      const parsed =
        FinanceInventorySetupResponseSchema.safeParse(
          getResponseData(payload)
        );

      if (!response.ok || !parsed.success) {
        setErrorMessage(
          getResponseError(payload) ??
            'Setup inventory gagal dimuat. Coba lagi.'
        );
        return false;
      }

      const nextSelectedProduct =
        parsed.data.product_options.find(
          (product) => product.key === selectedProductKey
        ) ?? parsed.data.product_options[0];
      setSetup(parsed.data);
      if (nextSelectedProduct?.key !== selectedProductKey) {
        setSelectedProductKey(
          nextSelectedProduct?.key ?? ''
        );
        setProductDraft(
          productItemDraft(nextSelectedProduct)
        );
        setTargetItemId(
          nextSelectedProduct?.mapped_inventory_item?.id ??
            ''
        );
      }
      setQuery(nextQuery);
      return true;
    } catch {
      setErrorMessage(
        'Setup inventory gagal dimuat. Periksa koneksi lalu coba lagi.'
      );
      return false;
    } finally {
      if (options?.showLoading !== false)
        setIsLoading(false);
    }
  };

  const performAction = async (
    action: FinanceInventorySetupActionInputDTO,
    success: string
  ) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/inventory/setup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        }
      );
      const payload: unknown = await response.json();
      const parsed =
        FinanceInventorySetupActionResponseSchema.safeParse(
          getResponseData(payload)
        );

      if (!response.ok || !parsed.success) {
        const error =
          getResponseError(payload) ??
          'Perubahan inventory gagal disimpan. Coba lagi.';
        setErrorMessage(
          getResponseErrorCode(payload) ===
            'FINANCE_INVENTORY_ITEM_SKU_CONFLICT'
            ? `${error} Gunakan stok yang sudah ada, atau ubah SKU di detail item.`
            : error
        );
        return;
      }

      if (parsed.data.action === 'create_from_product') {
        setProductDraft({
          sku: parsed.data.item.sku,
          name: parsed.data.item.name,
          unit: parsed.data.item.unit,
          track_quantity: parsed.data.item.track_quantity,
          track_value: parsed.data.item.track_value,
        });
        setTargetItemId(parsed.data.item.id);
      } else if (parsed.data.action === 'map_product') {
        setTargetItemId(parsed.data.item.id);
      } else if (parsed.data.action === 'create_manual') {
        setManualDraft({
          sku: '',
          name: '',
          unit: 'pcs',
          track_quantity: true,
          track_value: true,
        });
      }

      setSuccessMessage(success);
      const nextQuery = {
        ...query,
        item_search: undefined,
      };
      setItemSearch('');
      await refreshSetup(nextQuery, { showLoading: false });
    } catch {
      setErrorMessage(
        'Perubahan inventory gagal disimpan. Periksa koneksi lalu coba lagi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const submitProductSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    void refreshSetup({
      ...query,
      page: 1,
      search: productSearch.trim() || undefined,
    });
  };

  const submitItemSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    void refreshSetup({
      ...query,
      item_search: itemSearch.trim() || undefined,
    });
  };

  const selectProductOption = (product: ProductOption) => {
    setSelectedProductKey(product.key);
    setProductDraft(productItemDraft(product));
    setTargetItemId(
      product.mapped_inventory_item?.id ?? ''
    );
  };

  const selectableItems = setup.inventory_items.filter(
    (item) =>
      item.item_type === 'merchandise' &&
      item.track_quantity
  );
  const selectedMappedItem =
    selectedProduct?.mapped_inventory_item;
  if (
    selectedMappedItem?.item_type === 'merchandise' &&
    selectedMappedItem.track_quantity &&
    !selectableItems.some(
      (item) => item.id === selectedMappedItem.id
    )
  ) {
    selectableItems.unshift(selectedMappedItem);
  }
  const selectedItemIsValid = selectableItems.some(
    (item) => item.id === targetItemId
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-3 border-b pb-6">
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Finance / Persediaan
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Siapkan stok produk
            </h1>
            <p className="text-muted-foreground mt-2 leading-7">
              Pilih produk yang ingin dilacak. Stoknya bisa
              dipakai bersama oleh listing di toko dan
              platform lain.
            </p>
          </div>
          <Link
            href="/dashboard/finance/inventory/product-and-stock-list"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Lihat saldo stok →
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">
          {setup.default_location
            ? 'Lokasi stok: ' + setup.default_location.name
            : 'Gudang Utama disiapkan otomatis saat item pertama dibuat.'}
        </p>
      </header>

      {errorMessage ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertTitle>Belum berhasil</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert aria-live="polite">
          <AlertTitle>Tersimpan</AlertTitle>
          <AlertDescription>
            {successMessage}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Pilih produk</CardTitle>
            <CardDescription>
              Hanya produk yang dipilih yang memakai stok
              Finance.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form
              onSubmit={submitProductSearch}
              className="flex gap-2"
            >
              <Input
                aria-label="Cari produk katalog"
                value={productSearch}
                onChange={(event) =>
                  setProductSearch(event.target.value)
                }
                placeholder="Cari nama atau SKU produk…"
                maxLength={100}
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading}
              >
                Cari
              </Button>
            </form>
            <div className="grid max-h-[32rem] gap-1 overflow-y-auto pr-1">
              {setup.product_options.map((product) => {
                const selected =
                  product.key === selectedProductKey;
                return (
                  <button
                    key={product.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      selectProductOption(product)
                    }
                    className={cn(
                      'focus-visible:ring-ring flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-border hover:bg-muted/50 border-transparent'
                    )}
                  >
                    <span className="flex w-full items-start justify-between gap-3">
                      <span className="min-w-0 truncate font-medium">
                        {productLabel(product)}
                      </span>
                      {product.mapped_inventory_item ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0"
                        >
                          Stok siap
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                      <span>
                        {platformLabel(product.platform)}
                      </span>
                      <span>·</span>
                      <span>
                        SKU: {product.sku ?? 'belum ada'}
                      </span>
                    </span>
                  </button>
                );
              })}
              {setup.product_options.length === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                  Belum ada produk yang cocok. Periksa
                  katalog atau tambahkan barang tanpa
                  katalog di bawah.
                </p>
              ) : null}
            </div>
            <div className="text-muted-foreground flex items-center justify-between gap-3 border-t pt-3 text-xs">
              <span>
                Halaman {setup.product_pagination.page} dari{' '}
                {Math.max(
                  setup.product_pagination.total_pages,
                  1
                )}
              </span>
              <span className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    isLoading ||
                    setup.product_pagination.page <= 1
                  }
                  onClick={() =>
                    void refreshSetup({
                      ...query,
                      page: query.page - 1,
                    })
                  }
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    isLoading ||
                    setup.product_pagination.page >=
                      setup.product_pagination.total_pages
                  }
                  onClick={() =>
                    void refreshSetup({
                      ...query,
                      page: query.page + 1,
                    })
                  }
                >
                  Berikutnya
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Stok untuk produk pilihan</CardTitle>
            <CardDescription>
              Setiap barang fisik punya satu saldo stok,
              meski dijual melalui beberapa listing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {selectedProduct ? (
              <>
                <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-lg p-3 text-sm">
                  <span className="font-medium">
                    {productLabel(selectedProduct)}
                  </span>
                  <Badge variant="outline">
                    {platformLabel(
                      selectedProduct.platform
                    )}
                  </Badge>
                </div>

                {selectedProduct.mapped_inventory_item ? (
                  <Alert>
                    <AlertTitle>
                      Stok sudah terhubung
                    </AlertTitle>
                    <AlertDescription>
                      {
                        selectedProduct
                          .mapped_inventory_item.sku
                      }{' '}
                      ·{' '}
                      {
                        selectedProduct
                          .mapped_inventory_item.name
                      }
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {selectedProduct.sku ? (
                      <p className="text-sm">
                        Item stok baru:{' '}
                        <span className="font-medium">
                          {productDraft.sku ||
                            'SKU belum diisi'}
                        </span>{' '}
                        · {productDraft.name}
                      </p>
                    ) : (
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="catalog-item-sku">
                            SKU barang fisik
                          </FieldLabel>
                          <Input
                            id="catalog-item-sku"
                            value={productDraft.sku}
                            onChange={(event) =>
                              setProductDraft(
                                (current) => ({
                                  ...current,
                                  sku: event.target.value,
                                })
                              )
                            }
                            maxLength={80}
                            placeholder="Contoh: KAOS-HITAM-M…"
                          />
                          <FieldDescription>
                            Produk ini belum punya SKU
                            katalog.
                          </FieldDescription>
                        </Field>
                      </FieldGroup>
                    )}

                    <Collapsible>
                      <CollapsibleTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-fit"
                          />
                        }
                      >
                        Ubah detail item
                      </CollapsibleTrigger>
                      <CollapsibleContent className="grid gap-4 pt-4">
                        <FieldGroup className="grid gap-4 sm:grid-cols-2">
                          {selectedProduct.sku ? (
                            <Field>
                              <FieldLabel htmlFor="catalog-item-sku">
                                SKU inventory
                              </FieldLabel>
                              <Input
                                id="catalog-item-sku"
                                value={productDraft.sku}
                                onChange={(event) =>
                                  setProductDraft(
                                    (current) => ({
                                      ...current,
                                      sku: event.target
                                        .value,
                                    })
                                  )
                                }
                                maxLength={80}
                              />
                            </Field>
                          ) : null}
                          <Field>
                            <FieldLabel htmlFor="catalog-item-name">
                              Nama item
                            </FieldLabel>
                            <Input
                              id="catalog-item-name"
                              value={productDraft.name}
                              onChange={(event) =>
                                setProductDraft(
                                  (current) => ({
                                    ...current,
                                    name: event.target
                                      .value,
                                  })
                                )
                              }
                              maxLength={160}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="catalog-item-unit">
                              Satuan
                            </FieldLabel>
                            <Input
                              id="catalog-item-unit"
                              value={productDraft.unit}
                              onChange={(event) =>
                                setProductDraft(
                                  (current) => ({
                                    ...current,
                                    unit: event.target
                                      .value,
                                  })
                                )
                              }
                              maxLength={40}
                            />
                          </Field>
                        </FieldGroup>
                        <TrackingOptions
                          prefix="catalog"
                          value={productDraft}
                          onChange={setProductDraft}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                    <p className="text-muted-foreground text-sm">
                      Jumlah dan nilai stok awal diisi saat
                      onboarding, setelah item ini dibuat.
                    </p>
                  </>
                )}

                <Separator />
                <Collapsible>
                  <CollapsibleTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit"
                      />
                    }
                  >
                    {selectedProduct.mapped_inventory_item
                      ? 'Ubah item stok yang terhubung'
                      : 'Gunakan stok yang sudah ada'}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid gap-4 pt-4">
                    <p className="text-muted-foreground text-sm">
                      Pilih ini bila listing tersebut
                      menjual barang fisik yang sudah ada di
                      inventory.
                    </p>
                    <form
                      onSubmit={submitItemSearch}
                      className="flex gap-2"
                    >
                      <Input
                        aria-label="Cari item stok yang sudah ada"
                        value={itemSearch}
                        onChange={(event) =>
                          setItemSearch(event.target.value)
                        }
                        placeholder="Cari SKU atau nama item…"
                        maxLength={100}
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={isLoading}
                      >
                        Cari
                      </Button>
                    </form>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="existing-inventory-item">
                          Item stok
                        </FieldLabel>
                        <Select
                          items={selectableItems.map(
                            (item) => ({
                              label:
                                item.sku +
                                ' — ' +
                                item.name,
                              value: item.id,
                            })
                          )}
                          value={targetItemId || null}
                          onValueChange={(value) =>
                            setTargetItemId(
                              typeof value === 'string'
                                ? value
                                : ''
                            )
                          }
                        >
                          <SelectTrigger
                            id="existing-inventory-item"
                            className="w-full"
                          >
                            <SelectValue placeholder="Pilih item stok" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {selectableItems.map(
                                (item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.id}
                                  >
                                    {item.sku} — {item.name}
                                  </SelectItem>
                                )
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {selectableItems.length === 0 ? (
                          <FieldDescription>
                            Belum ada item barang dagang
                            yang cocok.
                          </FieldDescription>
                        ) : null}
                      </Field>
                    </FieldGroup>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        isSaving || !selectedItemIsValid
                      }
                      onClick={() => {
                        if (!targetItemId) return;
                        const action: FinanceInventorySetupActionInputDTO =
                          {
                            action: 'map_product',
                            product_id:
                              selectedProduct.product_id,
                            ...(selectedProduct.variant_id
                              ? {
                                  variant_id:
                                    selectedProduct.variant_id,
                                }
                              : {}),
                            inventory_item_id: targetItemId,
                          };
                        void performAction(
                          action,
                          'Produk berhasil dihubungkan ke item stok.'
                        );
                      }}
                    >
                      {isSaving ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      Simpan hubungan stok
                    </Button>
                    {setup.inventory_item_pagination.total >
                    100 ? (
                      <p className="text-muted-foreground text-xs">
                        Menampilkan maksimal 100 item.
                        Gunakan pencarian untuk item lain.
                      </p>
                    ) : null}
                  </CollapsibleContent>
                </Collapsible>
              </>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
                Pilih produk dari daftar untuk menyiapkan
                stoknya.
              </p>
            )}
          </CardContent>
          {selectedProduct &&
          !selectedProduct.mapped_inventory_item ? (
            <CardFooter>
              <Button
                type="button"
                disabled={
                  isSaving ||
                  !productDraft.sku.trim() ||
                  !productDraft.name.trim() ||
                  !productDraft.unit.trim() ||
                  (productDraft.track_value &&
                    !productDraft.track_quantity)
                }
                onClick={() => {
                  const action: FinanceInventorySetupActionInputDTO =
                    {
                      action: 'create_from_product',
                      product_id:
                        selectedProduct.product_id,
                      ...(selectedProduct.variant_id
                        ? {
                            variant_id:
                              selectedProduct.variant_id,
                          }
                        : {}),
                      sku: productDraft.sku.trim(),
                      name: productDraft.name.trim(),
                      unit: productDraft.unit.trim(),
                      track_quantity:
                        productDraft.track_quantity,
                      track_value: productDraft.track_value,
                    };
                  void performAction(
                    action,
                    'Item stok dibuat dan dihubungkan ke produk.'
                  );
                }}
              >
                {isSaving ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Siapkan stok produk
              </Button>
            </CardFooter>
          ) : null}
        </Card>
      </div>

      <Collapsible>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Barang tanpa katalog</CardTitle>
              <CardDescription>
                Untuk kemasan, perlengkapan, atau barang
                offline.
              </CardDescription>
            </div>
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                />
              }
            >
              Tambah barang
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="grid gap-5">
              <FieldGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel htmlFor="manual-item-sku">
                    SKU / kode item
                  </FieldLabel>
                  <Input
                    id="manual-item-sku"
                    value={manualDraft.sku}
                    onChange={(event) =>
                      setManualDraft((current) => ({
                        ...current,
                        sku: event.target.value,
                      }))
                    }
                    maxLength={80}
                    placeholder="Contoh: BOX-SEDANG…"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="manual-item-name">
                    Nama item
                  </FieldLabel>
                  <Input
                    id="manual-item-name"
                    value={manualDraft.name}
                    onChange={(event) =>
                      setManualDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    maxLength={160}
                    placeholder="Contoh: Dus ukuran sedang…"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="manual-item-type">
                    Tipe item
                  </FieldLabel>
                  <Select
                    items={itemTypes}
                    value={manualItemType}
                    onValueChange={(value) => {
                      if (typeof value === 'string') {
                        const selectedType = itemTypes.find(
                          (item) => item.value === value
                        );
                        if (selectedType) {
                          setManualItemType(
                            selectedType.value
                          );
                        }
                      }
                    }}
                  >
                    <SelectTrigger
                      id="manual-item-type"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {itemTypes.map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="manual-item-unit">
                    Satuan
                  </FieldLabel>
                  <Input
                    id="manual-item-unit"
                    value={manualDraft.unit}
                    onChange={(event) =>
                      setManualDraft((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                    maxLength={40}
                    placeholder="pcs"
                  />
                </Field>
              </FieldGroup>
              <TrackingOptions
                prefix="manual"
                value={manualDraft}
                onChange={setManualDraft}
              />
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                disabled={
                  isSaving ||
                  !manualDraft.sku.trim() ||
                  !manualDraft.name.trim() ||
                  !manualDraft.unit.trim() ||
                  (manualDraft.track_value &&
                    !manualDraft.track_quantity)
                }
                onClick={() => {
                  const action: FinanceInventorySetupActionInputDTO =
                    {
                      action: 'create_manual',
                      sku: manualDraft.sku.trim(),
                      name: manualDraft.name.trim(),
                      item_type: manualItemType,
                      unit: manualDraft.unit.trim(),
                      track_quantity:
                        manualDraft.track_quantity,
                      track_value: manualDraft.track_value,
                    };
                  void performAction(
                    action,
                    'Item stok manual dibuat.'
                  );
                }}
              >
                {isSaving ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Simpan barang
              </Button>
            </CardFooter>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <p className="text-muted-foreground text-sm">
        Menyiapkan item belum menambah stok. Masukkan stok
        awal dan biayanya melalui onboarding opening
        balance.
      </p>
    </div>
  );
}

function TrackingOptions({
  prefix,
  value,
  onChange,
}: {
  prefix: string;
  value: ItemDraft;
  onChange: Dispatch<SetStateAction<ItemDraft>>;
}) {
  const quantityId = `${prefix}-track-quantity`;
  const valueId = `${prefix}-track-value`;

  return (
    <FieldGroup className="grid gap-3 sm:grid-cols-2">
      <Field orientation="horizontal">
        <Checkbox
          id={quantityId}
          checked={value.track_quantity}
          onCheckedChange={(checked) =>
            onChange((current) => ({
              ...current,
              track_quantity: checked === true,
              ...(checked !== true
                ? { track_value: false }
                : {}),
            }))
          }
        />
        <FieldContent>
          <FieldLabel htmlFor={quantityId}>
            Lacak jumlah stok
          </FieldLabel>
          <FieldDescription>
            Diperlukan untuk menampilkan quantity on hand.
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field
        orientation="horizontal"
        data-disabled={!value.track_quantity}
      >
        <Checkbox
          id={valueId}
          checked={value.track_value}
          disabled={!value.track_quantity}
          onCheckedChange={(checked) =>
            onChange((current) => ({
              ...current,
              track_value: checked === true,
            }))
          }
        />
        <FieldContent>
          <FieldLabel htmlFor={valueId}>
            Lacak nilai inventory
          </FieldLabel>
          <FieldDescription>
            Nilai stok dan HPP memerlukan unit cost yang
            valid.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}
