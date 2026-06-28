'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { revalidateLogic } from '@tanstack/react-form';

import { useAppForm } from '@/components/form/form.hook';
import { ProductForm } from '@/app/dashboard/products/_components/product.form';
// import { TagType } from '@/components/blog/types';
import { formSchema } from '../_components/form.schema';

const defaultValues: z.input<typeof formSchema> = {
  id: '',
  platform: '',
  name: '',
  product_id: '',
  variants: [],
};

const CreatePage = () => {
  const router = useRouter();

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
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
          is_active: true,
        };

        const response = await fetch(
          '/api/v1/dashboard/products',
          {
            method: 'POST',
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

        toast.success('Product created successfully', {
          description: `Product "${value.name}" has been created.`,
        });

        router.push('/dashboard/products');
        router.refresh();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal membuat produk';
        console.error('Create product error:', error);
        toast.error(message);
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 font-semibold">
            Create New Product
          </h2>
          <p className="text-muted-foreground text-sm font-normal">
            Add a new product to your store catalog.
          </p>
        </div>
        <ProductForm form={form} />
      </div>
    </div>
  );
};

export default CreatePage;
