'use client';

import { useProductContext } from '../product-context';
import { variant } from '@/app/products/c02aQS/lib/constants';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ShoppingCart01Icon,
  Share01Icon,
  FavouriteIcon,
  Message01Icon,
} from '@hugeicons/core-free-icons';

export const DesktopVariants = () => {
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

  return (
    <div className="flex flex-col gap-4">
      {/* Colors */}
      <div>
        <h3 className="text-foreground mb-2 text-sm font-bold">
          Pilih Warna:{' '}
          <span className="text-muted-foreground font-normal">
            {selectedColor?.name}
          </span>
        </h3>
        <ul className="-mx-1 my-0 flex flex-row flex-wrap p-0">
          {variant.colors.map((color, key) => (
            <li
              key={key}
              className="p-1"
              onClick={() => {
                setSelectedVariant('Warna', color.value);
              }}
            >
              <div
                className={cn(
                  'inline-flex cursor-pointer flex-row flex-wrap items-center rounded-lg py-1 pr-2.5 pl-1 transition-all',
                  color.value === selectedColor?.value
                    ? 'border-primary bg-primary/5 text-primary ring-primary ring-1'
                    : 'border-border bg-background text-foreground hover:bg-muted border'
                )}
              >
                <Image
                  src={color.src}
                  alt={color.name}
                  className="mr-1.5 h-8 w-8 rounded-md object-cover"
                />
                <p className="text-sm font-medium">
                  {color.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sizes */}
      <div className="border-border/50 border-t pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-foreground text-sm font-bold">
            Pilih Ukuran:{' '}
            <span className="text-muted-foreground font-normal">
              {selectedSize?.name}
            </span>
          </h3>
          <button className="text-primary text-sm font-bold hover:underline">
            Panduan Ukuran
          </button>
        </div>
        <ul className="-mx-1 my-0 flex flex-row flex-wrap p-0">
          {variant.sizes.map((size, key) => (
            <li
              key={key}
              className="p-1"
              onClick={() => {
                setSelectedVariant('Ukuran', size.value);
              }}
            >
              <div
                className={cn(
                  'inline-flex min-w-12 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 transition-all',
                  size.value === selectedSize?.value
                    ? 'border-primary bg-primary/5 text-primary ring-primary ring-1'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                )}
              >
                <p className="text-sm font-medium uppercase">
                  {size.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const DesktopBuyCard = () => {
  return (
    <div className="border-border bg-background flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <h2 className="text-foreground text-base font-bold">
        Atur jumlah dan catatan
      </h2>

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <div className="border-border flex items-center rounded-md border">
          <button className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center transition-colors">
            -
          </button>
          <span className="flex h-8 w-12 items-center justify-center text-sm font-medium">
            1
          </span>
          <button className="text-primary hover:text-primary/80 flex h-8 w-8 items-center justify-center transition-colors">
            +
          </button>
        </div>
        <p className="text-foreground text-sm">
          Stok: <span className="font-bold">1827</span>
        </p>
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-muted-foreground text-base">
          Subtotal
        </p>
        <p className="text-foreground text-lg font-bold">
          Rp120.000
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-transform active:scale-[0.98]">
          <HugeiconsIcon
            icon={ShoppingCart01Icon}
            size={20}
          />
          + Keranjang
        </button>
        <button className="border-primary text-primary hover:bg-primary/5 w-full rounded-lg border bg-transparent py-2.5 text-sm font-bold transition-colors active:scale-[0.98]">
          Beli Langsung
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button className="text-foreground hover:text-primary flex items-center gap-1.5 text-xs font-medium">
          <HugeiconsIcon icon={Message01Icon} size={16} />
          Chat
        </button>
        <div className="bg-border h-4 w-px"></div>
        <button className="text-foreground hover:text-primary flex items-center gap-1.5 text-xs font-medium">
          <HugeiconsIcon icon={FavouriteIcon} size={16} />
          Wishlist
        </button>
        <div className="bg-border h-4 w-px"></div>
        <button className="text-foreground hover:text-primary flex items-center gap-1.5 text-xs font-medium">
          <HugeiconsIcon icon={Share01Icon} size={16} />
          Share
        </button>
      </div>
    </div>
  );
};
