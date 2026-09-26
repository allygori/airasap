import {
  // Camera,
  // BarChart3,
  LayoutDashboard,
  Database,
  // FileJson,
  // FileText,
  // Folder,
  // HelpCircle,
  // List,
  // FileBarChart,
  Search,
  Settings,
  // Users,
  // LayoutGrid,
  // TagIcon,
  BoxIcon,
  Boxes,
  ShoppingBagIcon,
  // FileTextIcon,
  ChartPieIcon,
  Landmark,
  WalletIcon,
} from 'lucide-react';

export const mainNav = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    url: '/dashboard/products',
    icon: BoxIcon,
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: ShoppingBagIcon,
  },
  // {
  //   title: 'Accounting',
  //   url: '/dashboard/accounting',
  //   icon: Landmark,
  //   items: [
  //     {
  //       title: 'Finance Desk',
  //       url: '/dashboard/accounting',
  //     },
  //     {
  //       title: 'Accounting Onboarding',
  //       url: '/dashboard/accounting/onboarding',
  //     },
  //     {
  //       title: 'Accounting Widgets',
  //       url: '/dashboard/accounting/widgets',
  //     },
  //     {
  //       title: 'Financial Reports',
  //       url: '/dashboard/accounting/reports',
  //     },
  //     {
  //       title: 'Chart of Accounts',
  //       url: '/dashboard/accounting/explorer/accounts',
  //     },
  //     {
  //       title: 'Journal Entries',
  //       url: '/dashboard/accounting/explorer/journal-entries',
  //     },
  //     {
  //       title: 'General Ledger',
  //       url: '/dashboard/accounting/explorer/ledger',
  //     },
  //   ],
  // },
  // {
  //   title: 'Inventory',
  //   url: '/dashboard/inventory',
  //   icon: Boxes,
  //   items: [
  //     {
  //       title: 'Inventory Items',
  //       url: '/dashboard/inventory/items',
  //     },
  //     {
  //       title: 'Locations',
  //       url: '/dashboard/inventory/locations',
  //     },
  //     {
  //       title: 'Product Mappings',
  //       url: '/dashboard/inventory/mappings',
  //     },
  //     {
  //       title: 'Movements',
  //       url: '/dashboard/inventory/movements',
  //     },
  //   ],
  // },
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: ChartPieIcon,
    items: [
      {
        title: 'Overview',
        url: '/dashboard/reports/overview',
      },
      // {
      //   title: 'Sales Report',
      //   url: '/dashboard/reports/sales',
      // },
      {
        title: 'Orders Performance',
        url: '/dashboard/reports/orders',
      },
      {
        title: 'Product Performance',
        url: '/dashboard/reports/products',
      },
      {
        title: 'Customer Performance',
        url: '/dashboard/reports/customers',
      },
      {
        title: 'Voucher Performance',
        url: '/dashboard/reports/vouchers',
      },
      {
        title: 'Operations Quality',
        url: '/dashboard/reports/operations',
      },
      {
        title: 'Cancellations Report',
        url: '/dashboard/reports/cancellations',
      },
    ],
  },
  // {
  //   title: 'Reports',
  //   url: '/dashboard/reports',
  //   icon: ChartPieIcon,
  //   items: [
  //     {
  //       title: 'Active Proposals',
  //       url: '#',
  //     },
  //     {
  //       title: 'Archived',
  //       url: '#',
  //     },
  //   ],
  // },
  // {
  //   title: "Media Storage",
  //   url: "/dashboard/media",
  //   icon: Database,
  // },
  // {
  //   title: "Analytics",
  //   url: "#",
  //   icon: BarChart3,
  // },
  // {
  //   title: "Projects",
  //   url: "#",
  //   icon: Folder,
  // },
  // {
  //   title: "Team",
  //   url: "#",
  //   icon: Users,
  // },
];

export const cloudsNav = [
  // {
  //   title: "Capture",
  //   icon: Camera,
  //   isActive: true,
  //   url: "#",
  //   items: [
  //     {
  //       title: "Active Proposals",
  //       url: "#",
  //     },
  //     {
  //       title: "Archived",
  //       url: "#",
  //     },
  //   ],
  // },
  // {
  //   title: "Proposal",
  //   icon: FileText,
  //   url: "#",
  //   items: [
  //     {
  //       title: "Active Proposals",
  //       url: "#",
  //     },
  //     {
  //       title: "Archived",
  //       url: "#",
  //     },
  //   ],
  // },
  // {
  //   title: "Prompts",
  //   icon: FileJson,
  //   url: "#",
  //   items: [
  //     {
  //       title: "Active Proposals",
  //       url: "#",
  //     },
  //     {
  //       title: "Archived",
  //       url: "#",
  //     },
  //   ],
  // },
];

export const secondaryNav = [
  {
    title: 'Settings',
    url: '#',
    icon: Settings,
  },
  // {
  //   title: "Get Help",
  //   url: "#",
  //   icon: HelpCircle,
  // },
  {
    title: 'Search',
    url: '#',
    icon: Search,
  },
];

export const documentsNav = [
  {
    name: 'Media Storage',
    url: '/dashboard/media',
    icon: Database,
  },
  // {
  //   name: "Data Library",
  //   url: "#",
  //   icon: Database,
  // },
  // {
  //   name: "Reports",
  //   url: "#",
  //   icon: FileBarChart,
  // },
  // {
  //   name: "Word Assistant",
  //   url: "#",
  //   icon: FileText,
  // },
];

