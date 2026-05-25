"use client";

import { ChevronDown, PackageSearch } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/formatter";
import type { ProfitOrder } from "./types";

type OrderListSectionProps = {
  orders: ProfitOrder[];
};

const feeLabels: Record<keyof NonNullable<ProfitOrder["fees"]>, string> = {
  admin: "Admin",
  service: "Layanan",
  transaction: "Transaksi",
  process: "Proses",
  campaign: "Kampanye",
};

function formatDate(value?: string | Date) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function sumFees(order: ProfitOrder) {
  if (!order.fees) return 0;

  return Object.values(order.fees).reduce((total, value) => total + Math.abs(value || 0), 0);
}

function StatLine({ label, value, destructive = false }: { label: string; value: string; destructive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right font-medium ${destructive ? "text-destructive" : ""}`}>{value}</span>
    </div>
  );
}

export function OrderListSection({ orders }: OrderListSectionProps) {
  return (
    <Accordion multiple defaultValue={["orders"]} className="rounded-md border bg-white px-4 dark:bg-gray-950">
      <AccordionItem value="orders" className="border-0">
        <AccordionTrigger className="py-4 hover:no-underline">
          <span className="flex items-center gap-2 text-xl font-semibold">
            <PackageSearch className="h-5 w-5" /> List Order
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Data order tidak ditemukan di laporan ini.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <div className="hidden grid-cols-[44px_1.5fr_1fr_1fr_0.6fr_1fr_1fr] gap-3 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
                <div></div>
                <div>Order</div>
                <div>Pembeli</div>
                <div>Selesai</div>
                <div className="text-right">Item</div>
                <div className="text-right">Income</div>
                <div className="text-right">Total Fee</div>
              </div>

              <Accordion multiple className="divide-y">
                {orders.map((order) => {
                  const totalFees = sumFees(order);
                  const itemCount = order.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;

                  return (
                    <AccordionItem key={order.id} value={order.id} className="border-0">
                      <AccordionTrigger className="grid w-full grid-cols-[36px_1fr] items-start gap-3 rounded-none px-4 py-3 hover:bg-muted/40 hover:no-underline md:grid-cols-[44px_1.5fr_1fr_1fr_0.6fr_1fr_1fr] md:items-center [&_[data-slot=accordion-trigger-icon]]:hidden">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-background">
                          <ChevronDown className="h-4 w-4 transition-transform group-aria-expanded/accordion-trigger:rotate-180" />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block truncate font-medium">{order.id}</span>
                          <span className="block text-xs text-muted-foreground md:hidden">
                            {formatDate(order.completedAt)} - {itemCount} item
                          </span>
                        </span>
                        <span className="hidden text-left text-sm md:block">{order.username || "-"}</span>
                        <span className="hidden text-left text-sm md:block">{formatDate(order.completedAt)}</span>
                        <span className="hidden text-right text-sm md:block">{itemCount}</span>
                        <span className="text-left text-sm font-semibold md:text-right md:text-base">
                          {formatIDR(order.income || 0)}
                          <span className="block text-xs font-normal text-muted-foreground md:hidden">
                            {order.username || "Pembeli tidak tersedia"}
                          </span>
                        </span>
                        <span className="hidden text-right text-sm text-destructive md:block">{formatIDR(totalFees)}</span>
                      </AccordionTrigger>

                      <AccordionContent className="px-0 pb-0">
                        <div className="border-t bg-muted/30 p-4">
                          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="space-y-3">
                              <div className="text-sm font-semibold">Produk dalam order</div>
                              <div className="space-y-2">
                                {(order.items || []).map((item, index) => (
                                  <div key={`${order.id}-${item.productId || index}`} className="rounded-md border bg-background p-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0">
                                        <div className="font-medium">{item.name || "Produk tanpa nama"}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {item.variationName || "Variasi tidak tersedia"} - {item.productId || "-"}
                                        </div>
                                      </div>
                                      <div className="text-left text-sm sm:text-right">
                                        <div className="font-medium">Qty {item.quantity || 0}</div>
                                        <div className="text-muted-foreground">
                                          {formatIDR(item.discountedPrice || item.originalPrice || 0)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {(order.items || []).length === 0 && (
                                  <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                                    Detail produk tidak tersedia untuk order ini.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="rounded-md border bg-background p-4 text-sm">
                              <StatLine label="Dibuat" value={formatDate(order.createdAt)} />
                              <StatLine label="Selesai" value={formatDate(order.completedAt)} />
                              <StatLine label="Pembayaran" value={order.paymentMethod || "-"} />
                              <StatLine label="Logistik" value={order.logisticService || "-"} />
                              <StatLine label="Harga asli" value={formatIDR(order.originalPrice || 0)} />
                              <StatLine label="Diskon" value={formatIDR(order.totalDiscount || 0)} destructive />
                              {Object.entries(order.fees || {}).map(([feeKey, feeValue]) => (
                                <StatLine
                                  key={feeKey}
                                  label={`Fee ${feeLabels[feeKey as keyof typeof feeLabels] || feeKey}`}
                                  value={formatIDR(feeValue || 0)}
                                  destructive
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
