'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-950 font-sans">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">
        Terjadi Kesalahan Sistem
      </h1>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-6">
        Mohon maaf, sistem mengalami kendala teknis sementara. Jangan khawatir, saldo dan data Anda tetap aman.
      </p>
      <Button variant="primary" size="sm" onClick={() => reset()} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        <span>Coba Muat Ulang</span>
      </Button>
    </div>
  );
}
