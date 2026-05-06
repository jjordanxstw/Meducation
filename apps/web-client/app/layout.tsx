import type { Metadata, Viewport } from 'next';
import { Noto_Sans, Sarabun } from 'next/font/google';

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
        {children}
      </body>
    </html>
  );
}
