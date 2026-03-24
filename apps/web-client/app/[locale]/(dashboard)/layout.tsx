import { ReactNode } from 'react';
import { MainLayout } from '@/components/client/MainLayout';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
