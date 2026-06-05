import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const fontDisplay = DM_Serif_Display({
  variable: '--font-dm-serif',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

const fontSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const fontMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StravaDash — Running Performance Analytics',
  description: 'Premium running performance analytics: fitness load curves, polarized heart-rate zone distributions, and finish-time predictions powered by your Strava data.',
};

export default function RootLayout({
  children,
  analytics,
}: Readonly<{
  children: React.ReactNode;
  analytics?: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans select-none antialiased">
        <ThemeProvider>
          {children}
          {analytics}
        </ThemeProvider>
      </body>
    </html>
  );
}
