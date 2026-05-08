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
        <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#0a4a4a] transition-colors hover:bg-slate-100 hover:text-[#ff7a45]">
          <HugeiconsIcon icon={RulerIcon} size={14} />
          Panduan Ukuran
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Panduan Ukuran Hana Dress</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Lingkar Dada</th>
                <th className="px-4 py-2 font-medium">Panjang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sizeData.map((row) => (
                <tr key={row.size}>
                  <td className="px-4 py-2 font-semibold text-slate-800">{row.size}</td>
                  <td className="px-4 py-2 text-slate-600">{row.chest}</td>
                  <td className="px-4 py-2 text-slate-600">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-slate-400">
          * Ukuran dapat berbeda 1-2 cm karena proses produksi massal.
        </p>
      </DialogContent>
    </Dialog>
  );
}
