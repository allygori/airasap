'use client';

import * as React from 'react';
import { FocusIcon } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
// import { NavMain } from '@/components/dashboard/nav-main';
import { NavSecondary } from '@/components/dashboard/nav-secondary';
import { NavUser } from '@/components/dashboard/nav-user';
import {
  mainNav,
  financeNav,
  secondaryNav,
} from '@/constant/menu';
import { useSession } from '@/lib/auth/auth-client';
import { NavStore } from './nav-store';

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const sessionUpdatedAt = session?.session.updatedAt;
  const [financeAvailable, setFinanceAvailable] =
    React.useState(false);

  React.useEffect(() => {
    const controller = new AbortController();

    setFinanceAvailable(false);
    void fetch('/api/v1/dashboard/finance/access', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== 'object') {
          return false;
        }
        const envelope = payload as {
          success?: unknown;
          data?: { available?: unknown };
        };
        return (
          envelope.success === true &&
          envelope.data?.available === true
        );
      })
      .then((available) => setFinanceAvailable(available))
      .catch(() => setFinanceAvailable(false));

    return () => controller.abort();
  }, [sessionUpdatedAt]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/dashboard" />}
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <FocusIcon className="size-5!" />
              <span className="text-base font-semibold">
                Dashboard
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={mainNav} /> */}
        <NavStore items={mainNav} />
        {financeAvailable &&
          (financeNav || []).length > 0 && (
            <NavSecondary
              title="Finance"
              items={financeNav}
            />
          )}
        <NavSecondary items={secondaryNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
