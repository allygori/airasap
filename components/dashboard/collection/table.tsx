'use client';

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Table as ReactTable,
  flexRender,
  Row,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CollectionPagination } from './pagination';
import { CollectionToolbar } from './toolbar';
import { Loader2 } from 'lucide-react';

type CollectionTableProps<TData extends { _id: string }> = {
  table: ReactTable<TData>;
  data: TData[];
  setData?: React.Dispatch<React.SetStateAction<TData[]>>;
  isLoading?: boolean;
  searchFields?: string[];
  primarySearchField?: string;
  placeholder?: string;
  isSortable?: boolean;
  onRowClick?: (row: TData) => void;
};

function DraggableRow<TData extends { _id: string }>({
  row,
  onRowClick,
}: {
  row: Row<TData>;
  onRowClick?: (row: TData) => void;
}) {
  const { transform, transition, setNodeRef, isDragging } =
    useSortable({
      id: row.original._id,
    });

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className={`relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 ${onRowClick ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(
            cell.column.columnDef.cell,
            cell.getContext()
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function CollectionTable<
  TData extends { _id: string },
>({
  table,
  data,
  setData,
  isLoading,
  searchFields,
  primarySearchField,
  placeholder,
  isSortable = false,
  onRowClick,
}: CollectionTableProps<TData>) {
  const columnsCount = table.getAllColumns().length;
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ _id }) => _id) || [],
    [data]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (
      active &&
      over &&
      active.id !== over.id &&
      setData
    ) {
      setData((prevData) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(prevData, oldIndex, newIndex);
      });
    }
  }

  const renderRows = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell
            colSpan={columnsCount}
            className="h-64 text-center"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="text-primary/60 size-8 animate-spin" />
              <p className="text-muted-foreground animate-pulse text-sm">
                Loading collection...
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (!table.getRowModel().rows?.length) {
      return (
        <TableRow>
          <TableCell
            colSpan={columnsCount}
            className="h-24 text-center"
          >
            No items found in this collection.
          </TableCell>
        </TableRow>
      );
    }

    if (isSortable && setData) {
      return (
        <SortableContext
          items={dataIds}
          strategy={verticalListSortingStrategy}
        >
          {table.getRowModel().rows.map((row) => (
            <DraggableRow
              key={row.id}
              row={row}
              onRowClick={onRowClick}
            />
          ))}
        </SortableContext>
      );
    }

    return table.getRowModel().rows.map((row) => (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() && 'selected'}
        className={
          onRowClick
            ? 'hover:bg-muted/50 cursor-pointer'
            : ''
        }
        onClick={() => onRowClick?.(row.original)}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(
              cell.column.columnDef.cell,
              cell.getContext()
            )}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <div className="space-y-4">
      <CollectionToolbar
        table={table}
        searchFields={searchFields}
        primarySearchField={primarySearchField}
        placeholder={placeholder}
      />
      <div className="rounded-md border">
        {isSortable ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader>
                {table
                  .getHeaderGroups()
                  .map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef
                                  .header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
              </TableHeader>
              <TableBody>{renderRows()}</TableBody>
            </Table>
          </DndContext>
        ) : (
          <Table>
            <TableHeader>
              {table
                .getHeaderGroups()
                .map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef
                                .header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
            </TableHeader>
            <TableBody>{renderRows()}</TableBody>
          </Table>
        )}
      </div>
      <CollectionPagination table={table} />
    </div>
  );
}
