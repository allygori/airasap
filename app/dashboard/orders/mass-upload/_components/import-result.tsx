import { Badge } from '@/components/ui/badge';

export type MassUploadOrderResult = {
  order_id: string;
  status: 'created' | 'updated' | 'ignored';
  message?: string;
};

export type MassUploadResult = {
  created_count: number;
  updated_count: number;
  total_rows: number;
  total_orders: number;
  order_results: MassUploadOrderResult[];
};

const statusLabel: Record<
  MassUploadOrderResult['status'],
  string
> = {
  created: 'Ditambahkan',
  updated: 'Diperbarui',
  ignored: 'Diabaikan',
};

const statusVariant: Record<
  MassUploadOrderResult['status'],
  'default' | 'secondary' | 'outline'
> = {
  created: 'default',
  updated: 'secondary',
  ignored: 'outline',
};

export function MassUploadResultView({
  result,
}: {
  result: MassUploadResult;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
          Upload Berhasil!
        </span>
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {result.created_count} order ditambahkan,{' '}
          {result.updated_count} order diperbarui. Total{' '}
          {result.total_orders} order dari{' '}
          {result.total_rows} baris.
        </span>
      </div>

      {result.order_results.length > 0 && (
        <div className="bg-background/70 flex min-w-0 flex-col gap-2 rounded-md border border-emerald-200/70 p-2 dark:border-emerald-800/70">
          <span className="text-foreground text-xs font-semibold">
            Detail order
          </span>
          <div className="flex max-h-56 min-w-0 flex-col gap-1 overflow-y-auto pr-1">
            {result.order_results.map((order) => (
              <div
                key={`${order.order_id}-${order.status}`}
                className="flex min-w-0 items-start justify-between gap-2 rounded-sm px-1 py-1 text-xs"
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate font-medium">
                    {order.order_id}
                  </p>
                  {order.message && (
                    <p className="text-muted-foreground truncate">
                      {order.message}
                    </p>
                  )}
                </div>
                <Badge
                  variant={statusVariant[order.status]}
                  className="shrink-0"
                >
                  {statusLabel[order.status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
