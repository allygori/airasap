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
  const isPost = 'title' in item && 'content' in item;
  const isMedia = 'filename' in item && 'url' in item;
  const isCategory =
    'name' in item && 'slug' in item && 'parent' in item;
  const isTag =
    'name' in item && 'slug' in item && !('parent' in item);

  const title = 'Product Details';
  const description = 'Informasi detail tentang produk';

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
            {/* <div className="mb-1 flex min-w-0 items-center gap-2 overflow-hidden">
              <FileText className="size-4 shrink-0 text-blue-500" />
              <Badge
                variant="outline"
                className="text-tiny h-5 shrink-0 truncate font-bold tracking-tighter uppercase"
              >
                Product
              </Badge>
            </div> */}
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

            <section className="bg-muted/30 border-muted-foreground/20 flex min-w-0 flex-col rounded-xl border border-dashed px-3 py-4">
              <h2 className="text-foreground/80 flex items-center gap-1.5 text-xs leading-normal font-bold tracking-widest uppercase">
                {/* <HashIcon className="size-3" /> */}
                {item.name}
              </h2>
              <p className="text-muted-foreground/90 text-sm leading-relaxed wrap-break-word">
                {item.product_id}
              </p>
            </section>

            <section>
              <DetailBox label="Options / variants:">
                {(item.options || []).length === 0 ? (
                  <p className="text-foreground/80 mb-2 flex min-w-0 items-center gap-1 text-xs font-bold">
                    Tidak Ada
                  </p>
                ) : (
                  <div className="flex flex-col">
                    {(item.options || []).map(
                      (option: string[], idx: number) => {
                        return (
                          <div key={idx} className="mb-4">
                            <p className="text-muted-foreground/50 mb-2 flex min-w-0 items-center gap-1 text-xs font-bold">
                              Opsi &nbsp; {idx + 1}:
                            </p>
                            <ul className="flex flex-1 flex-row flex-wrap gap-2">
                              {(option || []).map(
                                (opt, idx2) => {
                                  return (
                                    <li key={idx2}>
                                      <Badge>{opt}</Badge>
                                    </li>
                                  );
                                }
                              )}
                            </ul>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
                {/* <pre>
                  {JSON.stringify(item.options, null, 2)}
                </pre> */}
              </DetailBox>
            </section>
          </div>

          <DrawerFooter className="bg-muted/10 shrink-0 border-t">
            <div className="flex w-full flex-col gap-2">
              {editUrl && (
                <Button
                  className="h-11 w-full rounded-xl shadow-sm"
                  onClick={() =>
                    (window.location.href = `${editUrl}/${item._id}`)
                  }
                >
                  <Edit2 className="mr-2 size-4" />
                  Edit{' '}
                  {isPost
                    ? 'Content'
                    : isMedia
                      ? 'Asset'
                      : 'Details'}
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex min-w-0 flex-col gap-1.5 rounded-xl border p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <span className="text-muted-foreground/50 flex min-w-0 items-center gap-1 text-[9px] font-bold tracking-widest uppercase">
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
