import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { ActiveThemeProvider } from '@/components/dashboard/active-theme';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SiteHeader } from '@/components/dashboard/site-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import './theme.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen =
    cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <>
      <ActiveThemeProvider>
        <TooltipProvider>
          <SidebarProvider
            defaultOpen={defaultOpen}
            style={
              {
                '--sidebar-width':
                  'calc(var(--spacing) * 72)',
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>

        {/* toaster */}
        <Toaster />
      </ActiveThemeProvider>
    </>
  );
}
