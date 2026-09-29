/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { withForm } from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { CashLoanReversalFormValues } from './cash-loan-reversal.form.schema';

type CashLoanReversalFormProps = {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export const CashLoanReversalForm = withForm({
  defaultValues: {
    effective_date: '',
    reason: '',
  } as CashLoanReversalFormValues,
  props: {
    isSubmitting: false,
    onCancel: () => undefined,
    onSubmit: () => undefined,
  } as CashLoanReversalFormProps,
  render: function Render({
    form,
    isSubmitting,
    onCancel,
    onSubmit,
  }) {
    return (
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSubmit();
        }}
      >
        <FieldGroup className="grid gap-4">
          <form.AppField
            name="effective_date"
            children={(field) => (
              <field.DateField
                label="Tanggal pembalikan"
                valueType="string"
                required
                clearable={false}
                buttonClassName="w-full"
              />
            )}
          />
          <form.AppField
            name="reason"
            children={(field) => (
              <field.TextareaField
                label="Alasan pembalikan"
                placeholder="Contoh: transaksi Pinjaman Tunai salah dicatat"
                maxLength={300}
                rows={3}
                required
              />
            )}
          />
        </FieldGroup>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Membalik jurnal…
              </>
            ) : (
              'Buat jurnal pembalik'
            )}
          </Button>
        </div>
      </form>
    );
  },
});