export const organizationNav = [
  {
    title: 'Accounting',
    // url: '/dashboard/accounting',
    icon: Landmark,
    defaultOpen: true,
    items: [
      {
        title: 'Finance Desk',
        url: '/dashboard/accounting',
      },
      {
        title: 'Accounting Onboarding',
        url: '/dashboard/accounting/onboarding',
      },
      {
        title: 'Accounting Widgets',
        url: '/dashboard/accounting/widgets',
      },
      {
        title: 'Chart of Accounts',
        url: '/dashboard/accounting/accounts',
      },
      {
        title: 'Journal Entries',
        url: '/dashboard/accounting/journal-entries',
      },
      {
        title: 'General Ledger',
        url: '/dashboard/accounting/ledger',
      },
      {
        title: 'Financial Reports',
        url: '/dashboard/accounting/reports',
      },
      {
        title: 'Accounting Explorer',
        // url: '/dashboard/accounting/explorer/accounts',
        defaultOpen: true,
        items: [
          {
            title: 'Chart of Accounts',
            url: '/dashboard/accounting/explorer/accounts',
          },
          {
            title: 'Journal Entries',
            url: '/dashboard/accounting/explorer/journal-entries',
          },
          {
            title: 'General Ledger',
            url: '/dashboard/accounting/explorer/ledger',
          },
        ],
      },
    ],
  },
  {
    title: 'Inventory',
    // url: '/dashboard/inventory',
    icon: Boxes,
    defaultOpen: false,
    items: [
      {
        title: 'Inventory Items',
        url: '/dashboard/inventory/items',
      },
      {
        title: 'Locations',
        url: '/dashboard/inventory/locations',
      },
      {
        title: 'Product Mappings',
        url: '/dashboard/inventory/mappings',
      },
      {
        title: 'Movements',
        url: '/dashboard/inventory/movements',
      },
    ],
  },
  {
    title: 'Storage',
    url: '/dashboard/media',
    icon: Database,
    items: [],
  },
];

export const financeNav = [
  {
    title: 'Transaksi',
    // url: '/dashboard/accounting',
    icon: ShoppingBagIcon,
    defaultOpen: true,
    items: [
      {
        title: 'Penjualan',
        url: '/dashboard/finance/sales',
      },
      {
        title: 'Penjualan Offline',
        url: '/dashboard/finance/sales/offline',
      },
      {
        title: 'Pembelian',
        url: '/dashboard/finance/purchase',
      },
      {
        title: 'Biaya & Pengeluaran',
        url: '/dashboard/finance/expenses-and-outflows',
      },
      {
        title: 'Transfer Kas & Bank',
        url: '/dashboard/finance/cash-and-bank-transfers',
      },
    ],
  },
  {
    title: 'Persediaan',
    // url: '/dashboard/inventory',
    icon: BoxIcon,
    defaultOpen: false,
    items: [
      {
        title: 'Daftar Produk & Stok',
        url: '/dashboard/finance/inventory/product-and-stock-list',
      },
      {
        title: 'Riwayat Mutasi Stok',
        url: '/dashboard/finance/inventory/movements',
      },
      {
        title: 'Setup & Mapping Inventory',
        url: '/dashboard/finance/inventory/setup',
      },
      {
        title: 'Penyesuaian Stok',
        url: '/dashboard/finance/inventory/stock-adjustments',
      },
      {
        title: 'Mutasi Gudang',
        url: '/dashboard/finance/inventory/warehouse-transfers',
      },
    ],
  },
  {
    title: 'Keuangan',
    // url: '/dashboard/media',
    icon: WalletIcon,
    items: [
      {
        title: 'Cash & Bank',
        url: '/dashboard/finance/cash-and-bank',
      },
      {
        title: 'Piutang',
        url: '/dashboard/finance/accounts-receivable',
      },
      {
        title: 'Hutang',
        url: '/dashboard/finance/accounts-payable',
      },
      {
        title: 'Rekonsiliasi Bank',
        url: '/dashboard/finance/bank-reconciliation',
      },
    ],
  },
  {
    title: 'Laporan',
    // url: '/dashboard/media',
    icon: ChartPieIcon,
    items: [
      {
        title: 'Laba Rugi',
        url: '/dashboard/finance/reports/profit-and-loss',
      },
      {
        title: 'Neraca',
        url: '/dashboard/finance/reports/balance-sheet',
      },
      {
        title: 'Arus Kas',
        url: '/dashboard/finance/reports/cash-flow',
      },
      {
        title: 'Laporan Penjualan',
        url: '/dashboard/finance/reports/sales-reports',
      },
      {
        title: 'Laporan Stok & Margin',
        url: '/dashboard/finance/reports/stock-and-margin-reports',
      },
      {
        title: 'Laporan Pajak',
        url: '/dashboard/finance/reports/tax-reports',
      },
    ],
  },
  {
    title: 'Akuntansi',
    // url: '/dashboard/media',
    icon: Landmark,
    items: [
      {
        title: 'Chart of Accounts',
        url: '/dashboard/finance/accounting/chart-of-accounts',
      },
      {
        title: 'Jurnal Umum',
        url: '/dashboard/finance/accounting/general-journal',
      },
      {
        title: 'Tutup Buku',
        url: '/dashboard/finance/accounting/closing-books',
      },
      {
        title: 'Opening Balance',
        url: '/dashboard/finance/accounting/opening-balances',
      },
    ],
  },
];
