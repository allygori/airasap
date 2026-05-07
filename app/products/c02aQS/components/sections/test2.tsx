"use client";

import { useState } from "react";
import clsx from "clsx";
import * as Dialog from "@allygory/dialog";

type Props = {
  className?: string;
};

const Test2 = ({ className = "" }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = (state: boolean) => {
    setIsOpen(state);
  };

  return (
    <section className={className}>
      <Dialog.Root
        open={isOpen}
        modal={true}
        onOpenChange={(v) => toggleOpen(v)}
      >
        <Dialog.Trigger asChild>
          <button
            role="button"
            className="rounded-md border p-4 text-lg font-medium text-red-500"
          >
            TRIGGER
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-overlayShow" />
          <Dialog.Content
            // onInteractOutside={(e) => e.preventDefault()}
            className={clsx(
              "fixed z-50",
              "w-[95vw] max-w-md rounded-lg p-4 md:w-full",
              "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "bg-white dark:bg-gray-800",
              "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
              "border-2 border-gray-600",
              "data-[state=open]:animate-contentShow",
            )}
          >
            <Dialog.Title className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Edit profile
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm font-normal text-gray-700 dark:text-gray-400">
              Make changes to your profile here. Click save when you&apos;re
              done.
            </Dialog.Description>

            <form className="mt-2 space-y-2">
              <fieldset>
                {/* <legend>Choose your favorite monster</legend> */}
                <label
                  htmlFor="firstName"
                  className="text-xs font-medium text-gray-700 dark:text-gray-400"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Tim"
                  autoComplete="given-name"
                  className={clsx(
                    "mt-1 block w-full rounded-md",
                    "text-sm text-gray-700 placeholder:text-gray-500 dark:text-gray-400 dark:placeholder:text-gray-600",
                    "border border-gray-400 focus-visible:border-transparent dark:border-gray-700 dark:bg-gray-800",
                    "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
                    "p-2",
                  )}
                />
              </fieldset>
              <fieldset>
                <label
                  htmlFor="familyName"
                  className="text-xs font-medium text-gray-700 dark:text-gray-400"
                >
                  Family Name
                </label>
                <input
                  id="familyName"
                  type="text"
                  placeholder="Cook"
                  autoComplete="family-name"
                  className={clsx(
                    "mt-1 block w-full rounded-md",
                    "text-sm text-gray-700 placeholder:text-gray-500 dark:text-gray-400 dark:placeholder:text-gray-600",
                    "border border-gray-400 focus-visible:border-transparent dark:border-gray-700 dark:bg-gray-800",
                    "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
                    "p-2",
                  )}
                />
              </fieldset>
            </form>

            <div className="mt-4 flex justify-end">
              <Dialog.Close
                className={clsx(
                  "inline-flex select-none justify-center rounded-md px-4 py-2 text-sm font-medium",
                  "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:text-gray-100 dark:hover:bg-purple-600",
                  "border border-transparent",
                  "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
                )}
              >
                Save
              </Dialog.Close>
            </div>

            <Dialog.Close
              className={clsx(
                "absolute right-3.5 top-3.5 inline-flex items-center justify-center rounded-full p-1",
                "focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75",
              )}
            >
              {/* <Cross1Icon className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400" /> */}
              x
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
};

export default Test2;
