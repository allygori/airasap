'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZapIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  revalidateLogic,
  useStore,
} from '@tanstack/react-form';
import { useAppForm } from '@/components/form/form.hook';
import {
  ReportFormSchema,
  type ReportFormInput,
} from './report.schema';
// import { FieldGroup } from '@/components/ui/field';
import { Metrics } from './sections/metrics';
import { SectionCards } from './sections/section-cards';
import {
  SalesReportResponseDTO,
  SalesReportResponseSchema,
} from '@/modules/reports/report.dto';

// type TResult = typeof SalesReportResponseSchema;
type TResult = SalesReportResponseDTO;

// type TResult = {
//   total_revenue: number;
//   total_payout: number;
//   total_profit: number;
//   total_payment: number;
//   total_cost: number;
//   total_voucher_borne_by_seller: number;
//   total_orders: number;
//   total_buyers: number;
//   daily_reports: [
//     {
//       day: number;
//       month: number;
//       year: number;
//       daily_revenue: number;
//       daily_payout: number;
//       daily_profit: number;
//       daily_payment: number;
//       daily_cost: number;
//       number_of_orders: number;
//       orders: [
//         {
//           order_id: string;
//           total_profit: number;
//           total_payment: number;
//           subtotal: number;
//           status: string;
//         },
//       ];
//     },
//   ];
// };

const ReportClient = () => {
  const router = useRouter();
  const [result, setResult] = useState<TResult>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const []
  const abortControllerRef = useRef<AbortController | null>(
    null
  );

  const form = useAppForm({
    defaultValues: {
      date: {
        from: '',
        to: '',
      },
      // password: '',
    } as ReportFormInput,
    // validationLogic: revalidateLogic(),
    validators: {
      onDynamic: ReportFormSchema,
    },
    // listeners: {
    //   onChangeDebounceMs: 1000,
    //   onChange: (ctx) => {
    //     form.handleSubmit();
    //   },
    // },
    onSubmit: async ({ value }) => {
      console.log('onSubmit value', value);

      // 1. Batalkan request sebelumnya jika masih berjalan
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 2. Buat controller baru untuk request saat ini
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);
      // const { from, to } = value.date;

      try {
        const response = await fetch(
          '/api/v1/dashboard/reports/sales',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: value.date.from,
              endDate: value.date.to,
            }),
            signal: controller.signal,
          }
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setResult(data.data); // set data
          toast.success('Laporan berhasil dibuat.');
        } else {
          setError(
            data.message ||
              'Terjadi kesalahan saat memproses laporan.'
          );
          toast.error(
            data.message || 'Gagal membuat laporan.'
          );
        }
      } catch (error) {
        console.error(error);
        setError(
          'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
        );
        toast.error('Gagal memproses laporan.');
      } finally {
        // 4. Bersihkan ref jika request ini adalah yang terakhir dan selesai
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsLoading(false);
      }

      // try {
      //   const { error: authError } =
      //     await authClient.signIn.email({
      //       email,
      //       password,
      //       // callbackURL: '/dashboard',
      //     });
      //   if (authError) {
      //     setError(
      //       authError.message ||
      //         'Gagal masuk ke akun. Silakan coba lagi.'
      //     );
      //     return;
      //   }
      //   // 1. Fetch existing organizations
      //   const { data: orgs } =
      //     await authClient.organization.list();
      //   if (!orgs || orgs.length === 0) {
      //     router.push('/onboarding');
      //     return;
      //   }
      //   // 2. Update active org and store
      //   await authClient.store.setActive({
      //     organizationId: orgs[0].id,
      //     storeId: null,
      //   });
      //   // 3. Force a database re-fetch and refresh the cookie cache
      //   await authClient.getSession({
      //     query: {
      //       disableCookieCache: true,
      //     },
      //   });
      //   router.push('/dashboard');
      //   router.refresh();
      // } catch (err) {
      //   setError(
      //     'Terjadi kesalahan teknis. Silakan coba lagi nanti.'
      //   );
      // } finally {
      //   setIsLoading(false);
      // }
    },
  });

  // const date = useStore(
  //   form.store,
  //   (state: any) => state.values.date
  // );

  // useEffect(() => {
  //   console.log(`Date: ${date?.from} - ${date?.to}`);
  // }, [date]);

  return (
    <div className="min-h-screen w-full">
      <header className="animate-in fade-in flex flex-1 flex-row items-center justify-between space-y-4 p-4 duration-700 md:p-6">
        {/* <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"> */}
        <div className="flex flex-row flex-wrap items-center">
          <ZapIcon className="mr-2 size-7" />
          <h1 className="m-0 text-xl font-bold tracking-normal text-slate-900 md:text-2xl dark:text-white">
            Sales Overview
          </h1>
          {/* </div> */}
        </div>
        <div className="w-6/12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex w-full flex-row items-center justify-end gap-6 lg:flex-row"
          >
            <div className="border-muted-foreground/20 flex flex-row items-center rounded-sm border px-2 py-1">
              <p className="text-muted-foreground/90 mr-2 w-full text-xs font-light">
                Periode Data
              </p>
              {/* <FieldGroup> */}
              <form.AppField
                name="date"
                children={(field) => (
                  <field.DateRangePresetsField
                    label={undefined}
                    placeholder="Hari Ini"
                    // autoComplete="off"
                    // className="col-span-full text-xl font-normal shadow-none focus-visible:bg-transparent focus-visible:ring-0 md:text-lg"
                  />
                )}
              />
              {/* </FieldGroup> */}
            </div>
            <div>
              <form.AppForm>
                <form.SubmitButton text="Generate" />
              </form.AppForm>
            </div>
          </form>
        </div>
      </header>

      <main className="@container/main flex flex-1 flex-col gap-2">
        {/* report goes here */}
        {/* <Metrics
          revenue={0}
          netPayout={0}
          estimateCOGS={0}
          estimateProfit={0}
        /> */}

        <SectionCards
          revenue={result?.total_revenue}
          payment={result?.total_payment}
          payout={result?.total_payout}
          estimateCOGS={result?.total_cost}
          estimateProfit={result?.total_profit}
          numberOfBuyers={result?.total_buyers}
          numberOfOrders={result?.total_orders}
        />
        <ul>
          {(result?.daily_reports || [])
            .sort((a, b) => a.day - b.day)
            .map((item, idx) => {
              return (
                <li key={idx}>
                  <p>
                    {item.day}: {item.number_of_orders}
                  </p>
                  {/* <div>
                    {(item.orders || []).map(
                      (order: { order_id: string }) => {
                        return (
                          <span key={order.order_id}>
                            {order.order_id} {','}
                          </span>
                        );
                      }
                    )}
                  </div> */}
                </li>
              );
            })}
        </ul>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </main>
    </div>
  );
};

export default ReportClient;
