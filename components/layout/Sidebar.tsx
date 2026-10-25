'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Repeat,
  Sparkles,
  Calendar,
  BarChart3,
  Wallet,
  Tags,
  FileSpreadsheet,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  userProfile?: {
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', href: '/transactions', icon: Receipt },
  { name: 'Anggaran', href: '/budgets', icon: PieChart },
  { name: 'Target Tabungan', href: '/goals', icon: Target },
  { name: 'Transaksi Berulang', href: '/recurring', icon: Repeat },
  { name: 'Asisten AI', href: '/assistant', icon: Sparkles, badge: 'AI' },
  { name: 'Kalender Keuangan', href: '/calendar', icon: Calendar },
  { name: 'Laporan & Grafik', href: '/reports', icon: BarChart3 },
  { name: 'Akun Keuangan', href: '/accounts', icon: Wallet },
  { name: 'Kategori', href: '/categories', icon: Tags },
  { name: 'Impor & Ekspor', href: '/import-export', icon: FileSpreadsheet },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:bg-emerald-700 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              CatatCerdas<span className="text-emerald-600"> AI</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
              Catat Mudah, Pahami Keuangan
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-600 text-white rounded-md tracking-wider">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
          <Link href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-emerald-500/20">
              {userProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                userProfile?.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Pengguna'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{userProfile?.email || ''}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
