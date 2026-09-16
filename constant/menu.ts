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
  {
    title: 'Accounting',
    url: '/dashboard/accounting',
    icon: Landmark,
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
        title: 'Financial Reports',
        url: '/dashboard/accounting/reports',
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
    ],
  },
  {
    title: 'Inventory',
    url: '/dashboard/inventory',
    icon: Boxes,
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
