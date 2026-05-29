import { ReactNode } from 'react';
import { MainLayout } from '@/components/client/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MainLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </MainLayout>
  );
}
