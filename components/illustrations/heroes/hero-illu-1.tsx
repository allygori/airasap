import HugeIcon from "@/components/icons/huge-icon";
import { proofStats } from "@/constant/stats";
import {
  ChartUpIcon,
  DeliveryBox02Icon,
  ShoppingCartCheck02Icon,
  Target02Icon,
} from "@hugeicons/core-free-icons";

const HeroIllustration1 = () => {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="absolute -left-6 top-8 h-32 w-32 rounded-full bg-secondary/25 blur-3xl" />
      <div className="absolute -right-8 bottom-2 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
      <div className="animate-fade-up relative rotate-[-1.5deg] rounded-[1.65rem] border border-foreground/10 bg-surface-strong/78 p-3 shadow-[0_25px_70px_rgba(10,74,74,0.2)] backdrop-blur-xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.42)]">
        <div className="rounded-[1.25rem] border border-foreground/10 bg-background p-3">
          <div className="grid gap-3 md:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-3xl bg-primary p-4 text-white dark:text-[#051010]">
              <div className="mb-10 flex justify-between text-[0.65rem] font-bold uppercase tracking-[0.22em] opacity-80">
                <span className="inline-flex items-center gap-2">
                  <HugeIcon icon={ChartUpIcon} size={15} />
                  Live funnel
                </span>
                <span className="inline-flex items-center gap-2">
                  <HugeIcon icon={DeliveryBox02Icon} size={15} />
                  COD
                </span>
              </div>
              <p className="text-4xl font-black leading-none">3.8x</p>
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
                  className="rounded-2xl border border-foreground/10 bg-surface p-3 transition hover:-translate-y-0.5 hover:border-primary/35"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <HugeIcon icon={stat.icon} size={22} />
                  </div>
                  <p className="text-xl font-black text-primary">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-ink-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-3xl border border-foreground/10 bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-ink-muted">
                  <span className="inline-flex items-center gap-2">
                    <HugeIcon icon={Target02Icon} size={15} />
                    Product page
                  </span>
                </p>
                <p className="mt-1 text-xl font-black">
                  Kopi susu gula aren 1L
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-black text-[#1d120c] shadow-[0_10px_24px_rgba(255,122,69,0.28)]">
                <HugeIcon icon={ShoppingCartCheck02Icon} size={16} />
                Checkout
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[70, 44, 88, 62, 96].map((height, index) => (
                <div
                  key={height}
                  className="flex h-20 items-end rounded-2xl bg-primary-soft p-2"
                >
                  <div
                    className={`w-full rounded-xl transition-all duration-700 ${index === 4 ? "bg-secondary" : "bg-primary"
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
}

export default HeroIllustration1