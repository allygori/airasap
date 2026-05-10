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
  return (
    <section className={className}>
      <Container
        className={`w-full bg-background `}
        classObject={{ padding: "px-0 md:px-5" }}
      >
        <div className="grid grid-cols-2 gap-px bg-border border-y border-border">
          <div className="flex items-center bg-background px-3 py-3">
            <HugeiconsIcon icon={DeliveryTruck02Icon} size={20} className="mr-2 shrink-0 text-primary" />
            <span className="text-xs font-medium text-foreground">Estimasi: 21 - 24 Juni</span>
          </div>
          <div className="flex items-center bg-background px-3 py-3">
            <HugeiconsIcon icon={CreditCardIcon} size={20} className="mr-2 shrink-0 text-primary" />
            <span className="text-xs font-medium text-foreground">COD Cek Dulu</span>
          </div>
          <div className="flex items-center bg-background px-3 py-3">
            <HugeiconsIcon icon={ShieldBlockchainIcon} size={20} className="mr-2 shrink-0 text-primary" />
            <span className="text-xs font-medium text-foreground">100% Original</span>
          </div>
          <div className="flex items-center bg-background px-3 py-3">
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={20} className="mr-2 shrink-0 text-primary" />
            <span className="text-xs font-medium text-foreground">Bebas Pengembalian</span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TrustSignal;
