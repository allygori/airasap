/* eslint-disable react/no-children-prop -- TanStack AppField uses the project's render-prop children API. */
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  useAppForm,
  withForm,
} from '@/components/form/form.hook';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { buildFinanceFilterHref } from '@/app/dashboard/finance/_lib/finance-filter-url';

type FinanceReportPeriodValues = {
  period: string;
};

const FinanceReportPeriodFields = withForm({
  defaultValues: {
    period: '',
  } as FinanceReportPeriodValues,
  render: function Render({ form }) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FieldGroup className="contents">
          <form.AppField
            name="period"
            children={(field) => (
              <field.TextField
                label="Periode laporan"
                type="month"
                required
                className="min-w-0 sm:w-48"
              />
            )}
          />
          <Button type="submit" variant="secondary">
            Tampilkan
          </Button>
        </FieldGroup>
      </form>
    );
  },
});

export function FinanceReportPeriodForm({
  period,
}: FinanceReportPeriodValues) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useAppForm({
    defaultValues: { period },
    onSubmit: async ({ value }) => {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value.period)) {
        return;
      }
      router.push(
        buildFinanceFilterHref(pathname, {
          period: value.period,
        })
      );
    },
  });

  return <FinanceReportPeriodFields form={form} />;
}
