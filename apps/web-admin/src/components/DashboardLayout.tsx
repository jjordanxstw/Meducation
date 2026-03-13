'use client';

/**
 * Dashboard Layout Component
 * Wraps authenticated pages with sidebar and proper layout
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Layout } from 'antd';
import { CustomSider } from './CustomSider';

const { Content } = Layout;

// Public routes that don't need sidebar
const PUBLIC_ROUTES = ['/', '/login', '/forgot-password'];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [siderWidth, setSiderWidth] = useState(200);
  const [isInitialized, setIsInitialized] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '');

  useEffect(() => {
    // Initialize on mount to prevent hydration mismatch
    // Read from localStorage to get the initial sidebar width
    const getInitialWidth = () => {
      if (typeof window === 'undefined') return 200;
      try {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true' ? 80 : 200;
      } catch {
        return 200;
      }
    };

    const initialWidth = getInitialWidth();
    setSiderWidth(initialWidth);
    setIsInitialized(true);

    const handleSidebarChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ width: number }>;
      setSiderWidth(customEvent.detail.width);
    };

    window.addEventListener('sidebar-changed', handleSidebarChange);
    return () => window.removeEventListener('sidebar-changed', handleSidebarChange);
  }, []);

  // For public routes, don't show sidebar and don't wait for initialization
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Don't render content until initialized to prevent layout shift
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <CustomSider />
      <Content
        style={{
          marginLeft: siderWidth,
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
};

export default DashboardLayout;
