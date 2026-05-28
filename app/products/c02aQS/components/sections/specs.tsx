import Container from '@/components/shared/general/container';
import { SizeGuideModal } from './size-guide-modal';

type Props = {
  className?: string;
};

const specsData = [
  { label: 'Merk', value: 'No Brand' },
  { label: 'Asal Produk', value: 'Lokal' },
  { label: 'Bahan', value: 'Katun Toyobo' },
  { label: 'Masa Berlaku', value: 'Tidak Ada' },
  { label: 'Dikirim Dari', value: 'Kota Bandung' },
];

const Specs = ({ className = '' }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`bg-background w-full`}
        classObject={{ padding: 'px-3 md:px-5 py-4' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-foreground text-sm font-semibold tracking-wider uppercase">
            Spesifikasi Produk
          </h2>
          <SizeGuideModal />
        </div>
        <div className="grid grid-cols-1 gap-y-3">
          {specsData.map((spec, index) => (
            <div
              key={index}
              className="border-border flex border-b pb-2 last:border-0"
            >
              <span className="text-muted-foreground w-32 text-sm">
                {spec.label}
              </span>
              <span className="text-foreground flex-1 text-sm">
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Specs;
