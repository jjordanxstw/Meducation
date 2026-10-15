import type { Metadata, Viewport } from 'next';
import { Onest, IBM_Plex_Sans_Thai_Looped } from 'next/font/google';
import { Toaster } from 'sonner';
import { NetworkStatus } from '@/components/NetworkStatus';
import { Providers } from './providers';
import './globals.css';

/**
 * Two-font system:
 * - Onest → all Latin UI + headings (variable font, one file for every weight).
 * - IBM Plex Sans Thai Looped → all Thai content (back-end data is authored in
 *   Thai; Onest has no Thai glyphs, so the browser falls through to this face
 *   automatically wherever a Thai character appears).
 */
const onest = Onest({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-onest',
  display: 'swap',
});

const ibmThai = IBM_Plex_Sans_Thai_Looped({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai'],
  variable: '--font-ibm-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MedPi Portal',
  description: 'Learning system for medical students',
};

// No maximumScale: students must be able to pinch-zoom slides and small text.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4f8ff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${onest.variable} ${ibmThai.variable} font-sans antialiased`}
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
