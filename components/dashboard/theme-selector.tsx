'use client';

import { Fragment } from 'react';

import { useThemeConfig } from '@/components/dashboard/active-theme';
import {
  APPEARANCE_THEME_GROUPS,
  isAppearanceTheme,
} from '@/constant/appearance';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        Warna tema
      </Label>
      <Select
        value={activeTheme}
        onValueChange={(value) => {
          if (isAppearanceTheme(value)) {
            setActiveTheme(value);
          }
        }}
      >
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className="justify-start *:data-[slot=select-value]:w-12"
        >
          <span className="text-muted-foreground hidden sm:block">
            Tema tampilan:
          </span>
          <span className="text-muted-foreground block sm:hidden">
            Tema
          </span>
          <SelectValue placeholder="Pilih tema tampilan" />
        </SelectTrigger>
        <SelectContent align="end">
          {APPEARANCE_THEME_GROUPS.map((group, index) => (
            <Fragment key={group.label}>
              {index > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{group.label}</SelectLabel>
                {group.themes.map((theme) => (
                  <SelectItem
                    key={theme.value}
                    value={theme.value}
                  >
                    {theme.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
