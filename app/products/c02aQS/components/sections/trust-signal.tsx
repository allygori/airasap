import Container from "@/components/shared/general/container";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DeliveryTruck02Icon,
  ShieldBlockchainIcon,
  ArrowTurnBackwardIcon,
  CreditCardIcon
} from "@hugeicons/core-free-icons";

type Props = {
  className?: string;
};

const TrustSignal = ({ className = "" }: Props) => {
  const brandColor = "#0a4a4a"; // Pasaria Primary Teal

  return (
    <section className={className}>
      <Container
        className={`w-full bg-white md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-0 md:px-5" }}
      >
        <div className="grid grid-cols-2 gap-px bg-slate-200 border-y border-slate-200">
          <div className="flex items-center bg-white px-3 py-3">
            <HugeiconsIcon icon={DeliveryTruck02Icon} size={20} className="mr-2 shrink-0" style={{ color: brandColor }} />
            <span className="text-xs font-medium text-slate-700">Estimasi: 21 - 24 Juni</span>
          </div>
          <div className="flex items-center bg-white px-3 py-3">
            <HugeiconsIcon icon={CreditCardIcon} size={20} className="mr-2 shrink-0" style={{ color: brandColor }} />
            <span className="text-xs font-medium text-slate-700">COD Cek Dulu</span>
          </div>
          <div className="flex items-center bg-white px-3 py-3">
            <HugeiconsIcon icon={ShieldBlockchainIcon} size={20} className="mr-2 shrink-0" style={{ color: brandColor }} />
            <span className="text-xs font-medium text-slate-700">100% Original</span>
          </div>
          <div className="flex items-center bg-white px-3 py-3">
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={20} className="mr-2 shrink-0" style={{ color: brandColor }} />
            <span className="text-xs font-medium text-slate-700">Bebas Pengembalian</span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TrustSignal;
