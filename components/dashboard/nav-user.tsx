'use client';

import { MoreVertical, LogOut } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';

type UserType = {
  name: string;
  email: string;
  image?: string | null;
};

type NavUserProps = {
  user?: UserType;
};

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  const {
    name = '',
    email = '',
    image = null,
  } = user ?? {};

  const getAvatarInitials = (name: string): string => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);

    if (words.length === 0) return '';
    // Take first letter of first word + first letter of second word if exists
    const initials =
      words.length > 1
        ? words[0].charAt(0) + words[1].charAt(0)
        : words[0].charAt(0);

    return initials.toUpperCase();
  };

  const handleLogout = async () => {
    await authClient.signOut();

    router.replace('/login');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              {image && (
                <AvatarImage src={image} alt={name} />
              )}
              <AvatarFallback className="rounded-lg">
                CN
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {name}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {email}
              </span>
            </div>
            <MoreVertical className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {image && (
                      <AvatarImage src={image} alt={name} />
                    )}
                    <AvatarFallback className="rounded-lg">
                      {getAvatarInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {/* <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button
                variant="ghost"
                className="cursor-pointer"
                onClick={async () => {
                  await handleLogout();
                }}
              >
                <LogOut />
                Log out
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
