"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatIDR } from "@/lib/formatter";
import type { SummaryItem } from "./types";

type SummaryAccordionProps = {
  data: SummaryItem[];
  idPrefix?: string;
};

export function SummaryAccordion({ data, idPrefix = "item-" }: SummaryAccordionProps) {
  if (!data || data.length === 0) return null;

  const allValues = data.map((_, index) => `${idPrefix}${index}`);

  return (
    <Accordion multiple defaultValue={allValues} className="w-full rounded-md border bg-white dark:bg-gray-950">
      {data.map((group, index) =>
        group.subItems && group.subItems.length > 0 ? (
          <AccordionItem value={`${idPrefix}${index}`} key={`${group.name}-${index}`} className="px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex w-full justify-between pr-4">
                <span className="text-left font-semibold">{group.name}</span>
                <span className={`font-semibold ${group.value < 0 ? "text-destructive" : ""}`}>
                  {formatIDR(group.value)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2 border-t pt-2">
                {group.subItems.map((subItem, subIndex) => (
                  <div key={`${subItem.name}-${subIndex}`} className="flex justify-between px-4">
                    <span className="text-muted-foreground">{subItem.name}</span>
                    <span className={subItem.value < 0 ? "text-destructive" : ""}>{formatIDR(subItem.value)}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ) : (
          <div key={`${group.name}-${index}`} className="flex justify-between border-b px-4 py-4 last:border-0">
            <span className="font-semibold">{group.name}</span>
            <span className={`font-semibold ${group.value < 0 ? "text-destructive" : ""}`}>
              {formatIDR(group.value)}
            </span>
          </div>
        )
      )}
    </Accordion>
  );
}
