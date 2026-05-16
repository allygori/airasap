"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, ChevronRight, CheckCircle2, DollarSign, Activity, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatIDR } from "@/lib/formatter";

export default function MarketplaceProfitIntelligence() {
  const [step, setStep] = useState<"upload" | "teaser" | "dashboard">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [teaserData, setTeaserData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // HPP State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkHppValue, setBulkHppValue] = useState("");
  const [isUpdatingHpp, setIsUpdatingHpp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profit-intelligence/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setReportId(data.reportId);
        // setTeaserData(data.teaser);
        setReportData(data.report);
        setStep("dashboard");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !reportId) return;
    setIsSubmittingEmail(true);

    try {
      const res = await fetch(`/api/profit-intelligence/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setReportData(data.report);
        setStep("dashboard");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to submit email");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const toggleProductSelect = (id: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProductIds(newSet);
  };

  const toggleAllProducts = () => {
    if (selectedProductIds.size === reportData.products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(reportData.products.map((p: any) => p.id)));
    }
  };

  const handleSingleHppChange = (id: string, val: string) => {
    const newProducts = reportData.products.map((p: any) =>
      p.id === id ? { ...p, cogs: Number(val) || 0 } : p
    );
    setReportData({ ...reportData, products: newProducts });
  };

  const applyBulkHpp = () => {
    const val = Number(bulkHppValue);
    if (isNaN(val) || selectedProductIds.size === 0) return;

    const newProducts = reportData.products.map((p: any) =>
      selectedProductIds.has(p.id) ? { ...p, cogs: val } : p
    );
    setReportData({ ...reportData, products: newProducts });
    setBulkHppValue("");
    setSelectedProductIds(new Set()); // clear selection after apply
  };

  const saveHppToDb = async () => {
    if (!reportId || !reportData) return;
    setIsUpdatingHpp(true);

    // We only send updates for products that have HPP > 0 (or all of them)
    const updates = reportData.products.map((p: any) => ({ id: p.id, cogs: p.cogs }));

    try {
      const res = await fetch(`/api/profit-intelligence/${reportId}/hpp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();

      if (data.success) {
        alert("HPP berhasil disimpan!");
      }
    } catch (err) {
      alert("Failed to save HPP");
    } finally {
      setIsUpdatingHpp(false);
    }
  };

  const calculateTotalHpp = () => {
    if (!reportData) return 0;
    return reportData.products.reduce((acc: number, p: any) => acc + ((p.cogs || 0) * p.quantity), 0);
  };

  const SummaryAccordion = ({ data, idPrefix = "item-" }: { data: any[], idPrefix?: string }) => {
    if (!data || data.length === 0) return null;
    const allValues = data.map((_, i) => `${idPrefix}${i}`);
    return (
      <Accordion multiple defaultValue={allValues} className="w-full bg-white dark:bg-gray-950 rounded-md border">
        {data.map((group, i) => (
          group.subItems && group.subItems.length > 0 ? (
            <AccordionItem value={`${idPrefix}${i}`} key={i} className="px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex justify-between w-full pr-4">
                  <span className="font-semibold text-left">{group.name}</span>
                  <span className={`font-semibold ${group.value < 0 ? 'text-destructive' : ''}`}>
                    {formatIDR(group.value)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2 pt-2 border-t">
                  {group.subItems.map((sub: any, j: number) => (
                    <div key={j} className="flex justify-between pl-4 pr-4">
                      <span className="text-muted-foreground">{sub.name}</span>
                      <span className={`${sub.value < 0 ? 'text-destructive' : ''}`}>
                        {formatIDR(sub.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : (
            <div key={i} className="flex justify-between px-4 py-4 border-b last:border-0">
              <span className="font-semibold">{group.name}</span>
              <span className={`font-semibold ${group.value < 0 ? 'text-destructive' : ''}`}>
                {formatIDR(group.value)}
              </span>
            </div>
          )
        ))}
      </Accordion>
    );
  };

  const dummySummaryData = [
    { name: "1. Total Pendapatan", value: 1693110, subItems: [] },
    {
      name: "Subtotal Pesanan", value: 1728110, subItems: [
        { name: "Harga Asli Produk", value: 2783000 },
        { name: "Total Diskon Produk", value: -1054890 },
      ]
    },
    {
      name: "Biaya Admin & Layanan", value: -173094, subItems: [
        { name: "Biaya Administrasi", value: -153094 },
        { name: "Biaya Proses Pesanan", value: -20000 },
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace Profit Intelligence</h1>
          <p className="text-muted-foreground">Analisis Laporan Penghasilan Shopee kamu dan temukan "kebocoran" profit yang tersembunyi.</p>
        </div>

        {/* STEP 1: UPLOAD & PREVIEW */}
        {step === "upload" && (
          <div className="space-y-12">
            <Card className="max-w-2xl mx-auto border-dashed border-2">
              <CardHeader className="text-center pb-2">
                <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle>Upload Laporan Penghasilan</CardTitle>
                <CardDescription>Format .xlsx (Shopee)</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? file.name : "Pilih File Excel"}
                </Button>

                {file && (
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full max-w-xs"
                  >
                    {isUploading ? "Menganalisis..." : "Analisis Sekarang"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="max-w-3xl mx-auto space-y-4 opacity-50 select-none pointer-events-none">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Contoh Hasil Analisis Laporan</h3>
                <p className="text-sm text-muted-foreground">Detail utuh tanpa ada yang ditutupi.</p>
              </div>
              <SummaryAccordion data={dummySummaryData} />
            </div>
          </div>
        )}

        {/* STEP 2: TEASER (Lead Capture) - Temporarily hidden for manual testing */}
        {/*
        {step === "teaser" && teaserData && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Gross Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatIDR(teaserData.grossSales)}</div>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-destructive">Total Biaya (Fees)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatIDR(teaserData.totalFees)}</div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600 dark:text-green-400">Net Payout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatIDR(teaserData.netPayout)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Buka Laporan Lengkap
                </CardTitle>
                <CardDescription>
                  Masukkan email untuk melihat rincian biaya (Admin, Layanan, Kampanye, dll), menghitung Real Profit (dengan HPP), dan menyimpan laporanmu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    type="email" 
                    placeholder="nama@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button onClick={handleEmailSubmit} disabled={isSubmittingEmail || !email}>
                    {isSubmittingEmail ? "Memproses..." : "Lihat Laporan"} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        */}

        {/* STEP 3: DASHBOARD */}
        {step === "dashboard" && reportData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* FILE INFO */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-950 border rounded-full text-sm font-medium shadow-sm">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <span>{file?.name || "Laporan_Shopee.xlsx"}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-2" onClick={() => {
                  setStep("upload");
                  setFile(null);
                  setReportData(null);
                }}>
                  Ganti File
                </Button>
              </div>
            </div>

            {/* HERO METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Gross Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatIDR(reportData.summary?.total_income || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Net Payout (Dari Shopee)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatIDR(reportData.summary?.released_amount || 0)}</div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-700 dark:text-amber-400">Estimasi HPP (Modal)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {formatIDR(calculateTotalHpp())}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 dark:text-green-400">Real Profit (Cuan Bersih)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {formatIDR((reportData.summary?.released_amount || 0) - calculateTotalHpp())}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              {/* HPP TABLE */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5" /> Input HPP (Harga Pokok)
                  </h2>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Nilai HPP Bulk"
                      className="w-32"
                      value={bulkHppValue}
                      onChange={(e) => setBulkHppValue(e.target.value)}
                    />
                    <Button variant="secondary" onClick={applyBulkHpp} disabled={selectedProductIds.size === 0 || !bulkHppValue}>
                      Apply ke {selectedProductIds.size} Produk
                    </Button>
                    <Button onClick={saveHppToDb} disabled={isUpdatingHpp}>
                      {isUpdatingHpp ? "Menyimpan..." : "Simpan HPP"}
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md bg-white dark:bg-gray-950">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedProductIds.size === reportData.products.length && reportData.products.length > 0}
                            onCheckedChange={toggleAllProducts}
                          />
                        </TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Qty Terjual</TableHead>
                        <TableHead className="text-right w-48">HPP / Unit (Rp)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.products.map((product: any) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProductIds.has(product.id)}
                              onCheckedChange={() => toggleProductSelect(product.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>
                            {product.name}
                            <div className="text-xs text-muted-foreground">{product.id}</div>
                          </TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              className="text-right"
                              value={product.cogs || ""}
                              onChange={(e) => handleSingleHppChange(product.id, e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {reportData.products.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Tidak ada data produk ditemukan di laporan ini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* FEES BREAKDOWN (From Summary Sheet) */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Rincian Laporan (Summary)
                </h2>
                {(() => {
                  const summaryData = reportData.extra?.summaryData || [];
                  if (summaryData.length === 0) {
                    return (
                      <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                          Data Summary tidak ditemukan di file ini.
                        </CardContent>
                      </Card>
                    );
                  }

                  const idx1 = summaryData.findIndex((g: any) => g.name.includes("1. Total Pendapatan"));
                  const idx2 = summaryData.findIndex((g: any) => g.name.includes("2. Total") || g.name.includes("2. Biaya") || g.name.includes("2. Pengeluaran"));
                  const idx3 = summaryData.findIndex((g: any) => g.name.includes("3. Total yang Dilepas") || g.name.includes("3. Penghasilan") || g.name.includes("Total yang Dilepas"));

                  const pendapatanData = summaryData.slice(
                    idx1 !== -1 ? idx1 : 0, 
                    idx2 !== -1 ? idx2 : (idx3 !== -1 ? idx3 : summaryData.length)
                  );

                  const pengeluaranData = idx2 !== -1 ? summaryData.slice(
                    idx2, 
                    idx3 !== -1 ? idx3 : summaryData.length
                  ) : [];

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <div className="space-y-2">
                        <SummaryAccordion data={pendapatanData} idPrefix="pendapatan-" />
                      </div>
                      <div className="space-y-2">
                        {pengeluaranData.length > 0 && (
                          <SummaryAccordion data={pengeluaranData} idPrefix="pengeluaran-" />
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
