'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, ShieldCheck, Mic, Camera, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorParam);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
      setIsSupabaseConfigured(false);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memulai login dengan Google.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md space-y-6">
        {/* App Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-600 text-white items-center justify-center shadow-lg shadow-emerald-500/25 mb-1">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            CatatCerdas<span className="text-emerald-600"> AI</span>
          </h1>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            “Catat Mudah, Pahami Keuangan, Raih Tujuan.”
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Aplikasi pencatatan keuangan pribadi modern berbasis AI, suara mikrofon, dan foto struk belanja.
          </p>
        </div>

        {/* Configuration Notice if Supabase credentials are missing */}
        {!isSupabaseConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Konfigurasi Supabase Belum Lengkap</span>
            </div>
            <p>
              Silakan salin kredensial proyek Supabase Anda ke file <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env.local</code> (NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY).
            </p>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-gray-400">
              Gunakan akun Google untuk autentikasi yang aman dan cepat
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || !isSupabaseConfigured}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google'}</span>
          </button>

          {/* Privacy & Scope Clarification */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-start gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privasi Terjamin:</strong> Kami hanya meminta akses identitas dasar (nama, email, avatar). Tidak pernah mengakses kontak atau kotak masuk Gmail Anda.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-gray-400">
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center gap-1.5 font-medium">
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>Input Suara AI</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center gap-1.5 font-medium">
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>Scan Struk AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Legal Links */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-emerald-600 hover:underline">
            Kebijakan Privasi
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-emerald-600 hover:underline">
            Ketentuan Penggunaan
          </Link>
          <span>•</span>
          <Link href="/faq" className="hover:text-emerald-600 hover:underline">
            Bantuan & FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
