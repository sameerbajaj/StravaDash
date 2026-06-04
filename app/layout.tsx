import type { Metadata } from 'next';
import { Outfit, Share_Tech_Mono, Inter } from 'next/font/google';
import './globals.css';

const fontOutfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const fontShareTechMono = Share_Tech_Mono({
  variable: '--font-share-tech-mono',
  subsets: ['latin'],
  weight: ['400'],
});

const fontInter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'StravaDash // Premium Running Performance Hub',
  description: 'Pro-grade athletic performance analytics, fitness load curves, polarized heart-rate zone distributions, and finish-time predictions.',
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
      className={`${fontOutfit.variable} ${fontShareTechMono.variable} ${fontInter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans select-none antialiased">
        {children}
        {analytics}
      </body>
    </html>
  );
}
