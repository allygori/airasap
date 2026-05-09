import Container from "@/components/shared/general/container";
import { SizeGuideModal } from "./size-guide-modal";

type Props = {
  className?: string;
};

const specsData = [
  { label: "Merk", value: "No Brand" },
  { label: "Asal Produk", value: "Lokal" },
  { label: "Bahan", value: "Katun Toyobo" },
  { label: "Masa Berlaku", value: "Tidak Ada" },
  { label: "Dikirim Dari", value: "Kota Bandung" },
];

const Specs = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`w-full bg-background md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 py-4" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Spesifikasi Produk
          </h2>
          <SizeGuideModal />
        </div>
        <div className="grid grid-cols-1 gap-y-3">
          {specsData.map((spec, index) => (
            <div key={index} className="flex border-b border-border pb-2 last:border-0">
              <span className="w-32 text-sm text-muted-foreground">{spec.label}</span>
              <span className="flex-1 text-sm text-foreground">{spec.value}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Specs;
