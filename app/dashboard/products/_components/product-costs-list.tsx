'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/formatter/date';
import { ProductCostResponseDTO } from '@/modules/product-costs/product-cost.dto';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type ProductCostsListProps = {
  productId: string;
};

const ProductCostsList = ({
  productId,
}: ProductCostsListProps) => {
  const [data, setData] = useState<
    ProductCostResponseDTO[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/v1/dashboard/product-costs/${productId}`
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.message || 'Gagal mengambil data'
          );
        setData(result.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex min-h-100 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse font-medium">
            Memuat data HPP...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-100 flex-1 items-center justify-center">
        <div className="text-center">
          <h3 className="text-destructive text-lg font-semibold">
            Data HPP tidak ditemukan
          </h3>
          <p className="text-muted-foreground">
            ID HPP mungkin salah atau telah dihapus.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              {/* <Checkbox
                        checked={
                          selectedProductIds.size ===
                            products.length &&
                          products.length > 0
                        }
                        onCheckedChange={
                          onToggleAllProducts
                        }
                        className="cursor-pointer"
                      /> */}
            </TableHead>
            <TableHead>Produk</TableHead>
            <TableHead className="text-right">
              Qty Terjual
            </TableHead>
            <TableHead className="w-48 text-right">
              HPP / Unit (Rp)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((cost) => (
            <TableRow key={`${cost._id}`}>
              <TableCell>
                {/* <Checkbox
                  checked={selectedProductIds.has(
                    cost.key
                  )}
                  onCheckedChange={() =>
                    onToggleProductSelect(cost.key)
                  }
                  className="cursor-pointer"
                /> */}
              </TableCell>
              <TableCell
                className="max-w-50 truncate font-medium"
                title={cost.product}
              >
                {cost.product}
                {/* <div className="text-muted-foreground text-xs">
                  {cost.variationName ? (
                    <span>
                      {cost.id} {' - '}{' '}
                      {cost.variationName}
                    </span>
                  ) : (
                    <span>{cost.id}</span>
                  )}
                </div> */}
              </TableCell>
              <TableCell className="text-right">
                {formatDate(cost.effective_from)}
              </TableCell>
              <TableCell className="text-right">
                {/* <Input
                  type="number"
                  className="text-right"
                  value={cost.cogs || ''}
                  onChange={(event) =>
                    onSingleCOGSChange(
                      cost.key,
                      event.target.value
                    )
                  }
                  placeholder="0"
                /> */}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground py-8 text-center"
              >
                Tidak ada data ditemukan ini.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductCostsList;
