import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ToolMarketplaceIncomeReport from "@/lib/mongoose/schema/tool-marketplace-income-report";
import { ResultDashboard } from "@/app/tools/marketplace-profit-intelligence/components/result-dashboard";
import type { ProfitReportData } from "@/app/tools/marketplace-profit-intelligence/components/types";
import { DashboardFileInfo } from "../components/dashboard-file-info";

export default async function MarketplaceProfitIntelligenceResultPage({
  params,
}: {
  params: Promise<{ sid: string }>;
}) {
  const { sid } = await params;

  await db.connect();
  const report = await ToolMarketplaceIncomeReport.findOne({ sid }).lean();

  if (!report) {
    notFound();
  }

  const reportData = JSON.parse(JSON.stringify(report)) as ProfitReportData;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 dark:bg-gray-900/50 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace Profit Intelligence</h1>

        <DashboardFileInfo incomeFileName={reportData.source_files[0].original_name} orderFileName={reportData.source_files[1].original_name} />

          {/* <p className="text-muted-foreground">
            Hasil analisis laporan Shopee untuk SID <span className="font-medium text-foreground">{sid}</span>.
          </p> */}
        </div>

        <ResultDashboard initialReportData={reportData} />
      </div>
    </div>
  );
}
