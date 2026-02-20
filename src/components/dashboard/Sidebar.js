// src/components/dashboard/Sidebar.js
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, PenLine, Settings, LogOut, Menu, X } from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Checks', href: '/history', icon: History },
  { name: 'Writer', href: '/', icon: PenLine },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (isActive) =>
    `flex items-center gap-3 min-h-[44px] px-3 py-3 rounded-xl font-semibold tracking-tight transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600'
    }`;

  return (
    <>
      <div className="shrink-0 w-0 md:w-64 relative">
        {/* Кнопка гамбургера — только на экранах < 768px */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-40 flex items-center justify-center min-h-[44px] min-w-[44px] md:hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Overlay при открытом мобильном меню */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Боковая панель: на мобильных — drawer, на md+ — в потоке */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 w-64 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between mb-10">
            <span className="font-semibold tracking-tight text-xl text-slate-900 dark:text-slate-100">
              BANDBOOSTER
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] md:hidden rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={linkClass(isActive)}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-3 w-full min-h-[44px] px-3 py-3 rounded-xl font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
