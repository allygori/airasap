"use client";

import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type DashboardFileInfoProps = {
  incomeFileName: string | null;
  orderFileName: string | null;
  // onReset: () => void;
};

export function DashboardFileInfo({ incomeFileName, orderFileName }: DashboardFileInfoProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium shadow-sm dark:bg-gray-950">
        <FileSpreadsheet className="h-4 w-4 text-green-600" />
        <span className="max-w-[200px] truncate" title={incomeFileName!}>
          {incomeFileName || "Laporan_Income.xlsx"}
        </span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium shadow-sm dark:bg-gray-950">
        <FileSpreadsheet className="h-4 w-4 text-green-600" />
        <span className="max-w-[200px] truncate" title={orderFileName!}>
          {orderFileName || "Laporan_Order.xlsx"}
        </span>
      </div>
      {/* <Button variant="ghost" size="sm" className="h-8 rounded-full border px-3 text-xs" onClick={onReset}>
      <Link href="/tools/marketplace-profit-intelligence">
        Upload File baru
      </Link>
      </Button> */}

      <Button nativeButton={false} variant="ghost" size="sm" className="h-8 rounded-full border dark:border-accent-foreground px-3 text-xs" render={<Link href="/tools/marketplace-profit-intelligence" />}>
        Upload File baru
      </Button>
    </div>
  );
}
