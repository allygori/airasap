export const APPEARANCE_THEME_GROUPS = [
  {
    label: 'Warna',
    themes: [
      { label: 'Default', value: 'default' },
      { label: 'Biru', value: 'blue' },
      { label: 'Hijau', value: 'green' },
      { label: 'Amber', value: 'amber' },
    ],
  },
  {
    label: 'Scaled',
    themes: [
      { label: 'Default', value: 'default-scaled' },
      { label: 'Biru', value: 'blue-scaled' },
    ],
  },
  {
    label: 'Monospaced',
    themes: [{ label: 'Mono', value: 'mono-scaled' }],
  },
] as const;

export type AppearanceTheme =
  (typeof APPEARANCE_THEME_GROUPS)[number]['themes'][number]['value'];

export const DEFAULT_APPEARANCE_THEME: AppearanceTheme =
  'default';

export const APPEARANCE_THEME_STORAGE_KEY =
  'airasap-appearance-theme';

export function isAppearanceTheme(
  value: unknown
): value is AppearanceTheme {
  return APPEARANCE_THEME_GROUPS.some((group) =>
    group.themes.some((theme) => theme.value === value)
  );
}
