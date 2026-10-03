'use client';

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  APPEARANCE_THEME_STORAGE_KEY,
  DEFAULT_APPEARANCE_THEME,
  isAppearanceTheme,
  type AppearanceTheme,
} from '@/constant/appearance';

type ThemeContextType = {
  activeTheme: AppearanceTheme;
  setActiveTheme: (theme: AppearanceTheme) => void;
};

const ThemeContext = createContext<
  ThemeContextType | undefined
>(undefined);

let activeThemeSnapshot: AppearanceTheme =
  DEFAULT_APPEARANCE_THEME;
const activeThemeListeners = new Set<() => void>();

function notifyActiveThemeListeners() {
  activeThemeListeners.forEach((listener) => listener());
}

function getActiveThemeSnapshot(): AppearanceTheme {
  if (typeof window === 'undefined') {
    return DEFAULT_APPEARANCE_THEME;
  }

  try {
    const storedTheme = window.localStorage.getItem(
      APPEARANCE_THEME_STORAGE_KEY
    );

    if (isAppearanceTheme(storedTheme)) {
      activeThemeSnapshot = storedTheme;
      return storedTheme;
    }

    if (storedTheme !== null) {
      return DEFAULT_APPEARANCE_THEME;
    }
  } catch {
    return activeThemeSnapshot;
  }

  return activeThemeSnapshot;
}

function getServerSnapshot(): AppearanceTheme {
  return DEFAULT_APPEARANCE_THEME;
}

function subscribeToActiveTheme(listener: () => void) {
  activeThemeListeners.add(listener);
  if (activeThemeListeners.size === 1) {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    activeThemeListeners.delete(listener);
    if (activeThemeListeners.size === 0) {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

function handleStorage(event: StorageEvent) {
  if (event.key !== APPEARANCE_THEME_STORAGE_KEY) {
    return;
  }

  activeThemeSnapshot = isAppearanceTheme(event.newValue)
    ? event.newValue
    : DEFAULT_APPEARANCE_THEME;
  notifyActiveThemeListeners();
}

function setActiveTheme(theme: AppearanceTheme) {
  if (!isAppearanceTheme(theme)) {
    return;
  }

  activeThemeSnapshot = theme;

  try {
    window.localStorage.setItem(
      APPEARANCE_THEME_STORAGE_KEY,
      theme
    );
  } catch {
    // Keep the preference active for this session if storage is disabled.
  }

  notifyActiveThemeListeners();
}

function applyAppearanceTheme(theme: AppearanceTheme) {
  const root = document.documentElement;

  Array.from(root.classList)
    .filter((className) => className.startsWith('theme-'))
    .forEach((className) =>
      root.classList.remove(className)
    );

  root.classList.add(`theme-${theme}`);
  if (theme.endsWith('-scaled')) {
    root.classList.add('theme-scaled');
  }
}

function clearAppearanceTheme() {
  Array.from(document.documentElement.classList)
    .filter((className) => className.startsWith('theme-'))
    .forEach((className) =>
      document.documentElement.classList.remove(className)
    );
}

export function ActiveThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const activeTheme = useSyncExternalStore(
    subscribeToActiveTheme,
    getActiveThemeSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    applyAppearanceTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => () => clearAppearanceTheme(), []);

  return (
    <ThemeContext.Provider
      value={{ activeTheme, setActiveTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      'useThemeConfig must be used within an ActiveThemeProvider'
    );
  }
  return context;
}
