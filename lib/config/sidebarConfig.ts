import {
  HomeIcon,
  UserIcon,
  ClipboardListIcon,
  Users,
  Logs,
  Monitor,
  SettingsIcon,
  Trash2,
  LucideIcon,
  Folder,
  FileText,
  DollarSign,
  ShieldCheck,
  FileMinusIcon,
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const professionalNavigation: NavigationItem[] = [
  { id: 'workspace', label: 'Home', path: '/dashboard/professional', icon: UserIcon },
  { id: 'library', label: 'Library', path: '/dashboard/professional/library', icon: Folder },
  {
    id: 'reference-manager',
    label: 'Reference Manager',
    path: '/dashboard/professional/reference-manager',
    icon: FileMinusIcon,
  },
];

export const studentNavigation: NavigationItem[] = [
  { id: 'workspace', label: 'Home', path: '/dashboard/student', icon: UserIcon },
  { id: 'library', label: 'Library', path: '/dashboard/student/library', icon: Folder },
  {
    id: 'reference-manager',
    label: 'Reference Manager',
    path: '/dashboard/student/reference-manager',
    icon: FileMinusIcon,
  },
];

export const adminNavigation: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard/admin', icon: ShieldCheck },
  { id: 'workspace', label: 'Workspace', path: '/dashboard/admin/workspace', icon: UserIcon },
  { id: 'library', label: 'Library', path: '/dashboard/admin/library', icon: Folder },
  {
    id: 'library-documents',
    label: 'Documents',
    path: '/dashboard/admin/documents',
    icon: FileText,
  },
  { id: 'users', label: 'Users', path: '/dashboard/admin/users', icon: Users },
  { id: 'logs', label: 'Audit Logs', path: '/admin/logs', icon: Logs },
];

export const bottomNavigation: NavigationItem[] = [
  { id: 'trash-bin', label: 'Trash Bin', path: '/trash-bin', icon: Trash2 },
  { id: 'subscription', label: 'Subscription', path: '/subscription', icon: DollarSign },
  { id: 'settings', label: 'Settings', path: '/settings', icon: SettingsIcon },
];

// Combine all configs into a single export for easy access
export const navigationConfigs = {
  professional: professionalNavigation,
  student: studentNavigation,
  admin: adminNavigation,
  bottom: bottomNavigation,
};
