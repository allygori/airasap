"use client";

import { DollarSign } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProfitProduct } from "./types";

type COGSInputSectionProps = {
  products: ProfitProduct[];
  selectedProductIds: Set<string>;
  bulkCOGSValue: string;
  isUpdatingCOGS: boolean;
  onBulkCOGSChange: (value: string) => void;
  onApplyBulkCOGS: () => void;
  onSaveCOGS: () => void;
  onToggleProductSelect: (id: string) => void;
  onToggleAllProducts: () => void;
  onSingleCOGSChange: (id: string, value: string) => void;
};

export function COGSInputSection({
  products,
  selectedProductIds,
  bulkCOGSValue,
  isUpdatingCOGS,
  onBulkCOGSChange,
  onApplyBulkCOGS,
  onSaveCOGS,
  onToggleProductSelect,
  onToggleAllProducts,
  onSingleCOGSChange,
}: COGSInputSectionProps) {
  return (
    <Accordion multiple defaultValue={["cogs"]} className="rounded-md border bg-white px-4 dark:bg-gray-950">
      <AccordionItem value="cogs" className="border-0">
        <AccordionTrigger className="py-4 hover:no-underline">
          <span className="flex items-center gap-2 text-xl font-semibold">
            <DollarSign className="h-5 w-5" /> Input HPP (Harga Pokok)
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="text-sm text-muted-foreground">
                Pilih produk untuk mengisi HPP massal, atau ubah HPP per produk langsung di tabel.
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  placeholder="Nilai HPP Bulk"
                  className="w-32"
                  value={bulkCOGSValue}
                  onChange={(event) => onBulkCOGSChange(event.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={onApplyBulkCOGS}
                  disabled={selectedProductIds.size === 0 || !bulkCOGSValue}
                >
                  Apply ke {selectedProductIds.size} Produk
                </Button>
                <Button onClick={onSaveCOGS} disabled={isUpdatingCOGS}>
                  {isUpdatingCOGS ? "Menyimpan..." : "Simpan HPP"}
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProductIds.size === products.length && products.length > 0}
                        onCheckedChange={onToggleAllProducts}
                      />
                    </TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Qty Terjual</TableHead>
                    <TableHead className="w-48 text-right">HPP / Unit (Rp)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProductIds.has(product.id)}
                          onCheckedChange={() => onToggleProductSelect(product.id)}
                        />
                      </TableCell>
                      <TableCell className="max-w-50 truncate font-medium" title={product.name}>
                        {product.name}
                        <div className="text-xs text-muted-foreground">{product.id}</div>
                      </TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="text-right"
                          value={product.cogs || ""}
                          onChange={(event) => onSingleCOGSChange(product.id, event.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Tidak ada data produk ditemukan di laporan ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
