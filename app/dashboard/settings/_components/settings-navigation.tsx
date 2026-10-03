'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/ui';
import { settingsSectionGroups } from '../_lib/settings-sections';

export function SettingsNavigation() {
  const pathname = usePathname();

  return (
    <aside className="min-w-0 border-b pb-4 lg:border-b-0 lg:pb-0">
      <nav aria-label="Navigasi Settings">
        <div className="flex gap-6 overflow-x-auto lg:flex-col lg:gap-5">
          {settingsSectionGroups.map((group) => (
            <section
              key={group.label}
              className="shrink-0 lg:shrink"
              aria-label={group.label}
            >
              <h2 className="text-muted-foreground mb-2 hidden px-2 text-xs font-medium tracking-wide lg:block">
                {group.label}
              </h2>
              <ul className="flex gap-1 lg:flex-col">
                {group.sections.map((section) => {
                  const Icon = section.icon;
                  const isActive =
                    section.href !== undefined &&
                    pathname === section.href;

                  return (
                    <li key={section.id}>
                      {section.href ? (
                        <Link
                          href={section.href}
                          aria-current={
                            isActive ? 'page' : undefined
                          }
                          className={cn(
                            'focus-visible:ring-ring flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
                            isActive
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                          <span className="whitespace-nowrap">
                            {section.label}
                          </span>
                        </Link>
                      ) : (
                        <div
                          aria-disabled="true"
                          title="Pengaturan ini belum tersedia"
                          className="text-muted-foreground/70 flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm"
                        >
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                          <span className="whitespace-nowrap">
                            {section.label}
                          </span>
                          <span className="sr-only">
                            Belum tersedia
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-auto hidden h-5 px-1.5 text-[10px] lg:inline-flex"
                          >
                            Rencana
                          </Badge>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>
    </aside>
  );
}
