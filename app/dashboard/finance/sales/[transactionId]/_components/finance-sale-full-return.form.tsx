/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { FinanceSaleFullReturnFormValues } from './finance-sale-full-return-form.schema';

type FinanceSaleFullReturnFormProps = {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
};

export const FinanceSaleFullReturnForm = withForm({
  defaultValues: {
    effective_date: '',
    description: '',
  } as FinanceSaleFullReturnFormValues,
  props: {
    open: false,
    isSubmitting: false,
    onOpenChange: () => undefined,
  } as FinanceSaleFullReturnFormProps,
  render: function Render({
    form,
    open,
    isSubmitting,
    onOpenChange,
  }) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger
          render={
            <Button variant="outline">
              Proses retur penuh
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Retur seluruh penjualan?
            </DialogTitle>
            <DialogDescription>
              Ini membalik seluruh jurnal penjualan dan HPP,
              lalu mengembalikan seluruh stok yang tercatat
              ke inventory. Hanya gunakan jika seluruh
              transaksi dibatalkan dan barang kembali layak
              dijual. Retur sebagian, barang rusak, atau
              refund tanpa barang kembali belum didukung.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid min-w-0 gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.AppField
              name="effective_date"
              children={(field) => (
                <field.DateField
                  label="Tanggal koreksi"
                  valueType="string"
                  placeholder="Pilih tanggal"
                  required
                  className="min-w-0"
                  buttonClassName="w-full"
                />
              )}
            />
            <form.AppField
              name="description"
              children={(field) => (
                <field.TextareaField
                  label="Alasan retur"
                  required
                  maxLength={450}
                  rows={3}
                  placeholder="Contoh: seluruh pesanan dikembalikan pembeli"
                  className="min-w-0"
                />
              )}
            />
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Kembali
                  </Button>
                }
              />
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Memproses…'
                  : 'Buat reversal penuh'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
});
