import {
  Camera,
  BarChart3,
  LayoutDashboard,
  Database,
  FileJson,
  FileText,
  Folder,
  HelpCircle,
  List,
  FileBarChart,
  Search,
  Settings,
  Users,
  LayoutGrid,
  TagIcon,
  BoxIcon,
  ShoppingBagIcon,
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
    title: 'Tag',
    url: '/dashboard/tags',
    icon: TagIcon,
  },
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
