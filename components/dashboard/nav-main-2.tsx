'use client';

import {
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

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
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { cn } from '@/lib/utils/ui';

export function NavMain2({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, idx) => {
          return (item.items || []).length === 0 ? (
            <SidebarMenuButton
              tooltip={item.title}
              key={idx}
            >
              <Link
                href={item.url}
                className="flex w-full flex-row gap-2"
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          ) : (
            <Collapsible
              key={item.title}
              defaultOpen={true}
              className="group/collapsible"
              render={<SidebarMenuItem key={idx} />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton tooltip={item.title} />
                }
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent
                className={cn(
                  /* 
                    - overflow-hidden: clips inner contents during expansion.
                    - data-[state]: tracks Base UI execution blocks natively.
                  */
                  'data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden transition-all'
                )}
              >
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        render={<Link href={subItem.url} />}
                      >
                        {/* <a href={subItem.url}> */}
                        <span>{subItem.title}</span>
                        {/* </a> */}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
