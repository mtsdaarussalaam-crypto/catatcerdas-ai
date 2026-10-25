'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, Lock, EyeOff, Bot, Database, Server } from 'lucide-react';
import Link from 'next/link';

export default function PrivacySettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
          Privasi & Keamanan Data AI
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Transparansi perlindungan data keuangan dan kecerdasan buatan CatatCerdas AI
        </p>
      </div>

      {/* Navigation Submenu */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 text-xs font-bold">
        <Link
          href="/settings"
          className="px-3.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-800"
        >
          Umum & Notifikasi
        </Link>
        <Link
          href="/settings/privacy"
          className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Kebijakan & Privasi AI
        </Link>
        <Link
          href="/settings/account"
          className="px-3.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
        >
          Pengaturan Akun & Hapus
        </Link>
      </div>

      <div className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Isolasi Data Pengguna (Row Level Security)
              </h2>
              <p className="text-xs text-gray-400">Database Supabase PostgreSQL</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Setiap pengguna memiliki ruang data keuangan yang terisolasi total melalui kebijakan PostgreSQL Row Level Security (RLS). Tidak ada pengguna lain yang dapat membaca atau memodifikasi catatan transaksi, anggaran, atau rekening Anda.
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Prinsip Privasi Kecerdasan Buatan (Google Gemini API)
              </h2>
              <p className="text-xs text-gray-400">Pemrosesan Teks & Multimodal Struk</p>
            </div>
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong>Tidak ada API Key di Browser:</strong> Seluruh pemanggilan AI dijalankan dari server backend terlindungi.
            </li>
            <li>
              <strong>Hanya Agregasi yang Dikirim:</strong> Saat Anda bertanya ke Asisten AI, hanya ringkasan angka relevan yang dikirim, bukan seluruh isi database mentah.
            </li>
            <li>
              <strong>Bukan untuk Melatih Model Publik:</strong> Data pribadi Anda tidak dipergunakan untuk melatih model umum publik.
            </li>
            <li>
              <strong>AI Tidak Memiliki Izin Transaksi:</strong> AI hanya memberi wawasan dan analisis cerdas. AI tidak dapat mentransfer saldo atau membayar tagihan secara eksternal.
            </li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Penyimpanan Foto Bukti Struk Privat
              </h2>
              <p className="text-xs text-gray-400">Supabase Storage Bucket Privat</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Foto struk disimpan dalam bucket tertutup tanpa URL publik. Tautan gambar yang dibuat bersifat bertanda tangan (Signed URL) dengan masa kedaluwarsa 1 jam, dan hanya dapat dihasilkan oleh sesi pemilik akun yang sah.
          </p>
        </Card>
      </div>
    </div>
  );
}
