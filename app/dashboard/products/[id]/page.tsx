'use client';

import {
  use,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { ProductForm } from '@/app/dashboard/products/_components/product.form';
import { toast } from 'sonner';
import { useAppForm } from '@/components/form/form.hook';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatIDR } from '@/lib/number/money';
// import { formSchema } from '../_components/form.schema';
import {
  ProductResponseSchema,
  ProductResponseDTO,
  UpdateProductSchema,
  UpdateProductDTO,
} from '@/modules/products/product.dto';

const EditProductPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const [data, setData] =
    useState<ProductResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/v1/dashboard/products/${id}`
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.message || 'Gagal mengambil data'
          );
        setData(result.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-100 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse font-medium">
            Memuat data produk...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-100 flex-1 items-center justify-center">
        <div className="text-center">
          <h3 className="text-destructive text-lg font-semibold">
            Produk tidak ditemukan
          </h3>
          <p className="text-muted-foreground">
            ID produk mungkin salah atau telah dihapus.
          </p>
        </div>
      </div>
    );
  }

  return <EditPostFormWrapper initialData={data} id={id} />;
};

function EditPostFormWrapper({
  initialData,
  id,
}: {
  initialData: ProductResponseDTO;
  id: string;
}) {
  const router = useRouter();
  const markReviewedAfterSave = useRef(false);

  const formValues = useMemo(() => {
    return {
      id: initialData._id || initialData.id || '',
      platform: initialData.platform || '',
      name: initialData.name || '',
      name_history: initialData.name_history || [],
      product_id: String(initialData.product_id || ''),
      parent_sku: String(initialData.parent_sku || ''),
      options: initialData.options || [],
      needs_review: initialData.needs_review,
      review_issues: initialData.review_issues,
      variants: (initialData.variants || []).map(
        (variant: any) => ({
          variant_id: variant.variant_id || '',
          name: variant.name || '',
          name_history: variant.name_history || [],
          price: Number(variant.price || 0),
          discount: Number(variant.discount || 0),
          final_price: Number(variant.final_price || 0),
          parent_sku: variant.parent_sku || '',
          child_sku: variant.child_sku || '',
          gtin: variant.gtin || '',
          is_native: variant.is_native ?? true,
          is_default: Boolean(variant.is_default),
          costs: (variant.costs || []).map((cost: any) => ({
            effective_from: cost.effective_from
              ? new Date(cost.effective_from).toISOString()
              : null,
            cogs_unit: Number(cost.cogs_unit || 0),
            notes: cost.notes || '',
          })),
          default_cost: Number(variant.default_cost) || 0,
        })
      ),
    };
  }, [initialData]);

  const form = useAppForm({
    defaultValues:
      formValues as unknown as ProductResponseDTO,
    validators: {
      onDynamic: UpdateProductSchema as any,
      // onDynamic: ProductResponseSchema,
      // cast to any to satisfy expected validator type
      // onDynamic: formSchema as any,
    },
    onSubmit: async ({ value }) => {
      const shouldMarkReviewed =
        markReviewedAfterSave.current;
      try {
        const payload = {
          platform: value.platform,
          name: value.name,
          name_history: value.name_history,
          product_id: value.product_id,
          variants: value.variants,
          options: value.options,
        };

        const response = await fetch(
          `/api/v1/dashboard/products/${id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error?.message ||
              'Terjadi kesalahan saat menyimpan produk'
          );
        }

        if (shouldMarkReviewed) {
          const reviewResponse = await fetch(
            `/api/v1/dashboard/products/${id}/review`,
            { method: 'POST' }
          );
          const reviewResult = await reviewResponse.json();

          if (!reviewResponse.ok) {
            throw new Error(
              reviewResult.error?.message ||
                'Gagal menandai produk sudah ditinjau'
            );
          }
        }

        toast.success(
          shouldMarkReviewed
            ? 'HPP berhasil ditinjau'
            : 'Product updated successfully',
          {
            description: shouldMarkReviewed
              ? `Perubahan produk "${value.name}" disimpan dan status review diselesaikan.`
              : `Product "${value.name}" has been updated.`,
          }
        );

        // router.push('/dashboard/products');
        router.back();
        router.refresh();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui produk';
        console.error('Update product error:', error);
        toast.error(message);
      }
    },
  });

  const handleSaveAndMarkReviewed = () => {
    markReviewedAfterSave.current = true;
    void form.handleSubmit().finally(() => {
      markReviewedAfterSave.current = false;
    });
  };

  const productName = form.getFieldValue('name');

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Edit Product
          </h2>
          <p className="text-muted-foreground text-sm font-normal">
            Ubah rincian produk:{' '}
            <span className="text-foreground font-medium">
              {productName || initialData.name}
            </span>
          </p>
        </div>
        {initialData.needs_review && (
          <Card
            role="status"
            className="border-warning/50 bg-warning/5"
          >
            <CardHeader>
              <CardTitle className="text-warning flex items-center gap-2">
                <AlertTriangle className="size-5" />
                Perlu ditinjau: konflik HPP saat varian
                digabung
              </CardTitle>
              <CardDescription>
                HPP aktif diisi 0 karena data varian lama
                memiliki nilai yang berbeda. Periksa nilai
                sebelumnya di bawah, lalu pilih HPP yang
                benar pada form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {(initialData.review_issues ?? []).flatMap(
                  (issue) =>
                    issue.candidates.map((candidate) => (
                      <li
                        key={`${issue.code}-${candidate.variant_id}`}
                        className="text-muted-foreground"
                      >
                        <span className="text-foreground font-medium">
                          {candidate.name ||
                            candidate.variant_id}
                        </span>
                        {' — HPP sebelumnya: '}
                        {candidate.default_cost === null
                          ? 'belum diatur'
                          : formatIDR(
                              candidate.default_cost
                            )}
                        {candidate.effective_from && (
                          <span>
                            {' · mulai berlaku '}
                            {new Date(
                              candidate.effective_from
                            ).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </li>
                    ))
                )}
              </ul>
            </CardContent>
          </Card>
        )}
        <ProductForm
          form={form}
          title="Informasi Produk"
          productId={id}
          needsReview={initialData.needs_review}
          onSaveAndMarkReviewed={handleSaveAndMarkReviewed}
        />
      </div>
    </div>
  );
}

export default EditProductPage;
