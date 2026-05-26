"use client";

import { useState } from "react";
import { DashboardMetrics } from "./dashboard-metrics";
import { HppInputSection } from "./hpp-input-section";
import { OrderListSection } from "./order-list-section";
import { ReportSummarySection } from "./report-summary-section";
import type { ProfitReportData } from "./types";

type ResultDashboardProps = {
  initialReportData: ProfitReportData;
};

export function ResultDashboard({ initialReportData }: ResultDashboardProps) {
  const [reportData, setReportData] = useState<ProfitReportData>(initialReportData);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkHppValue, setBulkHppValue] = useState("");
  const [isUpdatingHpp, setIsUpdatingHpp] = useState(false);

  const reportId = reportData._id;
  const totalHpp = reportData.products.reduce((total, product) => total + (product.cogs || 0) * product.quantity, 0);

  const toggleProductSelect = (id: string) => {
    const nextSelectedProductIds = new Set(selectedProductIds);

    if (nextSelectedProductIds.has(id)) {
      nextSelectedProductIds.delete(id);
    } else {
      nextSelectedProductIds.add(id);
    }

    setSelectedProductIds(nextSelectedProductIds);
  };

  const toggleAllProducts = () => {
    if (selectedProductIds.size === reportData.products.length) {
      setSelectedProductIds(new Set());
      return;
    }

    setSelectedProductIds(new Set(reportData.products.map((product) => product.id)));
  };

  const handleSingleHppChange = (id: string, value: string) => {
    setReportData({
      ...reportData,
      products: reportData.products.map((product) =>
        product.id === id ? { ...product, cogs: Number(value) || 0 } : product
      ),
    });
  };

  const applyBulkHpp = () => {
    const value = Number(bulkHppValue);
    if (Number.isNaN(value) || selectedProductIds.size === 0) return;

    setReportData({
      ...reportData,
      products: reportData.products.map((product) =>
        selectedProductIds.has(product.id) ? { ...product, cogs: value } : product
      ),
    });
    setBulkHppValue("");
    setSelectedProductIds(new Set());
  };

  const saveHppToDb = async () => {
    if (!reportId) return;

    setIsUpdatingHpp(true);

    const updates = reportData.products.map((product) => ({
      id: product.id,
      cogs: product.cogs,
    }));

    try {
      const response = await fetch(`/api/profit-intelligence/${reportId}/cogs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();

      if (data.success) {
        setReportData(data.report);
        alert("HPP berhasil disimpan!");
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Failed to save HPP");
    } finally {
      setIsUpdatingHpp(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <DashboardMetrics reportData={reportData} totalHpp={totalHpp} />

      <div className="space-y-4">
        <HppInputSection
          products={reportData.products}
          selectedProductIds={selectedProductIds}
          bulkHppValue={bulkHppValue}
          isUpdatingHpp={isUpdatingHpp}
          onBulkHppChange={setBulkHppValue}
          onApplyBulkHpp={applyBulkHpp}
          onSaveHpp={saveHppToDb}
          onToggleProductSelect={toggleProductSelect}
          onToggleAllProducts={toggleAllProducts}
          onSingleHppChange={handleSingleHppChange}
        />

        <ReportSummarySection summaryData={reportData.extra?.summary_data || []} />

        <OrderListSection orders={reportData.orders || []} />
      </div>
    </div>
  );
}
