'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/ui';
import Container from '@/components/shared/general/container';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ShoppingCart01Icon,
  Share01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import {
  ActionSheet,
  ActionSheetContent,
  ActionSheetClose,
  ActionSheetConfirm,
} from '@/components/pasaria/ui/action-sheet';
import { variant } from '@/app/products/c02aQS/lib/constants';
import { useProductContext } from '../product-context';

type Props = {
  className?: string;
};

const CTA = ({ className = '' }: Props) => {
  const { selectedVariants, setSelectedVariant } =
    useProductContext();
  const selectedColorValue = selectedVariants.find(
    (v) => v.key === 'Warna'
  )?.value;
  const selectedSizeValue = selectedVariants.find(
    (v) => v.key === 'Ukuran'
  )?.value;

  const selectedColor =
    variant.colors.find(
      (c) => c.value === selectedColorValue
    ) || variant.colors[0];
  const selectedSize =
    variant.sizes.find(
      (s) => s.value === selectedSizeValue
    ) || variant.sizes[0];
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({});

  const toggleOpen = (state: boolean) => {
    setIsOpen(state);
  };

  return (
    <>
      <section
        className={`border-border bg-background/80 fixed bottom-0 left-0 z-40 w-full border-t backdrop-blur-xl ${className}`}
      >
        <Container
          className={`w-full`}
          classObject={{ padding: 'px-3 md:px-5 py-3' }}
        >
          <div className="flex items-center gap-3">
            <button className="text-foreground hover:text-primary flex flex-col items-center justify-center px-2 transition-colors">
              <HugeiconsIcon icon={Share01Icon} size={20} />
              <span className="text-tiny font-medium">
                Bagikan
              </span>
            </button>
            <div className="bg-border h-8 w-px" />
            <button
              onClick={() => toggleOpen(true)}
              className="text-foreground hover:text-primary flex flex-col items-center justify-center px-2 transition-colors"
            >
              <HugeiconsIcon
                icon={ShoppingCart01Icon}
                size={20}
              />
              <span className="text-tiny font-medium">
                Keranjang
              </span>
            </button>
            <button
              onClick={() => toggleOpen(true)}
              className="bg-primary text-primary-foreground ml-2 flex-1 rounded-sm py-3 text-sm font-bold transition-transform active:scale-95"
            >
              Beli Sekarang
            </button>
          </div>
        </Container>
      </section>

      <ActionSheet
        open={isOpen}
        onOpenChange={(v) => toggleOpen(v)}
        onConfirm={(d) => setData(d)}
      >
        <ActionSheetContent className="z-50 overflow-hidden px-0 pt-3 pb-0 sm:max-w-md">
          <ActionSheetClose className="text-muted-foreground hover:bg-muted absolute top-3 right-3 z-10 inline-flex items-center justify-center rounded-full p-1 focus:outline-none">
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </ActionSheetClose>

          <div className="flex max-h-[55vh] flex-col overflow-y-auto">
            <div className="border-border flex flex-row items-end border-b px-4 pt-2 pb-3">
              <div className="border-border bg-muted/20 mr-3 flex items-center justify-center rounded-md border p-1">
                {selectedColor?.src && (
                  <Image
                    src={selectedColor.src}
                    alt={selectedColor.name}
                    className="aspect-square h-16 w-auto rounded-sm object-cover"
                  />
                )}
              </div>
              <div className="pb-0.5">
                <p className="text-primary mb-0.5 text-base font-bold">
                  Rp85.000
                </p>
                <p className="text-muted-foreground m-0 text-xs font-medium">
                  Stok: 1827
                </p>
              </div>
            </div>

            <div className="border-border border-b px-4 py-3">
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Warna
              </h3>
              <ul className="-mx-1 my-0 flex flex-row flex-wrap p-0">
                {variant.colors.map((color, key) => {
                  return (
                    <li
                      key={key}
                      className="p-1"
                      onClick={() => {
                        setSelectedVariant(
                          'Warna',
                          color.value
                        );
                      }}
                    >
                      <div
                        className={cn(
                          'inline-flex cursor-pointer flex-row flex-wrap items-center rounded-md py-1 pr-2.5 pl-1 transition-all',
                          color.value ===
                            selectedColor?.value
                            ? 'border-primary bg-primary/5 text-primary ring-primary ring-1'
                            : 'bg-muted text-foreground hover:bg-muted/80 border border-transparent'
                        )}
                      >
                        <Image
                          src={color.src}
                          alt={color.name}
                          className="mr-1.5 h-6 w-6 rounded-sm object-cover"
                        />
                        <p className="text-xs font-medium">
                          {color.name}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-border border-b px-4 py-3">
              <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Ukuran
              </h3>
              <ul className="-mx-1 my-0 flex flex-row flex-wrap p-0">
                {variant.sizes.map((size, key) => {
                  return (
                    <li
                      key={key}
                      className="p-1"
                      onClick={() => {
                        setSelectedVariant(
                          'Ukuran',
                          size.value
                        );
                      }}
                    >
                      <div
                        className={cn(
                          'inline-flex min-w-10 cursor-pointer items-center justify-center rounded-md border px-2.5 py-1.5 transition-all',
                          size.value === selectedSize?.value
                            ? 'border-primary bg-primary/5 text-primary ring-primary ring-1'
                            : 'bg-muted text-foreground hover:bg-muted/80 border-transparent'
                        )}
                      >
                        <p className="text-xs font-medium uppercase">
                          {size.name}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="px-4 py-4">
              <div className="flex w-full items-center justify-between">
                <p className="text-sm font-semibold">
                  Jumlah
                </p>
                <div className="border-border flex items-center rounded-md border">
                  <button className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center transition-colors">
                    -
                  </button>
                  <span className="flex h-7 w-8 items-center justify-center text-sm font-medium">
                    1
                  </span>
                  <button className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center transition-colors">
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-border bg-background flex w-full flex-col border-t p-3">
            <ActionSheetConfirm className="bg-primary text-primary-foreground flex w-full items-center justify-center rounded-sm py-3 text-sm font-bold transition-transform active:scale-95">
              Konfirmasi
            </ActionSheetConfirm>
          </div>
        </ActionSheetContent>
      </ActionSheet>
    </>
  );
};

export default CTA;
