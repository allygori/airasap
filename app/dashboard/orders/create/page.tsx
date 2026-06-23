'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { revalidateLogic } from '@tanstack/react-form';

import { useAppForm } from '@/components/form/form.hook';
import { OrderForm } from '../_components/form';
import { formSchema } from '../_components/form.schema';

const defaultValues: z.input<typeof formSchema> = {
  order_id: '',
  platform: 'shopee',
  status: '',
  cancellation_return_status: '',
  username: '',
  number_of_products_ordered: 0,
  total_payment: 0,
  payment_method: '',
  paid_at: '',
  order_subtotal: 0,
  total_discount: 0,
  discount_from_seller: 0,
  discount_from_shopee: 0,
  voucher_borne_by_seller: 0,
  voucher_borne_by_shopee: 0,
  coin_cashback: 0,
  bundle_deal: false,
  bundle_deal_discount_from_shopee: 0,
  bundle_deal_discount_from_seller: 0,
  shopee_coin_offset: 0,
  credit_card_discount: 0,
  shipping_option: '',
  estimated_shipping_fee: 0,
  free_shipping_from_shopee: 0,
  shipping_fee_paid_by_buyer: 0,
  shipping_fee_discount_by_logistics: 0,
  shipping_fee_forwarded_by_shopee: 0,
  estimated_shipping_fee_discount: 0,
  product_weight: 0,
  total_weight: 0,
  receiver_name: '',
  phone_number: '',
  buyer_note: '',
  note: '',
  free_shipping_promo_from_seller: 0,
  compensation: 0,
  released_amount: 0,
  net_amount: 0,
  shipping_arranged_at: '',
  order_created_at: '',
  order_released_at: '',
  order_completed_at: '',
  address: {
    street: '',
    city: '',
    province: '',
  },
  fee: {
    admin_fee: 0,
    processing_fee: 0,
    affiliate_fee: 0,
    service_fee: 0,
    shipping_saver_program_fee: 0,
    transaction_fee: 0,
    campaign_fee: 0,
    auto_top_up_fee_from_income: 0,
    return_shipping_fee: 0,
    return_to_sender_shipping_fee: 0,
    shipping_fee_refund: 0,
  },
  items: [],
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
        const response = await fetch(
          '/api/v1/dashboard/orders',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(value),
          }
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || 'Gagal menyimpan order'
          );
        }

        toast.success('Order created successfully');
        router.push('/dashboard/orders');
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Gagal membuat order';
        toast.error(message);
      }
    },
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="mb-1 text-xl font-semibold">
            Tambah Order Baru
          </h2>
          <p className="text-muted-foreground text-sm font-normal">
            Masukkan informasi order baru.
          </p>
        </div>
        <OrderForm form={form} title="Form Order Baru" />
      </div>
    </div>
  );
};

export default CreatePage;
