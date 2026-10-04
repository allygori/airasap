import {
  Building2,
  LayoutGrid,
  Palette,
  Store,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

export type SettingsSection = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  availability: 'current' | 'planned';
};

export type SettingsSectionGroup = {
  label: string;
  sections: SettingsSection[];
};

export const settingsSectionGroups: SettingsSectionGroup[] =
  [
    {
      label: 'Umum',
      sections: [
        {
          id: 'overview',
          label: 'Ringkasan',
          description: 'Lihat area pengaturan aplikasi.',
          icon: LayoutGrid,
          href: '/dashboard/settings',
          availability: 'current',
        },
      ],
    },
    {
      label: 'Akun',
      sections: [
        {
          id: 'profile',
          label: 'Profil',
          description:
            'Kelola nama dan informasi akun yang digunakan untuk masuk.',
          icon: UserRound,
          href: '/dashboard/settings/profile',
          availability: 'current',
        },
      ],
    },
    {
      label: 'Workspace',
      sections: [
        {
          id: 'organization',
          label: 'Organisasi',
          description:
            'Atur identitas dan informasi organisasi.',
          icon: Building2,
          href: '/dashboard/settings/organization',
          availability: 'current',
        },
        {
          id: 'store',
          label: 'Toko',
          description:
            'Atur nama, kode, dan zona waktu toko aktif.',
          icon: Store,
          href: '/dashboard/settings/store',
          availability: 'current',
        },
      ],
    },
    {
      label: 'Preferensi',
      sections: [
        {
          id: 'finance',
          label: 'Finance',
          description:
            'Kelola konfigurasi keuangan dan akuntansi.',
          icon: WalletCards,
          href: '/dashboard/settings/finance',
          availability: 'current',
        },
        {
          id: 'appearance',
          label: 'Tampilan',
          description:
            'Sesuaikan tema dan preferensi antarmuka.',
          icon: Palette,
          href: '/dashboard/settings/appearance',
          availability: 'current',
        },
      ],
    },
  ];
