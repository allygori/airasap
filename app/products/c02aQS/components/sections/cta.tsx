import Container from "@/components/shared/general/container";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart01Icon, Share01Icon, Chat01Icon } from "@hugeicons/core-free-icons";

type Props = {
  className?: string;
};

const CTA = ({ className = "" }: Props) => {
  return (
    <section className={`fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/80 backdrop-blur-xl ${className}`}>
      <Container
        className={`w-full md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 py-3" }}
      >
        <div className="flex items-center gap-3">
          <button className="flex flex-col items-center justify-center px-2 text-foreground transition-colors hover:text-primary">
            <HugeiconsIcon icon={Share01Icon} size={20} />
            <span className="text-tiny font-medium">Bagikan</span>
          </button>
          <div className="h-8 w-px bg-border" />
          <button className="flex flex-col items-center justify-center px-2 text-foreground transition-colors hover:text-primary">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={20} />
            <span className="text-tiny font-medium">Keranjang</span>
          </button>
          <button className="ml-2 flex-1 rounded-sm bg-primary py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95">
            Beli Sekarang
          </button>
        </div>
      </Container>
    </section>
  );
};

export default CTA;
