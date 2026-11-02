'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Navigation } from './Navigation';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell manages executive layout visibility.
 * When on public authentication pages (/login, /forgot-password, /reset-password),
 * application navigation, header wordmark, and footer are suppressed to ensure
 * unauthenticated visitors cannot view or interact with the application frame.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  if (isAuthPage) {
    return <div className="min-h-screen w-full flex flex-col">{children}</div>;
  }

  return (
    <>
      {/* Header Shell */}
      <Header />

      {/* Primary Navigation Shell */}
      <Navigation />

      {/* Main Application Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {children}
      </main>

      {/* Executive Footer */}
      <footer className="w-full border-t border-cockpit-border py-4 px-6 text-center text-xs text-cockpit-subtle font-mono">
        <span>Meaven Founder Cockpit • Executive Foundation</span>
      </footer>
    </>
  );
};
