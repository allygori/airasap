'use client';

import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
// import { BlogPostType, MediaType, UserType, CategoryType, TagType } from "@/components/blog/types"
import {
  Calendar,
  Tag,
  User,
  MapPin,
  ExternalLink,
  Edit2,
  FileText,
  Image as ImageIcon,
  ShoppingBagIcon,
  HashIcon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatIDR } from '@/lib/formatter';
import { formatDate } from '@/lib/formatter/date';

type MediaType = {
  url: string;
};

type UserType = {
  name: string;
};

type CategoryType = {
  name: string;
};

interface ViewDrawerProps<T = any> {
  item: T;
  children: React.ReactNode;
  editUrl?: string;
  viewUrl?: string;
}

const snapPoints = ['148px', '355px', 1];

const StatLine = ({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => {
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
};

export function ViewDrawer<T extends Record<string, any>>({
  item,
  children,
  editUrl,
  viewUrl,
}: ViewDrawerProps<T>) {
  const isMobile = useIsMobile();
  const [snap, setSnap] = useState<number | string | null>(
    snapPoints[0]
  );

  // Detection logic
  // const isPost = 'title' in item && 'content' in item;
  // const isMedia = 'filename' in item && 'url' in item;
  // const isCategory =
  //   'name' in item && 'slug' in item && 'parent' in item;
  // const isTag =
  //   'name' in item && 'slug' in item && !('parent' in item);

  const title = 'Order Details';
  const description = 'Informasi detail tentang order';

  return (
    <Drawer
      direction={isMobile ? 'bottom' : 'right'}
      {...(isMobile
        ? ({
            snapPoints,
            activeSnapPoint: snap,
            setActiveSnapPoint: setSnap,
            fadeFromIndex: 1,
          } as never)
        : {})}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        className={
          isMobile ? 'p-0' : 'ml-auto p-0 sm:max-w-md'
        }
      >
        <div className="flex max-w-full min-w-0 flex-1 flex-col overflow-hidden">
          <DrawerHeader className="min-w-0 shrink-0 gap-1 border-b pb-4">
            <div className="mb-1 flex min-w-0 items-center gap-2 overflow-hidden">
              <ShoppingBagIcon className="size-4 shrink-0 text-[#EE4D2D]" />
              <Badge
                variant="outline"
                className="text-tiny h-5 shrink-0 truncate font-bold tracking-tighter text-[#EE4D2D] uppercase"
              >
                {/* Order */}
                {item.platform}
              </Badge>
            </div>
            <DrawerTitle className="text-xl leading-tight font-bold wrap-break-word">
              {title}
            </DrawerTitle>
            <DrawerDescription className="text-sm wrap-break-word">
              {description}
            </DrawerDescription>
          </DrawerHeader>

          <div className="scrollbar-hide min-h-0 min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto p-4">
            {/* Visual Preview for Post or Media */}
            {/* {(isPost || isMedia) && (
              <div className="bg-muted group relative aspect-video w-full overflow-hidden rounded-xl border shadow-sm">
                <Image
                  src={
                    isMedia
                      ? item.url
                      : (
                          item.featured_image as unknown as MediaType
                        )?.url || ''
                  }
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {!isMedia && !item.featured_image && (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-xs italic">
                    No preview image available
                  </div>
                )}
              </div>
            )} */}

            {/* Core Details Grid */}
            <div className="grid gap-6">
              <section className="bg-muted/30 border-muted-foreground/20 flex min-w-0 flex-row items-center justify-between rounded-xl border border-dashed p-4">
                <h2 className="text-muted-foreground/90 text-tiny mb-2 flex items-center gap-1.5 leading-relaxed font-bold tracking-widest uppercase">
                  <HashIcon className="size-3" />
                  {item.order_id}
                </h2>
                <p className="text-foreground/80 text-sm leading-relaxed wrap-break-word">
                  {item.username}
                </p>
              </section>

              <section>
                <StatLine
                  label="Pendapatan"
                  value={formatIDR(item.released_amount)}
                />
                <StatLine
                  label="Profit"
                  value={formatIDR(item.released_amount)}
                  valueClass={
                    item.released_amount !== undefined &&
                    item.released_amount !== 0
                      ? item.released_amount < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Dibuat"
                  value={formatDate(item.order_created_at)}
                />
                <StatLine
                  label="Selesai"
                  value={formatDate(
                    item.order_completed_at
                  )}
                />
                <StatLine
                  label="Pembayaran"
                  value={item.payment_method || '-'}
                />
                <StatLine
                  label="Jasa Kirim"
                  value={item.shipping_option || '-'}
                />
                <StatLine
                  label="Total Pembayaran Buyer"
                  value={formatIDR(item.total_payment)}
                />
                <StatLine
                  label="Total Pembayaran Buyer"
                  value={formatIDR(item.total_payment)}
                />
                <StatLine
                  label="Biaya Admin"
                  value={formatIDR(item.fee?.admin_fee)}
                  valueClass={
                    item.fee?.admin_fee !== undefined &&
                    item.fee?.admin_fee !== 0
                      ? item.fee?.admin_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Biaya Proses Pesanan"
                  value={formatIDR(
                    item.fee?.processing_fee
                  )}
                  valueClass={
                    item.fee?.processing_fee !==
                      undefined &&
                    item.fee?.processing_fee !== 0
                      ? item.fee?.processing_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Biaya Affiliate"
                  value={formatIDR(item.fee?.affiliate_fee)}
                  valueClass={
                    item.fee?.affiliate_fee !== undefined &&
                    item.fee?.affiliate_fee !== 0
                      ? item.fee?.affiliate_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Biaya Kampanye"
                  value={formatIDR(item.fee?.campaign_fee)}
                  valueClass={
                    item.fee?.campaign_fee !== undefined &&
                    item.fee?.campaign_fee !== 0
                      ? item.fee?.campaign_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Biaya Gratis Ongkir"
                  value={formatIDR(
                    item.fee?.shipping_saver_program_fee
                  )}
                  valueClass={
                    item.fee?.shipping_saver_program_fee !==
                      undefined &&
                    item.fee?.shipping_saver_program_fee !==
                      0
                      ? item.fee
                          ?.shipping_saver_program_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Biaya Transaksi"
                  value={formatIDR(
                    item.fee?.transaction_fee
                  )}
                  valueClass={
                    item.fee?.transaction_fee !==
                      undefined &&
                    item.fee?.transaction_fee !== 0
                      ? item.fee?.transaction_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Biaya Auto Top Up Iklan"
                  value={formatIDR(
                    item.fee?.auto_top_up_fee_from_income
                  )}
                  valueClass={
                    item.fee
                      ?.auto_top_up_fee_from_income !==
                      undefined &&
                    item.fee
                      ?.auto_top_up_fee_from_income !== 0
                      ? item.fee
                          ?.auto_top_up_fee_from_income < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Biaya Layanan"
                  value={formatIDR(item.fee?.service_fee)}
                  valueClass={
                    item.fee?.service_fee !== undefined &&
                    item.fee?.service_fee !== 0
                      ? item.fee?.service_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Ongkos Kirim Pengembalian Barang"
                  value={formatIDR(
                    item.fee?.return_shipping_fee
                  )}
                  valueClass={
                    item.fee?.return_shipping_fee !==
                      undefined &&
                    item.fee?.return_shipping_fee !== 0
                      ? item.fee?.return_shipping_fee < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Kembali ke Biaya Pengiriman Pengirim"
                  value={formatIDR(
                    item.fee?.return_to_sender_shipping_fee
                  )}
                  valueClass={
                    item.fee
                      ?.return_to_sender_shipping_fee !==
                      undefined &&
                    item.fee
                      ?.return_to_sender_shipping_fee !== 0
                      ? item.fee
                          ?.return_to_sender_shipping_fee <
                        0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                <StatLine
                  label="Refund Biaya Kirim"
                  value={formatIDR(
                    item.fee?.shipping_fee_refund
                  )}
                  valueClass={
                    item.fee?.shipping_fee_refund !==
                      undefined &&
                    item.fee?.shipping_fee_refund !== 0
                      ? item.fee?.shipping_fee_refund < 0
                        ? 'text-destructive'
                        : 'text-green-600'
                      : ''
                  }
                />
                {/* service_fee */}
                {/* return_shipping_fee */}
                {/* return_to_sender_shipping_fee */}
                {/* shipping_fee_refund */}
              </section>

              {/* Excerpt/Description Section */}
              {(item.excerpt || item.description) && (
                <section className="bg-muted/30 border-muted-foreground/20 min-w-0 rounded-xl border border-dashed p-4">
                  <h4 className="text-muted-foreground/60 text-tiny mb-2 flex items-center gap-1.5 font-bold tracking-widest uppercase">
                    <FileText className="size-3" />
                    Summary / Description
                  </h4>
                  <p className="text-foreground/80 text-sm leading-relaxed wrap-break-word italic">
                    &ldquo;
                    {item.excerpt || item.description}
                    &rdquo;
                  </p>
                </section>
              )}

              {/* Status & Metadata (Post specific) */}
              {/* {isPost && (
                <div className="grid min-w-0 grid-cols-2 gap-4">
                  <DetailBox
                    label="Status"
                    icon={
                      <CheckCircle
                        isPublished={
                          item.published_status ===
                          'published'
                        }
                      />
                    }
                  >
                    <Badge
                      variant={
                        item.published_status ===
                        'published'
                          ? 'default'
                          : 'outline'
                      }
                      className="text-tiny capitalize"
                    >
                      {item.published_status}
                    </Badge>
                  </DetailBox>
                  <DetailBox
                    label="Read Time"
                    icon={
                      <div className="size-1.5 rounded-full bg-blue-500" />
                    }
                  >
                    <span className="font-medium">
                      {item.reading_time || 0} minutes
                    </span>
                  </DetailBox>
                  <DetailBox
                    label="Author"
                    icon={<User className="size-3" />}
                  >
                    <span className="truncate">
                      {(item.author as unknown as UserType)
                        ?.name || 'Unknown'}
                    </span>
                  </DetailBox>
                  <DetailBox
                    label="Nano ID"
                    icon={
                      <div className="bg-muted-foreground size-1.5 rounded-full" />
                    }
                  >
                    <span className="text-tiny font-mono tracking-widest uppercase">
                      {item.nid}
                    </span>
                  </DetailBox>
                </div>
              )} */}

              {/* Media Specific Details */}
              {/* {isMedia && (
                <div className="grid min-w-0 grid-cols-2 gap-4">
                  <DetailBox
                    label="File Size"
                    icon={
                      <div className="size-1.5 rounded-full bg-amber-500" />
                    }
                  >
                    <span>
                      {(item.size / 1024).toFixed(1)} KB
                    </span>
                  </DetailBox>
                  <DetailBox
                    label="Type"
                    icon={
                      <div className="size-1.5 rounded-full bg-blue-500" />
                    }
                  >
                    <span className="truncate">
                      {item.mime_type}
                    </span>
                  </DetailBox>
                </div>
              )} */}

              {/* Category Specific */}
              {/* {isCategory && item.parent && (
                <DetailBox
                  label="Parent Category"
                  icon={<MapPin className="size-3" />}
                >
                  <Badge
                    variant="secondary"
                    className="text-tiny"
                  >
                    {(
                      item.parent as unknown as CategoryType
                    )?.name || 'N/A'}
                  </Badge>
                </DetailBox>
              )} */}

              {/* URLs Section */}
              {/* {(item.slug || isMedia) && (
                <section className="min-w-0">
                  <h4 className="text-muted-foreground/60 text-tiny mb-2 font-bold tracking-widest uppercase">
                    Permanent URL
                  </h4>
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="group relative min-w-0">
                      <p className="bg-muted/50 truncate rounded-lg border p-3 pr-16 font-mono text-[11px] leading-none select-all">
                        {isMedia
                          ? item.url
                          : `/blog/${item.slug}`}
                      </p>
                      <button
                        onClick={() => {
                          const url = isMedia
                            ? item.url
                            : `${window.location.origin}/blog/${item.slug}`;
                          if (!isMobile) {
                            navigator.clipboard.writeText(
                              url
                            );
                          }
                        }}
                        className="bg-background absolute top-1/2 right-2 -translate-y-1/2 rounded border px-2 py-1 text-[9px] font-bold opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </section>
              )} */}

              {/* Timestamps */}
              <div className="text-muted-foreground/60 text-tiny flex min-w-0 flex-wrap items-center justify-between gap-2 border-t pt-4">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" /> Added{' '}
                  {new Date(
                    item.created_at
                  ).toLocaleDateString()}
                </span>
                {item.updated_at && (
                  <span>
                    Updated{' '}
                    {new Date(
                      item.updated_at
                    ).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter className="bg-muted/10 shrink-0 border-t">
            <div className="flex w-full flex-col gap-2">
              {editUrl && (
                <Button
                  className="h-11 w-full rounded-xl shadow-sm"
                  onClick={() =>
                    (window.location.href = `${editUrl}/${item.order_id}`)
                  }
                >
                  <Edit2 className="mr-2 size-4" />
                  Edit Order
                </Button>
              )}
              {viewUrl && item.slug && (
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl"
                  onClick={() =>
                    window.open(
                      `${viewUrl}/${item.slug}`,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="mr-2 size-4" />
                  View Live Site
                </Button>
              )}
              <DrawerClose asChild>
                <Button
                  variant="secondary"
                  className="h-11 w-full rounded-xl"
                >
                  Close Preview
                </Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DetailBox({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex min-w-0 flex-col gap-1.5 rounded-xl border p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <span className="text-muted-foreground/50 flex min-w-0 items-center gap-1 text-[9px] font-bold tracking-widest uppercase">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <div className="min-w-0 truncate py-0.5 text-sm leading-none font-semibold">
        {children}
      </div>
    </div>
  );
}

function CheckCircle({
  isPublished,
}: {
  isPublished: boolean;
}) {
  return (
    <div
      className={`size-1.5 rounded-full ${isPublished ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}
    />
  );
}
