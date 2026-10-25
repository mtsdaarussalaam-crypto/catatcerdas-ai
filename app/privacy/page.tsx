import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Kebijakan Privasi - CatatCerdas AI',
  description: 'Kebijakan privasi dan perlindungan data pengguna di CatatCerdas AI',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Masuk</span>
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Transparansi & Keamanan</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Kebijakan Privasi</h1>
          <p className="text-xs text-gray-400">Terakhir diperbarui: 25 Oktober 2026</p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">1. Pengantar</h2>
            <p>
              CatatCerdas AI (“kami”, “aplikasi”) menghargai dan melindungi privasi data pribadi dan finansial Anda. Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan menjaga informasi Anda ketika menggunakan layanan kami.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">2. Data yang Dikumpulkan</h2>
            <p>Kami mengumpulkan informasi yang terbatas hanya pada apa yang diperlukan:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Informasi Autentikasi:</strong> Nama lengkap, alamat email, dan foto profil yang diberikan melalui Google OAuth. Kami tidak pernah meminta kata sandi Google Anda atau akses ke email/kontak pribadi Anda.</li>
              <li><strong>Data Transaksi:</strong> Nominal, tanggal, deskripsi, kategori, akun keuangan, dan metode pembayaran yang Anda input secara manual, melalui suara, atau melalui foto struk.</li>
              <li><strong>Foto Bukti Transaksi:</strong> Foto struk yang Anda unggah secara eksplisit untuk disimpan dalam bucket privat Supabase Storage.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">3. Pemrosesan Kecerdasan Buatan (AI)</h2>
            <p>
              Fitur AI (Google Gemini API) digunakan untuk mengekstrak teks dari ucapan suara, menganalisis struk belanja (OCR), serta menjawab pertanyaan finansial Anda. Pemrosesan dilakukan melalui server backend kami yang aman. Data Anda tidak pernah dijual atau dipergunakan untuk melatih model publik tanpa izin.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">4. Keamanan dan Isolasi Data</h2>
            <p>
              Setiap pengguna memiliki data yang terisolasi sepenuhnya menggunakan kebijakan PostgreSQL Row Level Security (RLS). Pengguna lain tidak memiliki izin untuk membaca atau mengubah mutasi rekening atau struk belanja Anda. Foto struk diakses menggunakan Signed URL dengan masa berlaku terbatas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">5. Hak Anda & Penghapusan Akun</h2>
            <p>
              Anda berhak mengekspor data transaksi Anda kapan saja dalam format CSV. Anda juga berhak menghapus akun beserta seluruh data riwayat mutasi dan file bukti transaksi secara permanen melalui menu Pengaturan Akun.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
