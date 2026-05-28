import { CSSProperties } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CursorPointer02Icon,
  Megaphone02Icon,
  Store04Icon,
} from '@hugeicons/core-free-icons';

const ProblemIllu1 = () => {
  return (
    <div className="border-foreground/10 bg-surface relative min-h-72 overflow-hidden rounded-[1.75rem] border p-6 shadow-sm">
      <div className="bg-secondary/20 absolute top-7 left-7 h-16 w-16 rounded-3xl" />
      <div className="border-primary/30 absolute top-10 right-7 h-24 w-24 rounded-full border" />
      <div className="relative mx-auto mt-8 flex max-w-sm items-end justify-center gap-4">
        {[
          { icon: Megaphone02Icon, label: 'Ad' },
          { icon: CursorPointer02Icon, label: 'Click' },
          { icon: Store04Icon, label: 'Noise' },
        ].map((item, index) => (
          <div
            key={item.label}
            className="animate-float-soft border-foreground/10 bg-surface-strong w-24 rounded-[1.25rem] border p-4 text-center shadow-sm"
            style={
              {
                animationDelay: `${index * 240}ms`,
                '--float-rotate': `${index === 1 ? 3 : -3}deg`,
              } as CSSProperties
            }
          >
            <span className="bg-primary-soft text-primary mx-auto grid h-10 w-10 place-items-center rounded-full">
              <HugeiconsIcon icon={item.icon} size={22} />
            </span>
            <p className="mt-4 text-sm font-black">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <div className="bg-foreground/10 relative mx-auto mt-8 h-3 max-w-sm rounded-full">
        <span className="bg-secondary absolute top-0 left-0 h-3 w-[32%] rounded-full" />
        <span className="bg-primary/45 absolute top-1 left-[38%] h-1 w-[24%] rounded-full" />
        <span className="bg-primary/45 absolute top-1 right-0 h-1 w-[24%] rounded-full" />
      </div>
    </div>
  );
};

export default ProblemIllu1;
