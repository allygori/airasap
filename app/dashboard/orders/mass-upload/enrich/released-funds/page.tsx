'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type Store = {
  _id: string;
  name: string;
  platform: string;
};

export default function EnrichWithReleasedFundPage() {
  const router = useRouter();
  const [stores, setStores] = React.useState<Store[]>([]);
  const [selectedStore, setSelectedStore] =
    React.useState<string>('');
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] =
    React.useState(false);
  const [isFetchingStores, setIsFetchingStores] =
    React.useState(true);
  const [result, setResult] = React.useState<{
    created: number;
    updated: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError(
          'Hanya file Excel (.xlsx) yang diperbolehkan.'
        );
        setFile(null);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!file || !selectedStore) return;
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        '/api/v1/dashboard/orders/enrich/released-income',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        toast.success(
          'File berhasil diunggah dan diproses.'
        );
      } else {
        setError(
          data.message ||
            'Terjadi kesalahan saat memproses file.'
        );
        toast.error(
          data.message || 'Gagal memproses unggahan.'
        );
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi server.');
      toast.error('Gagal mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-in fade-in flex flex-1 flex-col space-y-6 p-4 duration-500 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          {/* <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-400">
            <Link
              href="/dashboard/products"
              className="flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Products
            </Link>
            <ChevronRight className="text-muted-foreground h-3 w-3" />
            <span>Mass Upload</span>
          </div> */}
          <h1 className="bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-white dark:to-indigo-200">
            Upload Massal
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Upload file excel dari hasil export produk
            Shopee untuk memperbaharui katalog produk
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-white/70 shadow-md backdrop-blur-sm lg:col-span-2 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Upload Shopee Order
            </CardTitle>
            {/* <CardDescription>
              Select your store and drag your Shopee sales
              info export file below.
            </CardDescription> */}
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleUpload}
              className="space-y-6"
            >
              {/* Store Selector */}
              {/* <div className="space-y-2">
                <label
                  htmlFor="store-select"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Target Store
                </label>
                <select
                  id="store-select"
                  value={selectedStore}
                  onChange={(e) =>
                    setSelectedStore(e.target.value)
                  }
                  className="border-input bg-background ring-offset-background focus:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                  required
                >
                  {stores.length === 0 ? (
                    <option value="">
                      No stores available. Please create a
                      store first.
                    </option>
                  ) : (
                    stores.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.platform})
                      </option>
                    ))
                  )}
                </select>
              </div> */}

              {/* File Upload Dropzone */}
              <div
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300 ${
                  file
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                    : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx"
                  className="hidden"
                />
                <div className="mb-3 rounded-full border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <FileSpreadsheet
                    className={`h-8 w-8 ${file ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="max-w-xs truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Click to browse file
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Supports Shopee Order template (.xlsx)
                    </p>
                  </div>
                )}
              </div>

              {/* Messages & Actions */}
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/20">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                    {error}
                  </span>
                </div>
              )}

              {result && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      Upload Berhasil!
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      {result.created} produk baru
                      ditambahkan, {result.updated} produk
                      diperbarui.
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isUploading || !file}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses Unggahan...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Mulai Mass Upload
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Side Panel: Information */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Panduan Mass Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Fitur ini membantu Anda memperbarui harga,
                stok, SKU, dan GTIN untuk produk Shopee
                secara massal dengan mengunggah template
                info penjualan.
              </p>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">
                Cara Kerja:
              </h4>
              <ol className="list-decimal space-y-1 pl-4">
                <li>
                  Export template "Informasi Penjualan" dari
                  Seller Centre Shopee.
                </li>
                <li>
                  Pilih toko target yang sesuai di form
                  sebelah kiri.
                </li>
                <li>
                  Unggah file Excel hasil export tersebut
                  (.xlsx).
                </li>
                <li>
                  Sistem akan mencocokkan produk berdasarkan
                  Product ID dan memperbarui detail varian.
                </li>
              </ol>
              <p className="text-muted-foreground border-t pt-2 text-[10px]">
                * Pastikan format file tidak diubah demi
                kelancaran proses import.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
