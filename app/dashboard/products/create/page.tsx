'use client';

import {
  revalidateLogic,
  standardSchemaValidators,
} from '@tanstack/react-form';
import type { FormValidateFn } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppForm } from '@/components/form/form.hook';
import { ProductForm } from '@/app/dashboard/products/_components/product.form';
import {
  ProductResponseSchema,
  ProductResponseDTO,
} from '@/modules/products/product.dto';

const defaultVariant: NonNullable<
  ProductResponseDTO['variants']
>[number] = {
  variant_id: '',
  name: '',
  name_history: [],
  child_sku: '',
  gtin: '',
  is_native: true,
  price: 0,
  discount: 0,
  final_price: 0,
  is_default: true,
  costs: [],
  default_cost: 0,
};

const defaultValues: ProductResponseDTO = {
  id: '',
  platform: undefined,
  name: '',
  name_history: [],
  product_id: '',
  parent_sku: '',
  has_variation: false,
  variants: [defaultVariant],
  options: [],
  is_active: true,
  _id: '',
  needs_review: false,
  review_issues: [],
};

const CreateProductFormSchema =
  ProductResponseSchema.refine(
    (product) => Boolean(product.platform),
    {
      path: ['platform'],
      message: 'Platform wajib dipilih',
    }
  ).refine(
    (product) => (product.variants ?? []).length > 0,
    {
      path: ['variants'],
      message: 'Produk memerlukan satu varian default.',
    }
  );
const createProductFormValidator: FormValidateFn<
  ProductResponseDTO
> = ({ value }) =>
  standardSchemaValidators.validate(
    { value, validationSource: 'form' },
    CreateProductFormSchema
  );

function getCreateErrorMessage(payload: unknown) {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('error' in payload) ||
    typeof payload.error !== 'object' ||
    payload.error === null ||
    !('message' in payload.error) ||
    typeof payload.error.message !== 'string'
  ) {
    return 'Gagal membuat produk';
  }

  return payload.error.message;
}

export default function CreateProductPage() {
  const router = useRouter();

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: createProductFormValidator,
    },
    onSubmit: async ({ value }) => {
      const variants = value.variants ?? [];
      const hasVariation = variants.length > 1;
      const variantsForCreate = variants.map((variant) =>
        hasVariation
          ? variant
          : { ...variant, variant_id: value.product_id }
      );
      const payload = {
        platform: value.platform,
        name: value.name,
        name_history: value.name_history,
        product_id: value.product_id,
        parent_sku: value.parent_sku,
        has_variation: hasVariation,
        options: value.options,
        variants: variantsForCreate,
        is_active: value.is_active,
      };

      try {
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
        const result: unknown = await response.json();

        if (!response.ok) {
          throw new Error(getCreateErrorMessage(result));
        }

        toast.success('Produk berhasil dibuat');
        router.push('/dashboard/products');
        router.refresh();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal membuat produk';
        toast.error(message);
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Tambah Produk Baru
          </h2>
          <p className="text-muted-foreground text-sm font-normal">
            Masukkan identitas produk dan data variannya.
          </p>
        </div>
        <ProductForm form={form} mode="create" />
      </div>
    </div>
  );
}
