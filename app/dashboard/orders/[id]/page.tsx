'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { OrderForm } from '@/app/dashboard/products/_components/form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { useRouter } from 'next/navigation';
import { INITIAL_BLOCK_VALUE } from '../_components/form.constant';
// import { TagType } from '@/components/blog/types';
import { formSchema } from '../_components/form.schema';
import { OrderResponseDTO } from '@/modules/orders/order.dto';

// type OrderData = any; // You can use ZodPostSchema to infer this if preferred
type OrderData = OrderResponseDTO;

const EditPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/v1/dashboard/orders/${id}`
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
            Memuat data order...
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
            Order tidak ditemukan
          </h3>
          <p className="text-muted-foreground">
            ID order mungkin salah atau telah dihapus.
          </p>
        </div>
      </div>
    );
  }

  return <EditFormWrapper initialData={data} id={id} />;
};

function EditFormWrapper({
  initialData,
  id,
}: {
  initialData: OrderData;
  id: string;
}) {
  const router = useRouter();

  const formValues = useMemo(() => {
    return {
      id: initialData._id || initialData.id || '',
      platform: initialData.platform || '',
      name: initialData.name || '',
      product_id: initialData.product_id,
      variants: initialData.variants || [],
    };
  }, [initialData]);

  const form = useAppForm({
    defaultValues: formValues as z.input<typeof formSchema>,
    validators: {
      onDynamic: formSchema,
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
          `/api/v1/dashboard/orders/${id}`,
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
              'Terjadi kesalahan saat menyimpan order'
          );
        }

        toast.success('Order updated successfully', {
          description: `Order "${value.name}" has been updated.`,
        });

        router.push('/dashboard/orders');
        router.refresh();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui order';
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
            Edit Order
          </h2>
          <p className="text-muted-foreground text-sm font-normal">
            Ubah rincian order:{' '}
            <span className="text-foreground font-medium">
              {productName || initialData.name}
            </span>
          </p>
        </div>
        <OrderForm form={form} title="Informasi Order" />
      </div>
    </div>
  );
}

export default EditPage;
