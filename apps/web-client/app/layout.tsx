import type { Metadata, Viewport } from 'next';
import { Kanit, Prompt } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${kanit.variable} ${prompt.variable} font-sans antialiased`}>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var storageTheme = localStorage.getItem('med:theme');
                var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = storageTheme === 'dark' || storageTheme === 'light'
                  ? storageTheme
                  : (systemDark ? 'dark' : 'light');
                var root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme);
                root.dataset.theme = theme;
              } catch (error) {
                document.documentElement.classList.add('light');
                document.documentElement.dataset.theme = 'light';
              }
            })();
          `}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
