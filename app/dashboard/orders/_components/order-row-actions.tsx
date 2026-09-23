'use client';

import type { Row } from '@tanstack/react-table';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Edit02Icon,
  MoreVerticalIcon,
} from '@hugeicons/core-free-icons';

import type { OrderResponseDTO } from '@/modules/orders/order.dto';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type OrderRowActionsProps = {
  row: Row<OrderResponseDTO>;
};

export function OrderRowActions({
  row,
}: OrderRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
            size="icon"
          />
        }
      >
        <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
        <span className="sr-only">Buka menu actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() =>
            (window.location.href = `/dashboard/orders/${row.original._id}`)
          }
        >
          <HugeiconsIcon icon={Edit02Icon} size={16} />
          Edit order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
