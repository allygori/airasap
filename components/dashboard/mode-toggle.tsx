'use client';

import * as React from 'react';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { useTheme } from '@wrksz/themes/client';

import { Button } from '@/components/ui/button';

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      variant="secondary"
      size="icon"
      className="group/toggle size-8"
      onClick={toggleTheme}
    >
      {/* <SunMoon /> */}
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
