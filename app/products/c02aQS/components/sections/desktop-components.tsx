"use client";

import { useProductContext } from "../product-context";
import { variant } from "@/app/products/c02aQS/lib/constants";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart01Icon, Share01Icon, FavouriteIcon, Message01Icon } from "@hugeicons/core-free-icons";

export const DesktopVariants = () => {
  const { selectedVariants, setSelectedVariant } = useProductContext();
  const selectedColorValue = selectedVariants.find((v) => v.key === "Warna")?.value;
  const selectedSizeValue = selectedVariants.find((v) => v.key === "Ukuran")?.value;

  const selectedColor = variant.colors.find((c) => c.value === selectedColorValue) || variant.colors[0];
  const selectedSize = variant.sizes.find((s) => s.value === selectedSizeValue) || variant.sizes[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Colors */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-foreground">
          Pilih Warna: <span className="font-normal text-muted-foreground">{selectedColor?.name}</span>
        </h3>
        <ul className="-mx-1 my-0 flex flex-row flex-wrap p-0">
          {variant.colors.map((color, key) => (
            <li
              key={key}
              className="p-1"
              onClick={() => {
                setSelectedVariant("Warna", color.value);
              }}
            >
              <div
                className={cn(
                  "inline-flex cursor-pointer flex-row flex-wrap items-center rounded-lg py-1 pl-1 pr-2.5 transition-all",
                  color.value === selectedColor?.value
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border bg-background text-foreground hover:bg-muted border"
                )}
              >
                <Image
                  src={color.src}
                  alt={color.name}
                  className="mr-1.5 h-8 w-8 rounded-md object-cover"
                />
                <p className="text-sm font-medium">{color.name}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Sizes */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">
            Pilih Ukuran: <span className="font-normal text-muted-foreground">{selectedSize?.name}</span>
          </h3>
          <button className="text-sm text-primary font-bold hover:underline">Panduan Ukuran</button>
        </div>
        <ul className="-mx-1 my-0 flex flex-row flex-wrap p-0">
          {variant.sizes.map((size, key) => (
            <li
              key={key}
              className="p-1"
              onClick={() => {
                setSelectedVariant("Ukuran", size.value);
              }}
            >
              <div
                className={cn(
                  "inline-flex min-w-12 cursor-pointer items-center justify-center rounded-lg px-4 py-2 transition-all border",
                  size.value === selectedSize?.value
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <p className="text-sm font-medium uppercase">{size.name}</p>
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
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm flex flex-col gap-4">
      <h2 className="text-base font-bold text-foreground">Atur jumlah dan catatan</h2>
      
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-border">
          <button className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">-</button>
          <span className="flex h-8 w-12 items-center justify-center text-sm font-medium">1</span>
          <button className="flex h-8 w-8 items-center justify-center text-primary transition-colors hover:text-primary/80">+</button>
        </div>
        <p className="text-sm text-foreground">
          Stok: <span className="font-bold">1827</span>
        </p>
      </div>
      
      {/* Subtotal */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-base text-muted-foreground">Subtotal</p>
        <p className="text-lg font-bold text-foreground">Rp120.000</p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.98]">
          <HugeiconsIcon icon={ShoppingCart01Icon} size={20} />
          + Keranjang
        </button>
        <button className="w-full rounded-lg border border-primary bg-transparent py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5 active:scale-[0.98]">
          Beli Langsung
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary">
          <HugeiconsIcon icon={Message01Icon} size={16} />
          Chat
        </button>
        <div className="w-px h-4 bg-border"></div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary">
          <HugeiconsIcon icon={FavouriteIcon} size={16} />
          Wishlist
        </button>
        <div className="w-px h-4 bg-border"></div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary">
          <HugeiconsIcon icon={Share01Icon} size={16} />
          Share
        </button>
      </div>
    </div>
  );
};
