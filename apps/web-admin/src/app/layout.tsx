/**
 * Root layout for the Medical Portal Admin Panel
 * Uses Next.js App Router with Refine.dev
 */

import type { Metadata } from 'next';
import { Kanit, Prompt } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Font configuration
const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-kanit',
  display: 'swap',
});

const prompt = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Medical Portal - Admin',
  description: 'Medical Learning Portal - Admin Panel',
  icons: {
    icon: '/favicon.svg',
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${kanit.variable} ${prompt.variable}`}>
      <body className={prompt.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
