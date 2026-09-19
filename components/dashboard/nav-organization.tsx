'use client';

import Link from 'next/link';
import {
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';

const MAX_DEPTH = 3;

export type OrganizationNavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
  isActive?: boolean;
  defaultOpen?: boolean;
  items?: OrganizationNavItem[];
};

function NavItem({
  item,
  depth,
  onNavigate,
}: {
  item: OrganizationNavItem;
  depth: number;
  onNavigate: () => void;
}): ReactNode {
  const hasChildren =
    depth < MAX_DEPTH - 1 && Boolean(item.items?.length);
  const isNested = depth > 0;

  if (!hasChildren) {
    const content = (
      <>
        {item.icon && <item.icon />}
        <span>{item.title}</span>
      </>
    );

    return isNested ? (
      <SidebarMenuSubItem key={item.title}>
        <SidebarMenuSubButton
          render={
            <Link
              href={item.url ?? '#'}
              onClick={onNavigate}
            />
          }
          isActive={item.isActive}
        >
          {content}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ) : (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={item.isActive}
        >
          <Link
            href={item.url ?? '#'}
            className="flex w-full flex-row gap-2"
            onClick={onNavigate}
          >
            {content}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const triggerContent = (
    <>
      {item.icon && <item.icon />}
      <span>{item.title}</span>
      <ChevronRight
        aria-hidden="true"
        className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90"
      />
    </>
  );

  return (
    <Collapsible
      key={item.title}
      defaultOpen={item.defaultOpen ?? false}
      className="group/collapsible"
      render={
        isNested ? (
          <SidebarMenuSubItem />
        ) : (
          <SidebarMenuItem />
        )
      }
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            size={isNested ? 'sm' : 'default'}
            isActive={item.isActive}
          />
        }
      >
        {triggerContent}
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <SidebarMenuSub>
          {item.items?.map((child) => (
            <NavItem
              key={child.title}
              item={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavOrganization({
  items,
}: {
  items: OrganizationNavItem[];
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organization</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavItem
            key={item.title}
            item={item}
            depth={0}
            onNavigate={() => setOpenMobile(false)}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
