import { DashboardAuthLayout } from '@/components/layout/Dashboard.client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAuthLayout>{children}</DashboardAuthLayout>;
}
