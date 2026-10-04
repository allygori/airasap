/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createEmptyFinanceOpeningBalanceFormValues } from './finance-opening-balance.utils';
import {
  OpeningBalancePreview,
  SectionHeading,
} from './finance-opening-balance.shared';
import type { FinanceOpeningBalanceFormProps } from '../../finance-opening-balance.form';

type Props = Pick<
  FinanceOpeningBalanceFormProps,
  | 'isSaving'
  | 'isPreviewing'
  | 'isFinalizing'
  | 'isFinalized'
  | 'preview'
  | 'confirmed'
  | 'onConfirmedChange'
  | 'onPreview'
  | 'onFinalize'
> & { isBusy: boolean };

export const FinanceOpeningBalanceReviewStep = withForm({
  defaultValues:
    createEmptyFinanceOpeningBalanceFormValues(),
  props: {
    isBusy: false,
    isSaving: false,
    isPreviewing: false,
    isFinalizing: false,
    isFinalized: false,
    preview: null,
    confirmed: false,
    onConfirmedChange: () => undefined,
    onPreview: () => undefined,
    onFinalize: () => undefined,
  } as Props,
  render: function Render({
    isBusy,
    isSaving,
    isPreviewing,
    isFinalizing,
    isFinalized,
    preview,
    confirmed,
    onConfirmedChange,
    onPreview,
    onFinalize,
  }) {
    return (
      <div className="grid min-w-0 gap-5">
        <SectionHeading
          title="Periksa sebelum Finance diaktifkan"
          description="Preview akan menampilkan jurnal dan pergerakan stok yang dibuat dari saldo awal ini."
        />

        <Alert>
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertDescription>
            Saldo awal adalah snapshot pada tanggal yang
            dipilih. Order lama tidak otomatis diposting
            menjadi jurnal.
          </AlertDescription>
        </Alert>

        {!preview ? (
          <Button
            type="button"
            onClick={onPreview}
            disabled={isBusy}
          >
            {isSaving
              ? 'Menyimpan draft…'
              : isPreviewing
                ? 'Memvalidasi…'
                : 'Lihat preview'}
          </Button>
        ) : (
          <OpeningBalancePreview
            preview={preview}
            confirmed={confirmed}
            onConfirmedChange={onConfirmedChange}
            onFinalize={onFinalize}
            isFinalizing={isFinalizing}
            isFinalized={isFinalized}
          />
        )}
      </div>
    );
  },
});
