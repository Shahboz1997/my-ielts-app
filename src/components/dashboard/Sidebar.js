// src/components/dashboard/Sidebar.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, PenLine, Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Checks', href: '/history', icon: History },
  { name: 'Writer', href: '/', icon: PenLine },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col">
      <div className="mb-10 font-semibold tracking-tight text-xl text-slate-900 dark:text-slate-100">
        BANDBOOSTER
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl font-semibold tracking-tight transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600'
              }`}
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
          className="flex items-center gap-3 w-full p-3 rounded-xl font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
