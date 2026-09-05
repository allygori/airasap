'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { OrderForm } from '../_components/order.form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAppForm } from '@/components/form/form.hook';
import { useRouter } from 'next/navigation';
import { OrderFormSchema } from '@/modules/orders/order.schema';
import { OrderResponseDTO } from '@/modules/orders/order.dto';

// type OrderData = OrderResponseDTO;

const EditPage = ({
  params,
}: {
  params: Promise<{ order_id: string }>;
}) => {
  const { order_id } = use(params);
  const [data, setData] = useState<OrderResponseDTO | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/v1/dashboard/orders/marketplace/${order_id}?populate=items.product`
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
  }, [order_id]);

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

  return (
    <EditFormWrapper
      initialData={data}
      orderId={order_id}
    />
  );
};

function EditFormWrapper({
  orderId,
  initialData,
}: {
  orderId: string;
  initialData: OrderResponseDTO;
}) {
  const router = useRouter();

  const formValues = useMemo(() => {
    return {
      _id: initialData._id || '',
      order_id: initialData.order_id || '',
      platform: initialData.platform || 'shopee',
      status: initialData.status || '',
      cancellation_return_status:
        initialData.cancellation_return_status || '',
      username: initialData.username || '',
      number_of_products_ordered:
        initialData.number_of_products_ordered ?? 0,
      total_payment: initialData.total_payment ?? 0,
      payment_method: initialData.payment_method || '',
      paid_at: initialData.paid_at || '',
      order_subtotal: initialData.order_subtotal ?? 0,
      total_discount: initialData.total_discount ?? 0,
      discount_from_seller:
        initialData.discount_from_seller ?? 0,
      discount_from_shopee:
        initialData.discount_from_shopee ?? 0,
      voucher_borne_by_seller:
        initialData.voucher_borne_by_seller ?? 0,
      voucher_borne_by_shopee:
        initialData.voucher_borne_by_shopee ?? 0,
      coin_cashback: initialData.coin_cashback ?? 0,
      bundle_deal: !!initialData.bundle_deal,
      bundle_deal_discount_from_shopee:
        initialData.bundle_deal_discount_from_shopee ?? 0,
      bundle_deal_discount_from_seller:
        initialData.bundle_deal_discount_from_seller ?? 0,
      shopee_coin_offset:
        initialData.shopee_coin_offset ?? 0,
      credit_card_discount:
        initialData.credit_card_discount ?? 0,
      shipping_option: initialData.shipping_option || '',
      estimated_shipping_cost:
        initialData.estimated_shipping_cost ?? 0,
      free_shipping_from_shopee:
        initialData.free_shipping_from_shopee ?? 0,
      shipping_cost_paid_by_buyer:
        initialData.shipping_cost_paid_by_buyer ?? 0,
      shipping_cost_discount_by_logistics:
        initialData.shipping_cost_discount_by_logistics ??
        0,
      shipping_cost_forwarded_by_shopee:
        initialData.shipping_cost_forwarded_by_shopee ?? 0,
      estimated_shipping_cost_discount:
        initialData.estimated_shipping_cost_discount ?? 0,
      product_weight: initialData.product_weight ?? 0,
      total_weight: initialData.total_weight ?? 0,
      receiver_name: initialData.receiver_name || '',
      phone_number: initialData.phone_number || '',
      buyer_note: initialData.buyer_note || '',
      note: initialData.note || '',
      free_shipping_promo_from_seller:
        initialData.free_shipping_promo_from_seller ?? 0,
      compensation: initialData.compensation ?? 0,
      released_funds: initialData.released_funds ?? 0,
      // net_amount: initialData.net_amount ?? 0,
      shipping_arranged_at:
        initialData.shipping_arranged_at || '',
      placed_at: initialData.placed_at || '',
      released_funds_at:
        initialData.released_funds_at || '',
      completed_at: initialData.completed_at || '',
      address: {
        street: initialData.address?.street || '',
        city: initialData.address?.city || '',
        province: initialData.address?.province || '',
      },
      fee: {
        admin_fee: initialData.fee?.admin_fee ?? 0,
        processing_fee:
          initialData.fee?.processing_fee ?? 0,
        affiliate_fee: initialData.fee?.affiliate_fee ?? 0,
        gox_fee: initialData.fee?.gox_fee ?? 0,
        service_fee: initialData.fee?.service_fee ?? 0,
        shipping_saver_program_fee:
          initialData.fee?.shipping_saver_program_fee ?? 0,
        transaction_fee:
          initialData.fee?.transaction_fee ?? 0,
        campaign_fee: initialData.fee?.campaign_fee ?? 0,
        other_fee: initialData.fee?.other_fee ?? 0,
        premium_fee: initialData.fee?.premium_fee ?? 0,
        fbs_fee: initialData.fee?.fbs_fee ?? 0,
        tax_pph22: initialData.fee?.tax_pph22 ?? 0,
        import_duty_vat_income_tax:
          initialData.fee?.import_duty_vat_income_tax ?? 0,
        auto_top_up_fee_from_income:
          initialData.fee?.auto_top_up_fee_from_income ?? 0,
        return_shipping_fee:
          initialData.fee?.return_shipping_fee ?? 0,
        return_to_sender_shipping_fee:
          initialData.fee?.return_to_sender_shipping_fee ??
          0,
        shipping_fee_refund:
          initialData.fee?.shipping_fee_refund ?? 0,
      },
      items: (initialData.items || []).map((item: any) => ({
        product: item.product || '',
        parent_sku: item.parent_sku || '',
        child_sku: item.child_sku || '',
        product_name: item.product_name || '',
        variation_name: item.variation_name || '',
        product_key: item.product_key || '',
        original_price: item.original_price ?? 0,
        price_after_discount:
          item.price_after_discount ?? 0,
        quantity: item.quantity ?? 1,
        returned_quantity: item.returned_quantity ?? 0,
        processing_fee: item.processing_fee ?? 0,
        product_cost: item.product_cost ?? 0,
        profit: item.profit ?? 0,
        // estimated_profit: item.estimated_profit ?? 0,
        // product_cost_amount: item.product_cost_amount ?? 0,
      })),
      enrichments: [],
      other_variable_cost: [],
    } satisfies OrderResponseDTO;
  }, [initialData]);

  const form = useAppForm({
    defaultValues: formValues as z.input<
      typeof OrderFormSchema
    >,
    validators: {
      onDynamic: OrderFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        // const { _id, ...payload } = value;

        // console.log({
        //   _id,
        //   id: payload.id,
        //   order_id: payload.order_id,
        // });

        const payload = {
          ...value,
          items: (value.items || []).map((item: any) => ({
            ...item,
            product:
              typeof item.product === 'object'
                ? item.product?._id || undefined
                : item.product || undefined,
          })),
        };
        const response = await fetch(
          `/api/v1/dashboard/orders/${payload._id}/overwrite`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        console.log('response', response);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error?.message ||
              'Terjadi kesalahan saat menyimpan order'
          );
        }

        toast.success('Order updated successfully', {
          description: `Order "${value.order_id}" has been updated.`,
        });

        // router.push('/dashboard/orders');
        router.back();
        router.refresh();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal memperbarui order';
        console.error('Update order error:', error);
        toast.error(message);
      }
    },
  });

  const orderIdVal = form.getFieldValue('order_id');

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
              {orderIdVal || initialData.order_id}
            </span>
          </p>
        </div>
        <OrderForm form={form} title="Informasi Order" />
      </div>
    </div>
  );
}

export default EditPage;
