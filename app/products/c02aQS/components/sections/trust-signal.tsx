import Container from '@/components/shared/general/container';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DeliveryTruck02Icon,
  ShieldBlockchainIcon,
  ArrowTurnBackwardIcon,
  CreditCardIcon,
} from '@hugeicons/core-free-icons';

type Props = {
  className?: string;
};

const TrustSignal = ({ className = '' }: Props) => {
  return (
    <section className={className}>
      <Container
        className={`bg-background w-full`}
        classObject={{ padding: 'px-0 md:px-5' }}
      >
        <div className="bg-border border-border grid grid-cols-2 gap-px border-y">
          <div className="bg-background flex items-center px-3 py-3">
            <HugeiconsIcon
              icon={DeliveryTruck02Icon}
              size={20}
              className="text-primary mr-2 shrink-0"
            />
            <span className="text-foreground text-xs font-medium">
              Estimasi: 21 - 24 Juni
            </span>
          </div>
          <div className="bg-background flex items-center px-3 py-3">
            <HugeiconsIcon
              icon={CreditCardIcon}
              size={20}
              className="text-primary mr-2 shrink-0"
            />
            <span className="text-foreground text-xs font-medium">
              COD Cek Dulu
            </span>
          </div>
          <div className="bg-background flex items-center px-3 py-3">
            <HugeiconsIcon
              icon={ShieldBlockchainIcon}
              size={20}
              className="text-primary mr-2 shrink-0"
            />
            <span className="text-foreground text-xs font-medium">
              100% Original
            </span>
          </div>
          <div className="bg-background flex items-center px-3 py-3">
            <HugeiconsIcon
              icon={ArrowTurnBackwardIcon}
              size={20}
              className="text-primary mr-2 shrink-0"
            />
            <span className="text-foreground text-xs font-medium">
              Bebas Pengembalian
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TrustSignal;
