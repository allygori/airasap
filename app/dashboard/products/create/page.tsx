'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { revalidateLogic } from '@tanstack/react-form';

import { useAppForm } from '@/components/form/form.hook';
import { ProductForm } from '@/app/dashboard/products/_components/product.form';
// import { TagType } from '@/components/blog/types';
import { INITIAL_BLOCK_VALUE } from '../_components/form.constant';
import { formSchema } from '../_components/form.schema';

const defaultValues: z.input<typeof formSchema> = {
  id: '',
  platform: '',
  name: '',
  product_id: undefined,
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
      // Logic for saving product goes here
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
