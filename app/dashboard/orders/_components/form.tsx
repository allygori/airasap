'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { withForm } from '@/components/form/form.hook';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { formSchema } from './form.schema';
import { PLATFORMS } from '@/lib/db/constant';
import { AddressFields } from './address-fields';
import { FeeFields } from './fee-fields';
import { OrderItemsSection } from './order-items-section';

type OrderFormProps = {
  title?: string;
};

export const OrderForm = withForm({
  defaultValues: {
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
  } as unknown as z.input<typeof formSchema>,
  props: {
    title: undefined,
  } as OrderFormProps,
  render: function Render({ form }) {
    const router = useRouter();
    const [showDiscardDialog, setShowDiscardDialog] =
      useState(false);

    const handleBackClick = () => {
      if (form.state.isDirty) {
        setShowDiscardDialog(true);
      } else {
        router.push('/dashboard/orders');
      }
    };

    const confirmDiscard = () => {
      setShowDiscardDialog(false);
      router.push('/dashboard/orders');
    };

    return (
      <>
        <form
          id="order-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="relative flex w-full flex-col gap-6"
        >
          {/* SECTION 1: Informasi Utama Order */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Informasi Utama Order
              </CardTitle>
              <CardDescription>
                Rincian dasar order dari platform
                marketplace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <form.AppField
                  name="order_id"
                  children={(field) => (
                    <field.TextField
                      label="Order ID"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="platform"
                  children={(field) => (
                    <field.SelectField
                      label="Platform"
                      multiple={false}
                      items={PLATFORMS.map((p) => ({
                        label: p.toUpperCase(),
                        value: p,
                      }))}
                    />
                  )}
                />

                <form.AppField
                  name="status"
                  children={(field) => (
                    <field.TextField
                      label="Status Order"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="cancellation_return_status"
                  children={(field) => (
                    <field.TextField
                      label="Status Pembatalan / Return"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="username"
                  children={(field) => (
                    <field.TextField
                      label="Username Pembeli"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="note"
                  children={(field) => (
                    <field.TextField
                      label="Catatan Internal"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <div className="md:col-span-3">
                  <form.AppField
                    name="buyer_note"
                    children={(field) => (
                      <field.TextareaField
                        label="Catatan Pembeli"
                        value={field.state.value ?? ''}
                        onChange={(e) =>
                          field.handleChange(e.target.value)
                        }
                      />
                    )}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* SECTION 2: Pengiriman & Logistik */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Pengiriman & Penerima
              </CardTitle>
              <CardDescription>
                Rincian informasi pengiriman, nama penerima,
                berat, dan opsi kurir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <form.AppField
                  name="receiver_name"
                  children={(field) => (
                    <field.TextField
                      label="Nama Penerima"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="phone_number"
                  children={(field) => (
                    <field.TextField
                      label="Nomor Telepon"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="shipping_option"
                  children={(field) => (
                    <field.TextField
                      label="Opsi Pengiriman (Kurir)"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="product_weight"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Berat Produk (kg)"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="total_weight"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Total Berat (kg)"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="shipping_arranged_at"
                  children={(field) => (
                    <field.TextField
                      label="Tanggal Pengiriman Diatur"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="order_created_at"
                  children={(field) => (
                    <field.TextField
                      label="Tanggal Dibuat"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="order_released_at"
                  children={(field) => (
                    <field.TextField
                      label="Tanggal Dana Dilepas"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="order_completed_at"
                  children={(field) => (
                    <field.TextField
                      label="Tanggal Selesai"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* SECTION 3: Alamat Pengiriman */}
          <AddressFields form={form} />

          {/* SECTION 4: Pembayaran & Finansial */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Pembayaran & Finansial
              </CardTitle>
              <CardDescription>
                Detail transaksi, metode pembayaran,
                potongan/diskon, dan dana neto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <form.AppField
                  name="payment_method"
                  children={(field) => (
                    <field.TextField
                      label="Metode Pembayaran"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="paid_at"
                  children={(field) => (
                    <field.TextField
                      label="Tanggal Pembayaran"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value)
                      }
                    />
                  )}
                />

                <form.AppField
                  name="number_of_products_ordered"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Jumlah Produk Dipesan"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="total_payment"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Total Pembayaran"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="order_subtotal"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Subtotal Order"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="total_discount"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Total Diskon"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="discount_from_seller"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Diskon dari Penjual"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="discount_from_shopee"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Diskon dari Shopee"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="voucher_borne_by_seller"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Voucher Ditanggung Penjual"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="voucher_borne_by_shopee"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Voucher Ditanggung Shopee"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="coin_cashback"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Coin Cashback"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="bundle_deal"
                  children={(field) => (
                    <field.SelectField
                      label="Bundle Deal"
                      multiple={false}
                      items={[
                        { label: 'Ya', value: true },
                        { label: 'Tidak', value: false },
                      ]}
                    />
                  )}
                />

                <form.AppField
                  name="bundle_deal_discount_from_shopee"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Diskon Bundle dari Shopee"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="bundle_deal_discount_from_seller"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Diskon Bundle dari Penjual"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="shopee_coin_offset"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Koin Shopee yang Digunakan"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="credit_card_discount"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Diskon Kartu Kredit"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="released_amount"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Dana Dilepas (Released Amount)"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="net_amount"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Dana Neto (Net Amount)"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* SECTION 5: Rincian Pengiriman & Diskon Tambahan */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Rincian Pengiriman & Diskon
              </CardTitle>
              <CardDescription>
                Biaya ongkir, promo gratis ongkir, dan
                kompensasi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <form.AppField
                  name="estimated_shipping_fee"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Estimasi Ongkir"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="free_shipping_from_shopee"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Gratis Ongkir dari Shopee"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="shipping_fee_paid_by_buyer"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Ongkir Dibayar Pembeli"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="shipping_fee_discount_by_logistics"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Diskon Ongkir oleh Logistik"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="shipping_fee_forwarded_by_shopee"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Ongkir Diteruskan oleh Shopee"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="estimated_shipping_fee_discount"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Estimasi Diskon Ongkir"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="free_shipping_promo_from_seller"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Promo Gratis Ongkir dari Penjual"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />

                <form.AppField
                  name="compensation"
                  children={(field) => (
                    <field.TextField
                      type="number"
                      label="Kompensasi"
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* SECTION 6: Rincian Biaya (Fees) */}
          <FeeFields form={form} />

          {/* SECTION 7: Daftar Produk (Items) */}
          <OrderItemsSection form={form} />

          {/* STICKY FOOTER */}
          {/* <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-6 border-t bg-background/95 p-4 shadow-lg backdrop-blur-xs md:-mx-6 md:-mb-6 flex justify-between items-center rounded-b-lg"> */}
          <div className="bg-background/95 mt-6 flex w-full flex-row items-center justify-end justify-items-end gap-6 overflow-hidden rounded-b-lg border-t p-4 shadow-lg backdrop-blur-xs">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>

            <div className="w-4/12">
              <form.AppForm>
                <form.SubmitButton text="Simpan Order" />
              </form.AppForm>
            </div>
          </div>
        </form>

        {/* DISCARD CHANGES DIALOG */}
        <Dialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buang Perubahan?</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin membuang perubahan?
                Semua perubahan yang belum disimpan akan
                hilang.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDiscardDialog(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDiscard}
              >
                Ya, Buang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
});
