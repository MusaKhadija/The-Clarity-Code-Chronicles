import React from 'react';
import Head from 'next/head';
import { BaseComponentProps } from '@/types';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps extends BaseComponentProps {
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'StacksQuest',
  description = 'Learn Stacks blockchain through interactive quests',
  className = '',
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      
      <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Layout;
