import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StacksQuest: The Clarity Code Chronicles',
  description: 'Learn Stacks blockchain concepts through interactive quests and earn NFT badges',
  keywords: ['Stacks', 'blockchain', 'education', 'NFT', 'Clarity', 'cryptocurrency'],
  authors: [{ name: 'StacksQuest Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
  openGraph: {
    title: 'StacksQuest: The Clarity Code Chronicles',
    description: 'Learn Stacks blockchain concepts through interactive quests and earn NFT badges',
    url: 'https://stacksquest.com',
    siteName: 'StacksQuest',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StacksQuest - Learn Stacks Blockchain',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StacksQuest: The Clarity Code Chronicles',
    description: 'Learn Stacks blockchain concepts through interactive quests and earn NFT badges',
    images: ['/og-image.png'],
    creator: '@stacksquest',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
