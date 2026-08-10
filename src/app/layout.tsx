import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Noto_Sans_Ethiopic } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});
const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const ethiopic = Noto_Sans_Ethiopic({ subsets: ['ethiopic'], variable: '--font-amharic', display: 'swap' });

export const metadata: Metadata = {
  title: 'Wakanda Furniture | Atelier de Luxe',
  description: 'Handcrafted luxury furniture. Atelier in Addis Ababa, serving discerning homes across Ethiopia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${ethiopic.variable} scroll-smooth`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}