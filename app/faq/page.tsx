import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, ChevronRight, Mic, Camera, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Bantuan & FAQ - CatatCerdas AI',
  description: 'Tanya jawab seputar penggunaan fitur CatatCerdas AI',
};

const FAQS = [
  {
    q: 'Bagaimana cara mencatat transaksi menggunakan suara?',
    a: 'Tekan tombol mikrofon pada dashboard atau header, lalu izinkan akses mikrofon di browser Anda. Ucapkan transaksi secara natural dalam bahasa Indonesia, misalnya: "Makan siang dua puluh lima ribu pakai QRIS". AI akan mengubahnya menjadi formulir yang bisa Anda tinjau sebelum disimpan.',
  },
  {
    q: 'Apakah foto struk saya dapat dilihat oleh orang lain?',
    a: 'Tidak. Foto struk disimpan di Supabase Storage bucket privat dengan perlindungan Row Level Security (RLS). URL gambar yang dibagikan bersifat sementara (Signed URL) dan hanya bisa diakses oleh akun Anda.',
  },
  {
    q: 'Bagaimana cara kerja transfer antar-akun?',
    a: 'Fitur transfer memindahkan saldo dari akun sumber ke akun tujuan. Operasi ini tidak akan dihitung ganda sebagai pengeluaran atau pemasukan baru pada laporan laba/rugi konsolidasi, sehingga kekayaan bersih Anda tetap akurat.',
  },
  {
    q: 'Apakah AI bisa melakukan transfer uang otomatis dari rekening bank saya?',
    a: 'Tidak. Asisten Keuangan AI CatatCerdas hanya berfungsi menganalisis catatan data Anda dan memberikan saran penghematan. AI tidak memiliki koneksi atau izin eksternal untuk melakukan pemindahan uang dari rekening bank Anda.',
  },
  {
    q: 'Bagaimana jika mikrofon saya tidak berfungsi di browser?',
    a: 'Aplikasi menyediakan kotak teks fallback pada modal perekam suara sehingga Anda tetap dapat mengetikkan teks ucapan secara manual untuk dianalisis oleh AI.',
  },
  {
    q: 'Dapatkah saya mengekspor data ke Excel?',
    a: 'Ya, Anda dapat mengunduh seluruh transaksi Anda dalam format file CSV lokal Indonesia yang siap dibuka langsung di Microsoft Excel atau Google Sheets melalui halaman Transaksi atau Laporan.',
  },
];

export default function FAQPage() {
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
          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>Pusat Bantuan</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h1>
          <p className="text-xs text-gray-400">Panduan lengkap menggunakan CatatCerdas AI</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => (
            <Card key={idx} className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-start gap-2">
                <span className="text-emerald-600 font-extrabold">{idx + 1}.</span>
                <span>{item.q}</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-5">
                {item.a}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
