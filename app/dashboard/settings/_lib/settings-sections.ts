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
          availability: 'planned',
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
          availability: 'planned',
        },
        {
          id: 'store',
          label: 'Toko',
          description:
            'Atur nama, kode, dan zona waktu toko aktif.',
          icon: Store,
          availability: 'planned',
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
          availability: 'planned',
        },
        {
          id: 'appearance',
          label: 'Tampilan',
          description:
            'Sesuaikan tema dan preferensi antarmuka.',
          icon: Palette,
          availability: 'planned',
        },
      ],
    },
  ];
