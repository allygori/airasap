'use client';

import { MoreVertical } from 'lucide-react';
import { Row } from '@tanstack/react-table';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CollectionRowActionsProps<
  TData extends { _id: string; slug?: string },
> = {
  row: Row<TData>;
  editUrl?: string;
  viewUrl?: string;
  endpoint?: string;
  onDelete?: (id: string) => void;
  label?: string;
};

export function CollectionRowActions<
  TData extends { _id: string; slug?: string },
>({
  row,
  editUrl,
  viewUrl,
  endpoint,
  onDelete,
  label = 'Item',
}: CollectionRowActionsProps<TData>) {
  const deleteItem = async (id: string) => {
    if (
      !confirm(
        `Are you sure you want to delete this ${label.toLowerCase()}?`
      )
    )
      return;
    try {
      if (onDelete) {
        onDelete(id);
      } else if (endpoint) {
        const res = await fetch(`${endpoint}/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete');
        toast.success(`${label} deleted successfully`);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      toast.error(
        `Failed to delete ${label.toLowerCase()}`
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-[160px]"
      >
        {editUrl && (
          <DropdownMenuItem
            onClick={() =>
              (window.location.href = `${editUrl}/${row.original._id}`)
            }
          >
            Edit
          </DropdownMenuItem>
        )}
        {viewUrl && row.original.slug && (
          <DropdownMenuItem
            onClick={() =>
              window.open(
                `${viewUrl}/${row.original.slug}`,
                '_blank'
              )
            }
          >
            View Live
          </DropdownMenuItem>
        )}
        {(editUrl || viewUrl) && <DropdownMenuSeparator />}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => deleteItem(row.original._id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
