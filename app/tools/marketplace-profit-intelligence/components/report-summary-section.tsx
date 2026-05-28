'use client';

import { Activity } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { SummaryAccordion } from './summary-accordion';
import type { SummaryItem } from './types';

type ReportSummarySectionProps = {
  summaryData: SummaryItem[];
};

export function ReportSummarySection({
  summaryData,
}: ReportSummarySectionProps) {
  const idx1 = summaryData.findIndex((group) =>
    group.name.includes('1. Total Pendapatan')
  );
  const idx2 = summaryData.findIndex(
    (group) =>
      group.name.includes('2. Total') ||
      group.name.includes('2. Biaya') ||
      group.name.includes('2. Pengeluaran')
  );
  const idx3 = summaryData.findIndex(
    (group) =>
      group.name.includes('3. Total yang Dilepas') ||
      group.name.includes('3. Penghasilan') ||
      group.name.includes('Total yang Dilepas')
  );

  const pendapatanData = summaryData.slice(
    idx1 !== -1 ? idx1 : 0,
    idx2 !== -1
      ? idx2
      : idx3 !== -1
        ? idx3
        : summaryData.length
  );

  const pengeluaranData =
    idx2 !== -1
      ? summaryData.slice(
          idx2,
          idx3 !== -1 ? idx3 : summaryData.length
        )
      : [];

  return (
    <Accordion
      multiple
      defaultValue={['summary']}
      className="rounded-md border bg-white px-4 dark:bg-gray-950"
    >
      <AccordionItem value="summary" className="border-0">
        <AccordionTrigger className="py-4 hover:no-underline">
          <span className="flex items-center gap-2 text-xl font-semibold">
            <Activity className="h-5 w-5" /> Rincian Laporan
            (Summary)
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          {summaryData.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground p-8 text-center">
                Data Summary tidak ditemukan di file ini.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <SummaryAccordion
                  data={pendapatanData}
                  idPrefix="pendapatan-"
                />
              </div>
              <div className="space-y-2">
                {pengeluaranData.length > 0 && (
                  <SummaryAccordion
                    data={pengeluaranData}
                    idPrefix="pengeluaran-"
                  />
                )}
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
