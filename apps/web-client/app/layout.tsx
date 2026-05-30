import type { Metadata, Viewport } from 'next';
import { Noto_Sans, Sarabun } from 'next/font/google';
import { Toaster } from 'sonner';
import { NetworkStatus } from '@/components/NetworkStatus';

/**
 * Latin (English) primary face. Subsetted to Latin only so that the browser
 * automatically falls back to Sarabun for Thai glyphs through the CSS
 * font-family stack defined in globals.css.
 */
const notoSans = Noto_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-noto-sans',
  display: 'swap',
});

/**
 * Thai primary face. Designed by Suppakit Chalermlarp.
 * Includes the Thai subset so Thai glyphs render even when the rendered
 * element only declares the Sarabun family.
 */
const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  variable: '--font-sarabun',
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
    <html suppressHydrationWarning>
      <body className={`${notoSans.variable} ${sarabun.variable} font-sans antialiased`}>
        <NetworkStatus />
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#0d1b2e',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            classNames: {
              success: 'border-emerald-500/30',
              error: 'border-red-500/30',
            },
          }}
        />
      </body>
    </html>
  );
}
