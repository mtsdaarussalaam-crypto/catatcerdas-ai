import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Ketentuan Penggunaan - CatatCerdas AI',
  description: 'Syarat dan ketentuan penggunaan layanan CatatCerdas AI',
};

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">
            <FileText className="w-4 h-4" />
            <span>Aturan Layanan</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Ketentuan Penggunaan</h1>
          <p className="text-xs text-gray-400">Terakhir diperbarui: 25 Oktober 2026</p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mendaftar, mengakses, atau menggunakan CatatCerdas AI, Anda menyetujui untuk terikat oleh Ketentuan Penggunaan ini. Jika Anda tidak menyetujui salah satu ketentuan, Anda tidak diperkenankan menggunakan aplikasi ini.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">2. Batasan Tanggung Jawab Finansial</h2>
            <p>
              CatatCerdas AI adalah alat bantu pencatatan, pengorganisasian, dan analisis mandiri keuangan pribadi. Aplikasi ini <strong>bukan</strong> merupakan lembaga perbankan, penasihat investasi berlisensi, atau perantara pembayaran. Semua wawasan yang dihasilkan AI bersifat informatif edukatif dan bukan merupakan jaminan atau kepastian hasil finansial.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">3. Kewajiban Pengguna</h2>
            <p>
              Anda bertanggung jawab menjaga keamanan akun Google Anda. Anda dilarang mengunggah file berbahaya, skrip injeksi, atau berkas ilegal ke dalam sistem penyimpanan bukti transaksi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">4. Ketersediaan Layanan</h2>
            <p>
              Kami berupaya menjaga ketersediaan sistem 24/7. Namun, beberapa fitur AI atau penyimpanan pihak ketiga (Google Cloud, Supabase, Vercel) mungkin mengalami pemeliharaan berkala atau pembatasan kuota sementara.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
