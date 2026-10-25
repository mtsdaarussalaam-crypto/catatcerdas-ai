'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Mic, Camera, Bell, Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  onOpenNewTransaction?: () => void;
  onOpenVoice?: () => void;
  onOpenScan?: () => void;
  unreadNotificationsCount?: number;
}

export function Header({
  title = 'Dashboard',
  onOpenNewTransaction,
  onOpenVoice,
  onOpenScan,
  unreadNotificationsCount = 0,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Title / Brand on Mobile */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-[11px] text-gray-400 hidden sm:block">Kelola keuangan Anda secara cerdas dan terukur</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Voice button */}
        <button
          onClick={onOpenVoice ? onOpenVoice : () => router.push('/voice')}
          title="Input dengan Suara"
          className="p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1.5"
        >
          <Mic className="w-4 h-4 text-emerald-600" />
          <span className="hidden md:inline">Suara</span>
        </button>

        {/* Quick Scan Receipt button */}
        <button
          onClick={onOpenScan ? onOpenScan : () => router.push('/scan')}
          title="Scan Struk / Foto"
          className="p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1.5"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
          <span className="hidden md:inline">Scan Struk</span>
        </button>

        {/* Primary Add Transaction Button */}
        <Button
          onClick={onOpenNewTransaction ? onOpenNewTransaction : () => router.push('/transactions/new')}
          size="sm"
          className="rounded-xl shadow-sm shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Transaksi</span>
          <span className="sm:hidden">Tambah</span>
        </Button>

        {/* Notifications Icon */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1"
          title="Pusat Notifikasi"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900" />
          )}
        </Link>
      </div>
    </header>
  );
}
