'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { ProductForm } from '@/app/dashboard/products/_components/product.form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { useRouter } from 'next/navigation';
import { formSchema } from '../_components/form.schema';
import {
  ProductResponseDTO,
  ProductResponseSchema,
  UpdateProductSchema,
} from '@/modules/products/product.dto';

type PostData = any; // You can use ZodPostSchema to infer this if preferred

const EditPostPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const [data, setData] = useState<PostData | null>(null);
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
  initialData: PostData;
  id: string;
}) {
  const router = useRouter();

  const formValues = useMemo(() => {
    return {
      id: initialData._id || initialData.id || '',
      platform: initialData.platform || '',
      name: initialData.name || '',
      product_id: String(initialData.product_id || ''),
      variants: (initialData.variants || []).map(
        (variant: any) => ({
          variant_id: variant.variant_id || '',
          name: variant.name || '',
          price: Number(variant.price || 0),
          discount: Number(variant.discount || 0),
          final_price: Number(variant.final_price || 0),
          parent_sku: variant.parent_sku || '',
          sku: variant.sku || '',
          gtin: variant.gtin || '',
          is_default: Boolean(variant.is_default),
          costs: (variant.costs || []).map((cost: any) => ({
            effective_from: cost.effective_from
              ? String(cost.effective_from).substring(0, 10)
              : new Date().toISOString().substring(0, 10),
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
      // onDynamic: UpdateProductSchema,
      // onDynamic: ProductResponseSchema,
      // cast to any to satisfy expected validator type
      onDynamic: formSchema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          platform: value.platform,
          name: value.name,
          product_id: value.product_id,
          variants: value.variants,
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

        toast.success('Product updated successfully', {
          description: `Product "${value.name}" has been updated.`,
        });

        router.push('/dashboard/products');
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
        <ProductForm
          form={form}
          title="Informasi Produk"
          productId={id}
        />
      </div>
    </div>
  );
}

export default EditPostPage;
