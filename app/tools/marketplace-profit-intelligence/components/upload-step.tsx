'use client';

import type { RefObject } from 'react';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SummaryAccordion } from './summary-accordion';
import type { SummaryItem } from './types';

type UploadStepProps = {
  incomeFile: File | null;
  orderFile: File | null;
  isUploading: boolean;
  incomeInputRef: RefObject<HTMLInputElement | null>;
  orderInputRef: RefObject<HTMLInputElement | null>;
  dummySummaryData: SummaryItem[];
  onIncomeFileChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onOrderFileChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onUpload: () => void;
};

export function UploadStep({
  incomeFile,
  orderFile,
  isUploading,
  incomeInputRef,
  orderInputRef,
  dummySummaryData,
  onIncomeFileChange,
  onOrderFileChange,
  onUpload,
}: UploadStepProps) {
  return (
    <div className="space-y-12">
      <Card className="mx-auto max-w-2xl border-2 border-dashed">
        <CardHeader className="pb-2 text-center">
          <UploadCloud className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <CardTitle>Upload Laporan Shopee</CardTitle>
          <CardDescription>
            Pilih berkas Excel pelepasan dana dan pesanan
            selesai (.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="mx-auto flex w-full max-w-md flex-col gap-6 pb-8">
          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              1. Laporan Pelepasan Dana (Income)
            </label>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              ref={incomeInputRef}
              onChange={onIncomeFileChange}
            />
            <Button
              variant="outline"
              className="h-11 justify-start truncate border-dashed px-4"
              onClick={() =>
                incomeInputRef.current?.click()
              }
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="truncate">
                {incomeFile
                  ? incomeFile.name
                  : 'Pilih Berkas Pelepasan Dana'}
              </span>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              2. Laporan Pesanan Selesai (Order)
            </label>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              ref={orderInputRef}
              onChange={onOrderFileChange}
            />
            <Button
              variant="outline"
              className="h-11 justify-start truncate border-dashed px-4"
              onClick={() => orderInputRef.current?.click()}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="truncate">
                {orderFile
                  ? orderFile.name
                  : 'Pilih Berkas Pesanan Selesai'}
              </span>
            </Button>
          </div>

          {incomeFile && orderFile && (
            <Button
              onClick={onUpload}
              disabled={isUploading}
              className="mt-4 h-11 w-full"
            >
              {isUploading
                ? 'Menganalisis Berkas Gabungan...'
                : 'Analisis Sekarang'}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="pointer-events-none mx-auto max-w-3xl space-y-4 opacity-50 select-none">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Contoh Hasil Analisis Laporan
          </h3>
          <p className="text-muted-foreground text-sm">
            Detail utuh tanpa ada yang ditutupi.
          </p>
        </div>
        <SummaryAccordion data={dummySummaryData} />
      </div>
    </div>
  );
}
