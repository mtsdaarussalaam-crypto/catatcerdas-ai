import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-950 font-sans">
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8" />
      </div>
      <span className="text-4xl font-black text-gray-900 dark:text-gray-100">404</span>
      <h1 className="text-base font-bold text-gray-700 dark:text-gray-300 mt-1">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-xs text-gray-400 max-w-sm mt-1 mb-6">
        Halaman yang Anda tuju mungkin telah dipindahkan atau alamat tautan tidak sesuai.
      </p>
      <Link href="/dashboard">
        <Button variant="primary" size="sm" className="gap-2">
          <Home className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Button>
      </Link>
    </div>
  );
}
