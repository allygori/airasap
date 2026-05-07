import HugeIcon from '@/components/icons/huge-icon';
import {
  Link02Icon,
  Megaphone02Icon,
  ShoppingCartCheck02Icon,
  Target02Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";

const TrafficIllu1 = () => {
  return (
    <div className="relative min-h-[24rem] overflow-hidden bg-primary p-8 text-white dark:text-[#061010]">
      <div className="absolute inset-x-12 top-1/2 h-px bg-white/25 dark:bg-[#061010]/25" />
      <div className="absolute left-8 top-8 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] dark:bg-[#061010]/10">
        <HugeIcon className="mr-2 inline-block align-[-4px]" icon={Megaphone02Icon} size={16} />
        TikTok
      </div>
      <div className="absolute right-8 top-16 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] dark:bg-[#061010]/10">
        <HugeIcon className="mr-2 inline-block align-[-4px]" icon={Target02Icon} size={16} />
        Meta Ads
      </div>
      <div className="absolute bottom-8 left-10 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] dark:bg-[#061010]/10">
        <HugeIcon className="mr-2 inline-block align-[-4px]" icon={UserMultiple02Icon} size={16} />
        Affiliate
      </div>
      <div className="absolute bottom-12 right-10 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] dark:bg-[#061010]/10">
        <HugeIcon className="mr-2 inline-block align-[-4px]" icon={Link02Icon} size={16} />
        Bio Link
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-float-soft grid h-36 w-36 place-items-center rounded-full bg-secondary text-center text-sm font-black text-[#1d120c] shadow-[0_24px_60px_rgba(255,122,69,0.35)]">
          PASARIA
          <span className="absolute -bottom-6 inline-flex items-center gap-2 rounded-full bg-surface-strong px-4 py-2 text-xs text-foreground shadow-sm">
            <HugeIcon icon={ShoppingCartCheck02Icon} size={16} />
            Checkout
          </span>
        </div>
      </div>
    </div>
  );
}

export default TrafficIllu1