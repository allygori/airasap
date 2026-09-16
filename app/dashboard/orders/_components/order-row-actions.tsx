'use client';

import { useState } from 'react';
import type { Row } from '@tanstack/react-table';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BookOpenCheckIcon,
  CheckmarkCircle02Icon,
  Edit02Icon,
  Loading03Icon,
  MoreVerticalIcon,
  Refresh01Icon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

import type { OrderResponseDTO } from '@/modules/orders/order.dto';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type OrderAccountingStatus =
  | 'pending'
  | 'posted'
  | 'blocked';

type OrderRowActionsProps = {
  row: Row<OrderResponseDTO>;
};

export function OrderRowActions({
  row,
}: OrderRowActionsProps) {
  const [accountingStatus, setAccountingStatus] =
    useState<OrderAccountingStatus>(
      row.original.accounting_status ?? 'pending'
    );
  const [isPosting, setIsPosting] = useState(false);

  const isPosted =
    accountingStatus === 'posted' ||
    Boolean(row.original.accounting_journal_entry);
  const isBlocked = accountingStatus === 'blocked';

  const postToAccounting = async () => {
    if (isPosting || isPosted) return;

    try {
      setIsPosting(true);
      const response = await fetch(
        `/api/v1/dashboard/orders/${row.original._id}/accounting`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      const payload = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Order gagal dikonversi ke accounting.'
        );
      }

      setAccountingStatus('posted');
      toast.success(
        'Order berhasil dikonversi ke journal dan inventory.'
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Order gagal dikonversi ke accounting.'
      );
    } finally {
      setIsPosting(false);
    }
  };

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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPosting || isPosted}
          onClick={postToAccounting}
        >
          <HugeiconsIcon
            icon={
              isPosting
                ? Loading03Icon
                : isPosted
                  ? CheckmarkCircle02Icon
                  : isBlocked
                    ? Refresh01Icon
                    : BookOpenCheckIcon
            }
            size={16}
            className={
              isPosting ? 'animate-spin' : undefined
            }
          />
          {isPosted
            ? 'Sudah dikonversi ke accounting'
            : isBlocked
              ? 'Coba konversi lagi'
              : 'Konversi ke accounting'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
