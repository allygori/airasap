'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { UploadStep } from './components/upload-step';
import type { SummaryItem } from './components/types';

const dummySummaryData: SummaryItem[] = [
  {
    name: '1. Total Pendapatan',
    value: 1693110,
    subItems: [],
  },
  {
    name: 'Subtotal Pesanan',
    value: 1728110,
    subItems: [
      { name: 'Harga Asli Produk', value: 2783000 },
      { name: 'Total Diskon Produk', value: -1054890 },
    ],
  },
  {
    name: 'Biaya Admin & Layanan',
    value: -173094,
    subItems: [
      { name: 'Biaya Administrasi', value: -153094 },
      { name: 'Biaya Proses Pesanan', value: -20000 },
    ],
  },
];

export default function MarketplaceProfitIntelligenceUploadPage() {
  const router = useRouter();
  const [incomeFile, setIncomeFile] = useState<File | null>(
    null
  );
  const [orderFile, setOrderFile] = useState<File | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const incomeInputRef = useRef<HTMLInputElement>(null);
  const orderInputRef = useRef<HTMLInputElement>(null);

  const handleIncomeFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIncomeFile(file);
      setErrorMessage('');
    }
  };

  const handleOrderFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setOrderFile(file);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!incomeFile || !orderFile) return;

    setIsUploading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('incomeFile', incomeFile);
    formData.append('orderFile', orderFile);

    try {
      const response = await fetch(
        '/api/profit-intelligence/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success && data.sid) {
        router.push(
          `/tools/marketplace-profit-intelligence/${data.sid}`
        );
        return;
      }

      setErrorMessage(
        data.error ||
          'Gagal menganalisis file. Silakan cek format file lalu coba lagi.'
      );
    } catch {
      setErrorMessage(
        'Gagal mengupload file. Silakan coba lagi.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 dark:bg-gray-900/50">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Marketplace Profit Intelligence
          </h1>
          <p className="text-muted-foreground">
            Upload Income Sudah Dilepas dan Download Pesanan
            Selesai dari Shopee untuk mulai analisis.
          </p>
        </div>

        {errorMessage && (
          <Card className="border-destructive/30 bg-destructive/5 mx-auto max-w-2xl">
            <CardContent className="text-destructive p-4 text-sm">
              {errorMessage}
            </CardContent>
          </Card>
        )}

        <UploadStep
          incomeFile={incomeFile}
          orderFile={orderFile}
          isUploading={isUploading}
          incomeInputRef={incomeInputRef}
          orderInputRef={orderInputRef}
          dummySummaryData={dummySummaryData}
          onIncomeFileChange={handleIncomeFileChange}
          onOrderFileChange={handleOrderFileChange}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
}
