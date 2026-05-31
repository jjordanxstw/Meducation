import type { Metadata, Viewport } from 'next';
import { Noto_Sans, Noto_Serif, Noto_Serif_Thai } from 'next/font/google';
import { Toaster } from 'sonner';
import { NetworkStatus } from '@/components/NetworkStatus';
import { Providers } from './providers';
import './globals.css';

/**
 * Type system for the editorial-premium UI:
 * - Noto Sans  → body / UI (Latin)
 * - Noto Serif → display headings (Latin)
 * - Noto Serif Thai → all Thai content (back-end data is authored in Thai;
 *   the Latin fonts above have no Thai glyphs, so the browser falls through
 *   to this face automatically wherever a Thai character appears).
 */
const notoSans = Noto_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const notoSerif = Noto_Serif({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-noto-serif',
  display: 'swap',
});

const notoSerifThai = Noto_Serif_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai'],
  variable: '--font-noto-serif-thai',
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
      <body
        className={`${notoSans.variable} ${notoSerif.variable} ${notoSerifThai.variable} font-sans antialiased`}
      >
        <NetworkStatus />
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid rgba(15,23,42,0.08)',
              color: '#0f172a',
              borderRadius: '14px',
              fontSize: '14px',
              boxShadow: '0 14px 34px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(15, 23, 42, 0.06)',
            },
            classNames: {
              success: 'border-emerald-200',
              error: 'border-red-200',
            },
          }}
        />
      </body>
    </html>
  );
}
