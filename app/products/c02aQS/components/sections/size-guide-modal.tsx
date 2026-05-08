import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { RulerIcon } from "@hugeicons/core-free-icons";

const sizeData = [
  { size: "S", chest: "92 cm", length: "135 cm" },
  { size: "M", chest: "96 cm", length: "138 cm" },
  { size: "L", chest: "100 cm", length: "140 cm" },
  { size: "XL", chest: "104 cm", length: "142 cm" },
];

export function SizeGuideModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-strong hover:text-secondary">
          <HugeiconsIcon icon={RulerIcon} size={14} />
          Panduan Ukuran
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Panduan Ukuran Hana Dress</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-ink-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Lingkar Dada</th>
                <th className="px-4 py-2 font-medium">Panjang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sizeData.map((row) => (
                <tr key={row.size}>
                  <td className="px-4 py-2 font-semibold text-foreground">{row.size}</td>
                  <td className="px-4 py-2 text-foreground/80">{row.chest}</td>
                  <td className="px-4 py-2 text-foreground/80">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-ink-muted">
          * Ukuran dapat berbeda 1-2 cm karena proses produksi massal.
        </p>
      </DialogContent>
    </Dialog>
  );
}
