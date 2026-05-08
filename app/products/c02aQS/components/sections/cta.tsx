import Container from "@/components/shared/general/container";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart01Icon, Chat01Icon } from "@hugeicons/core-free-icons";

type Props = {
  className?: string;
};

const CTA = ({ className = "" }: Props) => {
  return (
    <section className={`fixed bottom-0 left-0 z-50 w-full border-t border-white/20 bg-white/70 backdrop-blur-xl dark:bg-black/70 ${className}`}>
      <Container
        className={`w-full md:w-10/12 lg:w-7/12 xl:w-5/12`}
        classObject={{ padding: "px-3 md:px-5 py-3" }}
      >
        <div className="flex items-center gap-3">
          <button className="flex flex-col items-center justify-center px-2 text-slate-600">
            <HugeiconsIcon icon={Chat01Icon} size={20} />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button className="flex flex-col items-center justify-center px-2 text-slate-600">
            <HugeiconsIcon icon={ShoppingCart01Icon} size={20} />
            <span className="text-[10px] font-medium">Keranjang</span>
          </button>
          <button className="ml-2 flex-1 rounded-full bg-[#ff7a45] py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,122,69,0.3)] transition-transform active:scale-95">
            Beli Sekarang
          </button>
        </div>
      </Container>
    </section>
  );
};

export default CTA;
