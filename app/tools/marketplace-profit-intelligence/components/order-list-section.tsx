'use client';

import { useState, Fragment } from 'react';
import { ChevronDown, PackageSearch } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useMediaQuery } from '@/hooks/use-media-query';
import { formatIDR } from '@/lib/formatter';
import type { ProfitOrder } from './types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type OrderListSectionProps = {
  orders: ProfitOrder[];
};

const feeLabels: Record<
  keyof NonNullable<ProfitOrder['fees']>,
  string
> = {
  admin: 'Admin',
  service: 'Layanan',
  transaction: 'Transaksi',
  process: 'Proses',
  campaign: 'Kampanye',
};

function formatDate(value?: string | Date) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sumFees(order: ProfitOrder) {
  if (!order.fees) return 0;

  return Object.values(order.fees).reduce(
    (total, value) => total + Math.abs(value || 0),
    0
  );
}

function StatLine({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn('text-right font-medium', valueClass)}
      >
        {value}
      </span>
    </div>
  );
}

export function OrderListSection({
  orders,
}: OrderListSectionProps) {
  const [expandedOrders, setExpandedOrders] = useState<
    string[]
  >([]);
  const isNotMobile = useMediaQuery('sm', {
    initializeWithValue: false,
  });

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <Accordion
      multiple
      defaultValue={['orders']}
      className="rounded-md border bg-white px-4 dark:bg-gray-950"
    >
      <AccordionItem value="orders" className="border-0">
        <AccordionTrigger className="py-4 hover:no-underline">
          <span className="flex items-center gap-2 text-xl font-semibold">
            <PackageSearch className="h-5 w-5" /> Daftar
            Pesanan (Order)
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground p-8 text-center">
                Data order tidak ditemukan di laporan ini.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table className="table-fixed md:table-auto">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3">
                      <span className="pl-10">
                        No Pesanan
                      </span>
                    </TableHead>
                    <TableHead
                      className={cn(
                        'px-4 py-3',
                        'hidden sm:table-cell'
                      )}
                    >
                      Pembeli
                    </TableHead>
                    <TableHead className="hidden px-4 py-3 sm:table-cell">
                      Selesai
                    </TableHead>
                    <TableHead className="hidden px-4 py-3 text-right sm:table-cell">
                      Item
                    </TableHead>
                    <TableHead className="hidden px-4 py-3 text-right sm:table-cell">
                      Pendapatan
                    </TableHead>
                    <TableHead className="hidden px-4 py-3 text-right sm:table-cell">
                      Total Fee
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right">
                      Profit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const totalFees = sumFees(order);
                    const itemCount =
                      order.items?.reduce(
                        (total, item) =>
                          total + (item.quantity || 0),
                        0
                      ) || 0;
                    const isExpanded =
                      expandedOrders.includes(order.id);

                    return (
                      <Fragment
                        key={`detail-of-${order.id}`}
                      >
                        <TableRow>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={'outline'}
                                onClick={() =>
                                  toggleOrder(order.id)
                                }
                                aria-expanded={isExpanded}
                                data-state={
                                  isExpanded
                                    ? 'expanded'
                                    : 'collapsed'
                                }
                                className={'px-2 py-1'}
                              >
                                <ChevronDown
                                  className={`h-2 w-2 transition-transform md:h-4 md:w-4 ${isExpanded ? 'rotate-360' : 'rotate-270'}`}
                                />
                              </Button>
                              <div>
                                <span className="block truncate font-medium">
                                  {order.id}
                                </span>
                                <span className="text-muted-foreground block text-xs sm:hidden">
                                  {formatDate(
                                    order.completedAt
                                  )}{' '}
                                  - {itemCount} item
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden px-4 py-3 sm:table-cell">
                            {order.username || '-'}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3 sm:table-cell">
                            {formatDate(order.completedAt)}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3 text-right sm:table-cell">
                            {itemCount}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3 text-right sm:table-cell">
                            <span className="font-semibold md:text-base">
                              {formatIDR(order.income || 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-destructive hidden px-4 py-3 text-right sm:table-cell">
                            {formatIDR(totalFees)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <span
                              className={`font-semibold md:text-base ${order.profit !== undefined ? (order.profit < 0 ? 'text-destructive' : 'text-green-600') : 'text-muted-foreground'}`}
                            >
                              {order.profit !== undefined
                                ? formatIDR(order.profit)
                                : '-'}
                            </span>
                            <span className="text-muted-foreground block text-xs font-normal sm:hidden">
                              {order.username ||
                                'Pembeli tidak tersedia'}
                            </span>
                          </TableCell>
                        </TableRow>
                        <TableRow
                          className="hover:bg-inherit"
                          aria-hidden={!isExpanded}
                        >
                          <TableCell
                            className="p-0"
                            colSpan={isNotMobile ? 7 : 2}
                          >
                            <div
                              className={`w-full max-w-full overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? 'max-h-250 opacity-100'
                                  : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="bg-muted/30 w-full border-t p-4 wrap-break-word whitespace-normal">
                                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                                  <div className="space-y-3">
                                    <div className="text-sm font-semibold">
                                      Produk dalam order
                                    </div>
                                    <div className="space-y-2">
                                      {(
                                        order.items || []
                                      ).map(
                                        (item, index) => (
                                          <div
                                            key={`${order.id}-${item.productId}-${index}`}
                                            className="bg-background rounded-md border p-3"
                                          >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                              <div className="min-w-0">
                                                <div className="font-medium">
                                                  {item.name ||
                                                    'Produk tanpa nama'}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                  {item.productId ||
                                                    '-'}{' '}
                                                  -{' '}
                                                  {item.variationName ||
                                                    'Variasi tidak tersedia'}
                                                </div>
                                              </div>
                                              <div className="text-left text-sm sm:text-right">
                                                <div className="font-medium">
                                                  Qty{' '}
                                                  {item.quantity ||
                                                    0}
                                                </div>
                                                <div className="text-muted-foreground">
                                                  {formatIDR(
                                                    item.discountedPrice ||
                                                      item.originalPrice ||
                                                      0
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                      {(order.items || [])
                                        .length === 0 && (
                                        <div className="bg-background text-muted-foreground rounded-md border p-4 text-sm">
                                          Detail produk
                                          tidak tersedia
                                          untuk order ini.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="bg-background rounded-md border p-4 text-sm">
                                    <StatLine
                                      label="Pendapatan"
                                      value={formatIDR(
                                        order.income || 0
                                      )}
                                    />
                                    <StatLine
                                      label="Profit Bersih"
                                      value={
                                        order.profit !==
                                        undefined
                                          ? formatIDR(
                                              order.profit
                                            )
                                          : '-'
                                      }
                                      valueClass={
                                        order.profit !==
                                          undefined &&
                                        order.profit !== 0
                                          ? order.profit < 0
                                            ? 'text-destructive'
                                            : 'text-green-600'
                                          : ''
                                      }
                                    />
                                    <StatLine
                                      label="Dibuat"
                                      value={formatDate(
                                        order.createdAt
                                      )}
                                    />
                                    <StatLine
                                      label="Selesai"
                                      value={formatDate(
                                        order.completedAt
                                      )}
                                    />
                                    <StatLine
                                      label="Pembayaran"
                                      value={
                                        order.paymentMethod ||
                                        '-'
                                      }
                                    />
                                    <StatLine
                                      label="Jasa Kirim"
                                      value={
                                        order.logisticService ||
                                        '-'
                                      }
                                    />
                                    <StatLine
                                      label="Harga Asli"
                                      value={formatIDR(
                                        order.originalPrice ||
                                          0
                                      )}
                                    />
                                    <StatLine
                                      label="Diskon"
                                      value={formatIDR(
                                        order.totalDiscount ||
                                          0
                                      )}
                                      valueClass="text-destructive"
                                    />
                                    {Object.entries(
                                      order.fees || {}
                                    ).map(
                                      ([
                                        feeKey,
                                        feeValue,
                                      ]) => (
                                        <StatLine
                                          key={feeKey}
                                          label={`Fee ${feeLabels[feeKey as keyof typeof feeLabels] || feeKey}`}
                                          value={formatIDR(
                                            feeValue || 0
                                          )}
                                          valueClass="text-destructive"
                                        />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
