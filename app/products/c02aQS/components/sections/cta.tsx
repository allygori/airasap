"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import * as ActionSheet from "@allygory/action-sheet";
import { variant } from "@/app/products/c02aQS/lib/constants";

type Props = {
  className?: string;
};

const CTA = ({ className = "" }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({});
  const [selected, setSelected] = useState({
    color: variant.colors[0],
    size: variant.sizes[0],
  });

  const toggleOpen = (state: boolean) => {
    setIsOpen(state);
  };

  return (
    <section className={className}>
      <ActionSheet.Root
        open={isOpen}
        onOpenChange={(v) => toggleOpen(v)}
        threshold={250}
        onConfirm={(d) => setData(d)}
      >
        <ActionSheet.Trigger asChild>
          <button
            role="button"
            className="fixed bottom-0 left-0 z-10 flex w-full items-center justify-center border bg-[#ee4d2d] py-3.5 text-base font-medium text-white"
          >
            Dapatkan Promonya
          </button>
        </ActionSheet.Trigger>
        <ActionSheet.Portal forceMount={true}>
          <ActionSheet.Overlay className="allygory-state-closed:px allygory-state-closed:-mx fixed inset-0 z-10 bg-black opacity-0 transition-opacity delay-0 duration-700 ease-in-out allygory-state-closed:h-1 allygory-state-closed:w-1 allygory-state-closed:border-0 allygory-state-open:opacity-80" />

          <ActionSheet.Content
            defaultOpen={false}
            className={clsx(
              "z-20",
              "fixed inset-x-4",
              "h-auto min-h-[475px] w-full rounded-t-2xl shadow-lg md:w-full",
              "bottom-0 left-0",
              "bg-white text-gray-800",
              "allygory-state-open:animate-action-sheet-slide-in-bottom",
              // "allygory-state-closed:animate-action-sheet-hide",
              "allygory-state-closed:animate-action-sheet-swipe-out-y",
              "allygory-swipe-direction-down:allygory-swipe-end:animate-action-sheet-swipe-out-y",
              "allygory-swipe-direction-down:translate-y-allygory-action-sheet-swipe-move-y",
              "allygory-swipe-cancel:translate-y-0",
              "allygory-swipe-cancel:duration-500",
              "allygory-swipe-cancel:ease-[ease]",
            )}
          >
            {/* action:close */}
            <ActionSheet.Close
              className={clsx(
                "absolute right-3.5 top-3.5 inline-flex items-center justify-center rounded-full p-1",
                "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
              )}
            >
              x
            </ActionSheet.Close>

            <div className="flex flex-col">
              <div className="flex flex-row items-end border-b border-gray-200 px-6 pb-3 pt-6">
                <div className="mr-2 flex items-center justify-center rounded-md border border-gray-200 p-1">
                  {selected?.color?.src && (
                    <Image
                      src={selected?.color?.src}
                      alt={selected?.color?.name}
                      className="aspect-square h-24 w-auto"
                    />
                  )}
                </div>
                <div>
                  <p className="mb-1 text-sm font-normal text-[#ee4d2d]">
                    Rp85.0000
                  </p>
                  <p className="m-0 text-xs font-normal">Stok: 1827</p>
                </div>
              </div>
              <div className="border-b border-gray-200 px-6 py-3">
                <h3 className="text-xs font-normal">Warna</h3>
                <ul className="-mx-1.5 my-0 flex flex-row flex-wrap p-0">
                  {variant.colors.map((color, key) => {
                    return (
                      <li
                        key={key}
                        className="p-1.5"
                        onClick={() => {
                          setSelected((prev) => {
                            return { color, size: prev.size };
                          });
                        }}
                      >
                        <div
                          className={clsx(
                            "inline-flex cursor-pointer flex-row flex-wrap items-center rounded-sm bg-gray-200 py-1 pl-1 pr-2.5",
                            `${color.value === selected?.color?.value ? "border border-[#ee4d2d] bg-transparent" : "border border-transparent bg-gray-200"}`,
                          )}
                        >
                          <Image
                            src={color.src}
                            alt={color.name}
                            className="mr-1.5 h-6 w-6"
                          />
                          <p className="text-2xs font-normal">{color.name}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="border-b border-gray-200 px-6 py-3">
                <h3 className="text-xs font-normal">Ukuran</h3>
                <ul className="-mx-1.5 my-0 flex flex-row flex-wrap p-0">
                  {variant.sizes.map((size, key) => {
                    return (
                      <li
                        key={key}
                        className="p-1.5"
                        onClick={() => {
                          setSelected((prev) => {
                            return { color: prev.color, size };
                          });
                        }}
                      >
                        <div
                          className={clsx(
                            "inline-flex cursor-pointer flex-row flex-wrap items-center rounded-sm px-2 py-1",
                            `${size.value === selected?.size?.value ? "border border-[#ee4d2d] bg-transparent" : "border border-transparent bg-gray-200"}`,
                          )}
                        >
                          <p className="text-2xs font-normal">{size.name}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="px-6 py-3">
                <div className="flex w-full flex-wrap">
                  <div>
                    <p className="text-xs font-normal">Jumlah</p>
                  </div>
                  <div></div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 flex w-full flex-col items-center bg-white">
              <span className="flex h-2 w-full bg-[#f6f6f6]" />
              <div className="w-full">
                {/* action:confirm */}
                <ActionSheet.Confirm
                  className={clsx(
                    "flex w-full flex-row items-center justify-center bg-green-500 py-2.5 text-white",
                    "m-2 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
                  )}
                >
                  Beli Sekarang
                </ActionSheet.Confirm>
              </div>
            </div>
          </ActionSheet.Content>
        </ActionSheet.Portal>
      </ActionSheet.Root>
    </section>
  );
};

export default CTA;
