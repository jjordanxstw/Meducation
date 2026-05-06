import type { Metadata, Viewport } from 'next';
import { Kanit, Prompt } from 'next/font/google';

const kanit = Kanit({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-kanit',
  display: 'swap',
});

const prompt = Prompt({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-prompt',
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
      <body className={`${kanit.variable} ${prompt.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
