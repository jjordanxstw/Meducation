import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { NetworkStatus } from '@/components/NetworkStatus';
import { Providers } from './providers';
import './globals.css';

/**
 * Primary UI face for the English-only portal.
 */
const notoSans = Noto_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MedPi Portal',
  description: 'Learning system for medical students',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <NetworkStatus />
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid rgba(15,23,42,0.08)',
              color: '#0f172a',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 6px 24px rgba(20, 63, 125, 0.10)',
            },
            classNames: {
              success: 'border-emerald-300',
              error: 'border-red-300',
            },
          }}
        />
      </body>
    </html>
  );
}
