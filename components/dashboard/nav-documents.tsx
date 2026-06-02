'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavDocuments({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Assets</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              render={
                <Link
                  href={item.url}
                  onClick={() => setOpenMobile(false)}
                />
              }
            >
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
