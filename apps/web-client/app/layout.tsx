import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'MedPi Portal',
  description: 'Learning system for medical students',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Root layout is minimal - the [locale] layout handles html/body
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
