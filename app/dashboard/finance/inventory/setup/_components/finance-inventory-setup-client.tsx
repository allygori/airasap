'use client';

import { revalidateLogic } from '@tanstack/react-form';
import { useStore } from '@tanstack/react-form';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { useAppForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Button,
  buttonVariants,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/ui';
import {
  FinanceInventorySetupActionResponseSchema,
  FinanceInventorySetupResponseSchema,
  type FinanceInventorySetupActionInputDTO,
  type FinanceInventorySetupActionResponseDTO,
  type FinanceInventorySetupQueryDTO,
  type FinanceInventorySetupResponseDTO,
} from '@/modules/finance/client';
import {
  createFinanceInventoryManualItemFormDefaults,
  InventoryManualItemForm,
} from './inventory-manual-item.form';
import {
  createFinanceInventoryProductSetupFormDefaults,
  InventoryProductMappingForm,
} from './inventory-product-mapping.form';
import {
  FinanceInventoryManualItemFormSchema,
  FinanceInventoryProductSetupFormSchema,
} from './inventory-setup.schema';

type FinanceInventorySetupClientProps = {
  initialData: FinanceInventorySetupResponseDTO;
  initialQuery: FinanceInventorySetupQueryDTO;
};

type ProductOption =
  FinanceInventorySetupResponseDTO['product_options'][number];

type SetupActionHandler = (
  action: FinanceInventorySetupActionInputDTO,
  successMessage: string
) => Promise<boolean>;

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

const getResponseError = (
  payload: unknown
): string | null => {
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

const getResponseErrorCode = (
  payload: unknown
): string | null => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);
  const [batchResult, setBatchResult] = useState<Extract<
    FinanceInventorySetupActionResponseDTO,
    { action: 'prepare_from_products' }
  > | null>(null);

  const selectedProduct = setup.product_options.find(
    (product) => product.key === selectedProductKey
  );
  const selectedProductRef = useRef<
    ProductOption | undefined
  >(selectedProduct);
  useEffect(() => {
    selectedProductRef.current = selectedProduct;
  }, [selectedProduct]);

  const actionHandlerRef = useRef<SetupActionHandler>(
    async () => false
  );
  const resetManualFormRef = useRef<() => void>(
    () => undefined
  );

  const productForm = useAppForm({
    defaultValues:
      createFinanceInventoryProductSetupFormDefaults(
        initialData.product_options[0]
      ),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceInventoryProductSetupFormSchema,
    },
    onSubmit: async ({ value }) => {
      const product = selectedProductRef.current;
      if (!product) return;

      const productReference = {
        product_id: product.product_id,
        ...(product.variant_id
          ? { variant_id: product.variant_id }
          : {}),
      };

      if (value.mode === 'existing') {
        await actionHandlerRef.current(
          {
            action: 'map_product',
            ...productReference,
            inventory_item_id: value.inventory_item_id,
          },
          'Produk berhasil dihubungkan ke item stok.'
        );
        return;
      }

      await actionHandlerRef.current(
        {
          action: 'create_from_product',
          ...productReference,
          sku: value.sku.trim(),
          name: value.name.trim(),
          unit: value.unit.trim(),
          track_quantity: value.track_quantity,
          track_value: value.track_value,
        },
        'Item stok dibuat dan dihubungkan ke produk.'
      );
    },
  });

  const manualForm = useAppForm({
    defaultValues:
      createFinanceInventoryManualItemFormDefaults(),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: FinanceInventoryManualItemFormSchema,
    },
    onSubmit: async ({ value }) => {
      const saved = await actionHandlerRef.current(
        {
          action: 'create_manual',
          sku: value.sku.trim(),
          name: value.name.trim(),
          item_type: value.item_type,
          unit: value.unit.trim(),
          track_quantity: value.track_quantity,
          track_value: value.track_value,
        },
        'Item stok manual berhasil dibuat.'
      );
      if (saved) resetManualFormRef.current();
    },
  });
  useEffect(() => {
    resetManualFormRef.current = () => manualForm.reset();
  }, [manualForm]);

  const productSetupMode = useStore(
    productForm.store,
    (state) => state.values.mode
  );

  const setProductFormValues = useCallback(
    (product?: ProductOption) => {
      const values =
        createFinanceInventoryProductSetupFormDefaults(
          product
        );
      productForm.reset();
      productForm.setFieldValue('mode', values.mode);
      productForm.setFieldValue('sku', values.sku);
      productForm.setFieldValue('name', values.name);
      productForm.setFieldValue('unit', values.unit);
      productForm.setFieldValue(
        'inventory_item_id',
        values.inventory_item_id
      );
      productForm.setFieldValue(
        'track_quantity',
        values.track_quantity
      );
      productForm.setFieldValue(
        'track_value',
        values.track_value
      );
    },
    [productForm]
  );

  const refreshSetup = useCallback(
    async (
      nextQuery: FinanceInventorySetupQueryDTO,
      options?: {
        showLoading?: boolean;
        preserveBatchResult?: boolean;
      }
    ): Promise<boolean> => {
      if (options?.preserveBatchResult !== true) {
        setBatchResult(null);
      }
      if (options?.showLoading !== false)
        setIsLoading(true);
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

        const previousSelection =
          setup.product_options.find(
            (product) => product.key === selectedProductKey
          );
        const nextSelection =
          parsed.data.product_options.find(
            (product) => product.key === selectedProductKey
          ) ?? parsed.data.product_options[0];

        if (nextSelection) {
          const selectionChanged =
            nextSelection.key !== selectedProductKey;
          const mappingChanged =
            previousSelection?.mapped_inventory_item?.id !==
            nextSelection.mapped_inventory_item?.id;

          if (selectionChanged) {
            setSelectedProductKey(nextSelection.key);
          }
          if (selectionChanged || mappingChanged) {
            setProductFormValues(nextSelection);
          }
        } else if (selectedProductKey) {
          setSelectedProductKey('');
        }

        setSetup(parsed.data);
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
    },
    [selectedProductKey, setProductFormValues, setup]
  );

  const performAction = useCallback<SetupActionHandler>(
    async (action, success) => {
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
              ? `${error} Gunakan item stok yang sudah ada, atau ubah SKU.`
              : error
          );
          return false;
        }

        setSuccessMessage(success);
        setItemSearch('');
        await refreshSetup(
          { ...query, item_search: undefined },
          { showLoading: false }
        );
        return true;
      } catch {
        setErrorMessage(
          'Perubahan inventory gagal disimpan. Periksa koneksi lalu coba lagi.'
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [query, refreshSetup]
  );
  useEffect(() => {
    actionHandlerRef.current = performAction;
  }, [performAction]);

  const prepareProductsFromCurrentPage = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setBatchResult(null);

    try {
      const response = await fetch(
        '/api/v1/dashboard/finance/inventory/setup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prepare_from_products',
            page: query.page,
            limit: query.limit,
            ...(query.search
              ? { search: query.search }
              : {}),
          }),
        }
      );
      const payload: unknown = await response.json();
      const parsed =
        FinanceInventorySetupActionResponseSchema.safeParse(
          getResponseData(payload)
        );

      if (
        !response.ok ||
        !parsed.success ||
        parsed.data.action !== 'prepare_from_products'
      ) {
        setErrorMessage(
          getResponseError(payload) ??
            'Persiapan stok dari Produk gagal. Coba lagi.'
        );
        return;
      }

      setBatchResult(parsed.data);
      await refreshSetup(
        { ...query, item_search: undefined },
        { showLoading: false, preserveBatchResult: true }
      );
    } catch {
      setErrorMessage(
        'Persiapan stok dari Produk gagal. Periksa koneksi lalu coba lagi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const submitProductSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSuccessMessage(null);
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
    setProductFormValues(product);
    setErrorMessage(null);
    setSuccessMessage(null);
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

  const unmappedProductCount = setup.product_options.filter(
    (product) => !product.mapped_inventory_item
  ).length;

  const reviewReasonLabels: Record<string, string> = {
    missing_sku: 'SKU belum tersedia',
    duplicate_source_sku:
      'SKU dipakai beberapa produk di halaman ini',
    existing_inventory_sku:
      'SKU sudah ada; perlu konfirmasi sebelum digabung',
    source_item_unavailable:
      'Item stok yang pernah dibuat tidak aktif atau tidak sesuai',
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
            Finance / Inventory
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Hubungkan produk dengan stok
          </h1>
          <p className="text-muted-foreground mt-2 leading-7">
            Tentukan item stok untuk setiap produk katalog.
            Produk yang sama di beberapa platform bisa
            memakai satu saldo stok bersama.
          </p>
        </div>
        <Link
          href="/dashboard/finance/inventory/product-and-stock-list"
          className={buttonVariants({
            variant: 'outline',
            className: 'shrink-0',
          })}
        >
          Lihat daftar stok
        </Link>
      </header>

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">Gudang utama</Badge>
        <span>
          {setup.default_location?.name ??
            'Gudang Utama dibuat saat item stok pertama disimpan.'}
        </span>
      </div>

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

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <CardTitle className="text-base">
              Siapkan stok dari Produk
            </CardTitle>
            <CardDescription>
              Buat item stok dan mapping otomatis untuk
              produk yang memiliki SKU unik dan belum
              terhubung. Jumlah stok tidak akan berubah;
              aksi ini hanya memproses produk di halaman
              aktif.
            </CardDescription>
          </div>
          <Button
            type="button"
            disabled={
              isLoading ||
              isSaving ||
              unmappedProductCount === 0
            }
            onClick={() =>
              void prepareProductsFromCurrentPage()
            }
            className="shrink-0"
          >
            {isSaving ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            Siapkan {unmappedProductCount} produk
          </Button>
        </CardHeader>
      </Card>

      {batchResult ? (
        <Alert aria-live="polite">
          <AlertTitle>Hasil persiapan stok</AlertTitle>
          <AlertDescription>
            <p>
              {batchResult.summary.prepared} disiapkan,{' '}
              {batchResult.summary.already_mapped} sudah
              terhubung, dan{' '}
              {batchResult.summary.needs_review} perlu
              ditinjau.
            </p>
            {batchResult.summary.needs_review > 0 ? (
              <ul className="mt-3 grid gap-2">
                {batchResult.results
                  .filter(
                    (result) =>
                      result.status === 'needs_review'
                  )
                  .slice(0, 8)
                  .map((result) => (
                    <li
                      key={`${result.product_id}:${result.variant_id ?? '__product__'}`}
                      className="flex flex-wrap items-center gap-x-2"
                    >
                      <span className="font-medium">
                        {result.product_name}
                        {result.variant_name
                          ? ` — ${result.variant_name}`
                          : ''}
                      </span>
                      <span className="text-muted-foreground">
                        {result.sku
                          ? `SKU ${result.sku} · `
                          : ''}
                        {reviewReasonLabels[
                          result.review_reason ?? ''
                        ] ?? 'Perlu diperiksa'}
                        {result.matched_item
                          ? ` · kandidat: ${result.matched_item.name}`
                          : ''}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
            {batchResult.summary.needs_review > 8 ? (
              <p className="mt-2">
                {batchResult.summary.needs_review - 8}{' '}
                produk lainnya juga perlu ditinjau pada
                daftar di bawah.
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              Langkah 1
            </p>
            <CardTitle>Pilih produk katalog</CardTitle>
            <CardDescription>
              Cari produk atau variasi yang ingin disiapkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-4">
            <form
              onSubmit={submitProductSearch}
              className="flex min-w-0 gap-2"
            >
              <Input
                aria-label="Cari produk katalog"
                value={productSearch}
                onChange={(event) =>
                  setProductSearch(event.target.value)
                }
                placeholder="Cari nama atau SKU…"
                maxLength={100}
                disabled={isSaving}
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading || isSaving}
              >
                {isLoading ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Cari
              </Button>
            </form>

            {setup.product_options.length > 0 ? (
              <div className="grid max-h-[34rem] min-w-0 gap-1 overflow-y-auto pr-1">
                {setup.product_options.map((product) => {
                  const selected =
                    product.key === selectedProductKey;
                  return (
                    <Button
                      key={product.key}
                      type="button"
                      variant={
                        selected ? 'outline' : 'ghost'
                      }
                      aria-pressed={selected}
                      disabled={isLoading || isSaving}
                      onClick={() =>
                        selectProductOption(product)
                      }
                      className={cn(
                        'h-auto w-full min-w-0 justify-between gap-3 p-3 text-left whitespace-normal',
                        selected &&
                          'border-primary bg-primary/5'
                      )}
                    >
                      <span className="grid min-w-0 flex-1 gap-1">
                        <span className="w-full truncate font-medium">
                          {productLabel(product)}
                        </span>
                        <span className="text-muted-foreground flex flex-wrap gap-x-2 text-xs font-normal">
                          <span>
                            {platformLabel(
                              product.platform
                            )}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            SKU:{' '}
                            {product.sku ?? 'belum ada'}
                          </span>
                        </span>
                      </span>
                      {product.mapped_inventory_item ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0"
                        >
                          Terhubung
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="shrink-0"
                        >
                          Belum
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <Empty className="min-h-56 rounded-lg border">
                <EmptyHeader>
                  <EmptyTitle>
                    {query.search
                      ? 'Produk tidak ditemukan'
                      : 'Belum ada produk katalog'}
                  </EmptyTitle>
                  <EmptyDescription>
                    {query.search
                      ? 'Coba kata pencarian atau SKU yang berbeda.'
                      : 'Kamu tetap bisa menambahkan barang non-katalog untuk stok kemasan atau perlengkapan.'}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {query.search ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProductSearch('');
                        void refreshSetup({
                          ...query,
                          page: 1,
                          search: undefined,
                        });
                      }}
                    >
                      Hapus pencarian
                    </Button>
                  ) : null}
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
          <CardFooter className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t text-sm">
            <span>
              Halaman {setup.product_pagination.page} dari{' '}
              {Math.max(
                setup.product_pagination.total_pages,
                1
              )}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  isLoading ||
                  isSaving ||
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
                  isSaving ||
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
            </div>
          </CardFooter>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              Langkah 2
            </p>
            <CardTitle>Siapkan hubungan stok</CardTitle>
            <CardDescription>
              Pilih apakah produk memakai item stok baru
              atau item stok yang sudah dipakai bersama.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-5">
            {selectedProduct ? (
              <>
                {productSetupMode === 'existing' &&
                setup.inventory_item_pagination.total >
                  100 ? (
                  <form
                    onSubmit={submitItemSearch}
                    className="flex min-w-0 gap-2"
                  >
                    <Input
                      aria-label="Cari item stok"
                      value={itemSearch}
                      onChange={(event) =>
                        setItemSearch(event.target.value)
                      }
                      placeholder="Cari SKU atau nama item stok…"
                      maxLength={100}
                      disabled={isSaving}
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isLoading || isSaving}
                    >
                      Cari item
                    </Button>
                  </form>
                ) : null}
                <InventoryProductMappingForm
                  form={productForm}
                  product={selectedProduct}
                  inventoryItems={selectableItems}
                  isSaving={isSaving}
                />
              </>
            ) : (
              <Empty className="min-h-56 rounded-lg border">
                <EmptyHeader>
                  <EmptyTitle>
                    Pilih produk terlebih dahulu
                  </EmptyTitle>
                  <EmptyDescription>
                    Detail hubungan stok akan muncul setelah
                    memilih produk di daftar.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      <Collapsible>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-1">
              <CardTitle className="text-base">
                Barang tanpa produk katalog?
              </CardTitle>
              <CardDescription>
                Tambahkan barang seperti kemasan,
                perlengkapan, atau produk penjualan offline.
              </CardDescription>
            </div>
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                />
              }
            >
              Tambah barang non-katalog
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="border-t pt-5">
              <InventoryManualItemForm
                form={manualForm}
                isSaving={isSaving}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <p className="text-muted-foreground text-sm">
        Menyiapkan item belum menambah saldo stok. Stok awal
        dicatat melalui{' '}
        <Link
          href="/dashboard/finance/onboarding"
          className="text-primary underline underline-offset-4"
        >
          onboarding Finance
        </Link>
        .
      </p>
    </div>
  );
}
