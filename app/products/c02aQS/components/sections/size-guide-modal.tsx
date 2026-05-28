import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HugeiconsIcon } from '@hugeicons/react';
import { RulerIcon } from '@hugeicons/core-free-icons';

const sizeData = [
  { size: 'S', chest: '92 cm', length: '135 cm' },
  { size: 'M', chest: '96 cm', length: '138 cm' },
  { size: 'L', chest: '100 cm', length: '140 cm' },
  { size: 'XL', chest: '104 cm', length: '142 cm' },
];

export function SizeGuideModal() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className="border-border bg-muted text-primary hover:bg-accent hover:text-primary flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors" />
        }
      >
        <HugeiconsIcon icon={RulerIcon} size={14} />
        Panduan Ukuran
      </DialogTrigger>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Panduan Ukuran Hana Dress
          </DialogTitle>
        </DialogHeader>
        <div className="border-border mt-4 overflow-hidden rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">
                  Size
                </th>
                <th className="px-4 py-2 font-medium">
                  Lingkar Dada
                </th>
                <th className="px-4 py-2 font-medium">
                  Panjang
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {sizeData.map((row) => (
                <tr key={row.size}>
                  <td className="text-foreground px-4 py-2 font-semibold">
                    {row.size}
                  </td>
                  <td className="text-foreground/80 px-4 py-2">
                    {row.chest}
                  </td>
                  <td className="text-foreground/80 px-4 py-2">
                    {row.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-tiny text-muted-foreground mt-3">
          * Ukuran dapat berbeda 1-2 cm karena proses
          produksi massal.
        </p>
      </DialogContent>
    </Dialog>
  );
}
