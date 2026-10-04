/* eslint-disable react/no-children-prop -- withForm uses the project's AppField render API. */
'use client';

import { useStore } from '@tanstack/react-form';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { withForm } from '@/components/form/form.hook';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { FINANCE_CALENDAR_TIMEZONE_OPTIONS } from '@/modules/finance/client';
import {
  createEmptyFinanceOpeningBalanceFormValues,
  getTodayDateInputValue,
} from './finance-opening-balance.utils';
import { ModeOption } from './finance-opening-balance.shared';
import type { FinanceOpeningBalanceFormProps } from '../../finance-opening-balance.form';

type Props = Pick<
  FinanceOpeningBalanceFormProps,
  'onModeChange'
>;

export const FinanceOpeningBalanceStartStep = withForm({
  defaultValues:
    createEmptyFinanceOpeningBalanceFormValues(),
  props: { onModeChange: () => undefined } as Props,
  render: function Render({ form, onModeChange }) {
    const values = useStore(
      form.store,
      (state) => state.values
    );

    return (
      <div className="grid min-w-0 gap-6">
        <div className="grid min-w-0 gap-5 md:grid-cols-[14rem_minmax(14rem,1fr)]">
          <form.AppField
            name="cut_off_date"
            children={(field) => (
              <field.DateField
                label="Tanggal saldo awal"
                description="Tanggal yang menggambarkan kondisi saldo dan stok yang Anda masukkan."
                valueType="string"
                required
                clearable={false}
                className="min-w-0"
                buttonClassName="w-full"
                calendarProps={{
                  disabled: { after: new Date() },
                }}
              />
            )}
          />
          <form.AppField
            name="calendar_timezone"
            children={(field) => (
              <field.SelectField
                label="Zona waktu kalender Finance"
                description="Menentukan bulan untuk periode dan laporan Finance."
                placeholder="Pilih zona waktu"
                items={FINANCE_CALENDAR_TIMEZONE_OPTIONS.map(
                  (option) => ({
                    label: option.label,
                    value: option.value,
                  })
                )}
                className="min-w-0"
              />
            )}
          />
        </div>
        <div className="grid min-w-0 gap-5">
          <form.AppField
            name="description"
            children={(field) => (
              <field.TextField
                label="Catatan (opsional)"
                placeholder="Contoh: Saldo awal saat mulai memakai Finance"
                maxLength={240}
                className="min-w-0"
              />
            )}
          />
        </div>

        {values.cut_off_date &&
        values.cut_off_date <
          getTodayDateInputValue(
            values.calendar_timezone
          ) ? (
          <Alert className="border-warning/40 bg-warning/5">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertDescription>
              Tanggal lampau diperbolehkan. Order lama tidak
              otomatis dicatat sebagai jurnal Finance;
              pastikan saldo awal tidak menghitung transaksi
              yang sama dua kali.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <ModeOption
            active={values.mode === 'entered'}
            title="Masukkan saldo awal"
            description="Catat saldo yang memang sudah dimiliki bisnis pada tanggal tersebut."
            onClick={() => {
              form.setFieldValue('mode', 'entered');
              onModeChange('entered');
            }}
          />
          <ModeOption
            active={values.mode === 'zero'}
            title="Mulai dari nol"
            description="Aktifkan Finance tanpa jurnal atau stok awal."
            onClick={() => {
              form.setFieldValue('mode', 'zero');
              onModeChange('zero');
            }}
          />
        </div>

        <Alert>
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertDescription>
            Finance tidak mengubah Orders, Products, atau
            Reports. Order lama juga tidak otomatis
            diposting saat onboarding.
          </AlertDescription>
        </Alert>
      </div>
    );
  },
});
