import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLink } from './brand-link';

export const HeaderTool = () => {
  return (
    <header className="bg-background sticky top-0 z-50 border-0 px-5 py-4 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <BrandLink />

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
