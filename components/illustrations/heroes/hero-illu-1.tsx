import { HugeiconsIcon } from '@hugeicons/react';
import { proofStats } from '@/constant/stats';
import {
  ChartUpIcon,
  DeliveryBox02Icon,
  ShoppingCartCheck02Icon,
  Target02Icon,
} from '@hugeicons/core-free-icons';

const HeroIllustration1 = () => {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="bg-secondary/25 absolute top-8 -left-6 h-32 w-32 rounded-full blur-3xl" />
      <div className="bg-primary/20 absolute -right-8 bottom-2 h-44 w-44 rounded-full blur-3xl" />
      <div className="animate-fade-up border-foreground/10 bg-surface-strong/78 relative rotate-[-1.5deg] rounded-[1.65rem] border p-3 shadow-[0_25px_70px_rgba(10,74,74,0.2)] backdrop-blur-xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.42)]">
        <div className="border-foreground/10 bg-background rounded-[1.25rem] border p-3">
          <div className="grid gap-3 md:grid-cols-[0.72fr_1.28fr]">
            <div className="bg-primary rounded-3xl p-4 text-white dark:text-[#051010]">
              <div className="mb-10 flex justify-between text-[0.65rem] font-bold tracking-[0.22em] uppercase opacity-80">
                <span className="inline-flex items-center gap-2">
                  <HugeiconsIcon
                    icon={ChartUpIcon}
                    size={15}
                  />
                  Live funnel
                </span>
                <span className="inline-flex items-center gap-2">
                  <HugeiconsIcon
                    icon={DeliveryBox02Icon}
                    size={15}
                  />
                  COD
                </span>
              </div>
              <p className="text-4xl leading-none font-black">
                3.8x
              </p>
              <p className="mt-2 text-sm font-semibold opacity-80">
                revenue per visitor
              </p>
              <div className="mt-7 space-y-2">
                {[64, 82, 48].map((width) => (
                  <span
                    key={width}
                    className="animate-pulse-line block h-2 rounded-full bg-white/45 dark:bg-[#061010]/35"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {proofStats.map((stat, index) => (
                <div
                  key={stat.value}
                  className="border-foreground/10 bg-surface hover:border-primary/35 rounded-2xl border p-3 transition hover:-translate-y-0.5"
                  style={{
                    animationDelay: `${index * 90}ms`,
                  }}
                >
                  <div className="bg-primary-soft text-primary mb-4 grid h-10 w-10 place-items-center rounded-2xl">
                    <HugeiconsIcon
                      icon={stat.icon}
                      size={22}
                    />
                  </div>
                  <p className="text-primary text-xl font-black">
                    {stat.value}
                  </p>
                  <p className="text-ink-muted mt-1 text-xs font-semibold">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-foreground/10 bg-surface mt-3 rounded-3xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-ink-muted text-xs font-black tracking-[0.22em] uppercase">
                  <span className="inline-flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Target02Icon}
                      size={15}
                    />
                    Product page
                  </span>
                </p>
                <p className="mt-1 text-xl font-black">
                  Kopi susu gula aren 1L
                </p>
              </div>
              <span className="bg-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-[#1d120c] shadow-[0_10px_24px_rgba(255,122,69,0.28)]">
                <HugeiconsIcon
                  icon={ShoppingCartCheck02Icon}
                  size={16}
                />
                Checkout
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[70, 44, 88, 62, 96].map((height, index) => (
                <div
                  key={height}
                  className="bg-primary-soft flex h-20 items-end rounded-2xl p-2"
                >
                  <div
                    className={`w-full rounded-xl transition-all duration-700 ${
                      index === 4
                        ? 'bg-secondary'
                        : 'bg-primary'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroIllustration1;
