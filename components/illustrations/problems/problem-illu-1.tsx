import { CSSProperties } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CursorPointer02Icon,
  Megaphone02Icon,
  Store04Icon,
} from "@hugeicons/core-free-icons";

const ProblemIllu1 = () => {
  return (
    <div className="relative min-h-72 overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-surface p-6 shadow-sm">
      <div className="absolute left-7 top-7 h-16 w-16 rounded-3xl bg-secondary/20" />
      <div className="absolute right-7 top-10 h-24 w-24 rounded-full border border-primary/30" />
      <div className="relative mx-auto mt-8 flex max-w-sm items-end justify-center gap-4">
        {[
          { icon: Megaphone02Icon, label: "Ad" },
          { icon: CursorPointer02Icon, label: "Click" },
          { icon: Store04Icon, label: "Noise" },
        ].map((item, index) => (
          <div
            key={item.label}
            className="animate-float-soft w-24 rounded-[1.25rem] border border-foreground/10 bg-surface-strong p-4 text-center shadow-sm"
            style={
              {
                animationDelay: `${index * 240}ms`,
                "--float-rotate": `${index === 1 ? 3 : -3}deg`,
              } as CSSProperties
            }
          >
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
              <HugeiconsIcon icon={item.icon} size={22} />
            </span>
            <p className="mt-4 text-sm font-black">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="relative mx-auto mt-8 h-3 max-w-sm rounded-full bg-foreground/10">
        <span className="absolute left-0 top-0 h-3 w-[32%] rounded-full bg-secondary" />
        <span className="absolute left-[38%] top-1 h-1 w-[24%] rounded-full bg-primary/45" />
        <span className="absolute right-0 top-1 h-1 w-[24%] rounded-full bg-primary/45" />
      </div>
    </div>
  );
}

export default ProblemIllu1