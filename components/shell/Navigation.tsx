'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  Users,
  Target,
  Activity as ActivityIcon,
  BrainCircuit,
  Settings as SettingsIcon,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Today', href: '/', icon: LayoutDashboard },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Relationships', href: '/relationships', icon: Users },
  { name: 'Opportunities', href: '/opportunities', icon: Target },
  { name: 'Activity', href: '/activity', icon: ActivityIcon },
  { name: 'Intelligence', href: '/intelligence', icon: BrainCircuit },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-cockpit-bg border-b border-cockpit-border px-6 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-meaven-blue/15 text-slate-100 border border-meaven-blue/40 shadow-sm'
                  : 'text-cockpit-muted hover:text-slate-200 hover:bg-cockpit-surface border border-transparent'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-meaven-blue' : 'text-cockpit-subtle'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="hidden sm:flex items-center pl-4 border-l border-cockpit-border">
        <Link
          href="/settings"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            pathname === '/settings'
              ? 'bg-meaven-blue/15 text-slate-100 border border-meaven-blue/40'
              : 'text-cockpit-muted hover:text-slate-200 hover:bg-cockpit-surface border border-transparent'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5 text-cockpit-subtle" />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};
