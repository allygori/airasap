import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Package02Icon,
  ShoppingCartCheck02Icon,
  Target02Icon,
} from "@hugeicons/core-free-icons";

const BuilderIllu1 = () => {
  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-foreground/10 bg-surface p-4">
      {[
        { icon: Target02Icon, label: "Hero" },
        { icon: CheckmarkCircle02Icon, label: "Trust" },
        { icon: Package02Icon, label: "Offer" },
        { icon: ShoppingCartCheck02Icon, label: "Checkout" },
      ].map((item, index) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background p-3 transition duration-300 hover:translate-x-1 hover:border-secondary/40"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-black text-white dark:text-[#051010]">
            <HugeiconsIcon icon={item.icon} size={21} />
          </span>
          <span className="flex-1 text-sm font-black">{item.label}</span>
          <span
            className={`h-2 rounded-full ${index === 3 ? "w-20 bg-secondary" : "w-14 bg-primary/35"
              }`}
          />
        </div>
      ))}
    </div>
  );
}

export default BuilderIllu1