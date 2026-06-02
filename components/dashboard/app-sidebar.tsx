'use client';

import * as React from 'react';
import {
  Camera,
  BarChart3,
  LayoutDashboard,
  Database,
  FileJson,
  FileText,
  Folder,
  HelpCircle,
  Box,
  FocusIcon,
  List,
  FileBarChart,
  Search,
  Settings,
  Users,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavDocuments } from '@/components/dashboard/nav-documents';
import { NavMain } from '@/components/dashboard/nav-main';
import { NavSecondary } from '@/components/dashboard/nav-secondary';
import { NavUser } from '@/components/dashboard/nav-user';
import {
  mainNav,
  documentsNav,
  secondaryNav,
} from '@/constant/menu';
import { useSession } from '@/lib/auth/auth-client';

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

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
        <NavMain items={mainNav} />
        {(documentsNav || []).length > 0 && (
          <NavDocuments items={documentsNav} />
        )}
        {/* <NavSecondary items={secondaryNav} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
