'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DashboardMetrics } from './dashboard-metrics';
import { COGSInputSection } from './cogs-input-section';
import { OrderListSection } from './order-list-section';
import { ReportSummarySection } from './report-summary-section';
import type { ProfitReportData } from './types';
import ChartsSection from './charts/charts-section';

type ResultDashboardProps = {
  initialReportData: ProfitReportData;
};

export function ResultDashboard({
  initialReportData,
}: ResultDashboardProps) {
  const [reportData, setReportData] =
    useState<ProfitReportData>(initialReportData);
  const [selectedProductIds, setSelectedProductIds] =
    useState<Set<string>>(new Set());
  const [bulkCOGSValue, setBulkCOGSValue] = useState('');
  const [isUpdatingCOGS, setIsUpdatingCOGS] =
    useState(false);

  const reportId = reportData._id;
  const totalCOGS = reportData.products.reduce(
    (total, product) =>
      total + (product.cogs || 0) * product.quantity,
    0
  );

  const toggleProductSelect = (id: string) => {
    const nextSelectedProductIds = new Set(
      selectedProductIds
    );

    if (nextSelectedProductIds.has(id)) {
      nextSelectedProductIds.delete(id);
    } else {
      nextSelectedProductIds.add(id);
    }

    setSelectedProductIds(nextSelectedProductIds);
  };

  const toggleAllProducts = () => {
    if (
      selectedProductIds.size === reportData.products.length
    ) {
      setSelectedProductIds(new Set());
      return;
    }

    setSelectedProductIds(
      new Set(
        reportData.products.map((product) => product.id)
      )
    );
  };

  const handleSingleCOGSChange = (
    id: string,
    value: string
  ) => {
    setReportData({
      ...reportData,
      products: reportData.products.map((product) =>
        product.id === id
          ? { ...product, cogs: Number(value) || 0 }
          : product
      ),
    });
  };

  const applyBulkCOGS = () => {
    const value = Number(bulkCOGSValue);
    if (
      Number.isNaN(value) ||
      selectedProductIds.size === 0
    )
      return;

    setReportData({
      ...reportData,
      products: reportData.products.map((product) =>
        selectedProductIds.has(product.id)
          ? { ...product, cogs: value }
          : product
      ),
    });
    setBulkCOGSValue('');
    setSelectedProductIds(new Set());
  };

  const saveCOGSToDb = async () => {
    if (!reportId) return;

    setIsUpdatingCOGS(true);

    const updates = reportData.products.map((product) => ({
      id: product.id,
      cogs: product.cogs,
    }));

    try {
      const response = await fetch(
        `/api/profit-intelligence/${reportId}/cogs`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        }
      );
      const data = await response.json();

      if (data.success) {
        setReportData(data.report);
        toast.success('HPP berhasil disimpan!');
      } else {
        console.error('Error: ' + data.error);
        toast.error('Gagal menyimpan HPP');
      }
    } catch {
      toast.error('Gagal menyimpan HPP');
    } finally {
      setIsUpdatingCOGS(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <DashboardMetrics
        reportData={reportData}
        totalCOGS={totalCOGS}
      />

      <div className="space-y-4">
        <ChartsSection
          start={reportData.period.from}
          end={reportData.period.to}
          orders={reportData.orders || []}
        />

        <COGSInputSection
          products={reportData.products}
          selectedProductIds={selectedProductIds}
          bulkCOGSValue={bulkCOGSValue}
          isUpdatingCOGS={isUpdatingCOGS}
          onBulkCOGSChange={setBulkCOGSValue}
          onApplyBulkCOGS={applyBulkCOGS}
          onSaveCOGS={saveCOGSToDb}
          onToggleProductSelect={toggleProductSelect}
          onToggleAllProducts={toggleAllProducts}
          onSingleCOGSChange={handleSingleCOGSChange}
        />

        <ReportSummarySection
          summaryData={reportData.extra?.summary_data || []}
        />

        <OrderListSection
          orders={reportData.orders || []}
        />
      </div>
    </div>
  );
}
