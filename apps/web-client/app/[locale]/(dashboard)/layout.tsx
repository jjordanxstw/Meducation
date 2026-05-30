import { ReactNode } from 'react';
import { MainLayout } from '@/components/client/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScrollRestoration } from '@/components/ScrollRestoration';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MainLayout>
      <ScrollRestoration />
      <ErrorBoundary>{children}</ErrorBoundary>
    </MainLayout>
  );
}
