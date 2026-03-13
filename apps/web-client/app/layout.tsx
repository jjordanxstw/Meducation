import type { Metadata, Viewport } from 'next';
import { Kanit, Prompt } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { MainLayout } from '@/components/client/MainLayout';

const kanit = Kanit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  variable: '--font-kanit',
  display: 'swap',
});

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Medical Learning Portal',
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
    <html lang="en" className="light">
      <body className={`${kanit.variable} ${prompt.variable} font-sans antialiased`}>
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
