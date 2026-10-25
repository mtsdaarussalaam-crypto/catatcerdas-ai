'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Sparkles,
  Wallet,
  Mic,
  Camera,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav({
  onOpenNewTransaction,
  onOpenVoice,
  onOpenScan,
}: {
  onOpenNewTransaction?: () => void;
  onOpenVoice?: () => void;
  onOpenScan?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showQuickSheet, setShowQuickSheet] = useState(false);

  const navItems = [
    { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/transactions', icon: Receipt },
    // Center is Action Button
    { name: 'Asisten AI', href: '/assistant', icon: Sparkles },
    { name: 'Akun', href: '/accounts', icon: Wallet },
  ];

  return (
    <>
      {/* Quick Action Bottom Sheet on Mobile */}
      {showQuickSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setShowQuickSheet(false)} />
          <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 shadow-2xl border-t border-gray-100 dark:border-gray-800 space-y-4 z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Catat Transaksi Cepat</h3>
              <button
                onClick={() => setShowQuickSheet(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setShowQuickSheet(false);
                  if (onOpenNewTransaction) onOpenNewTransaction();
                  else router.push('/transactions/new');
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors gap-2 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Manual</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickSheet(false);
                  if (onOpenVoice) onOpenVoice();
                  else router.push('/voice');
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 transition-colors gap-2 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Mic className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Suara</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickSheet(false);
                  if (onOpenScan) onOpenScan();
                  else router.push('/scan');
                }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 transition-colors gap-2 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Scan Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center justify-around select-none">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-semibold transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Center Floating Action Button */}
        <button
          onClick={() => setShowQuickSheet(true)}
          className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-5 active:scale-95 transition-transform"
          aria-label="Tambah Transaksi Cepat"
        >
          <Plus className="w-6 h-6" />
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-semibold transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
