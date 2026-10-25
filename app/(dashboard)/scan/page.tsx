'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ReceiptScannerModal } from '@/components/receipts/ReceiptScannerModal';
import { Category, FinancialAccount } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Camera, Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ScanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    async function loadMeta() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
        .eq('is_archived', false);
      if (cats) setCategories(cats);

      const { data: accs } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_active', true);
      if (accs) setAccounts(accs);
    }
    loadMeta();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      <Card className="p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto shadow-md">
          <Camera className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Scan Struk & Nota Belanja (AI OCR)
          </h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
            Ambil foto struk belanja, nota restoran, kuitansi, atau bukti transfer Anda. AI Gemini akan mengekstrak nama merchant, tanggal, total pembayaran, serta rincian barang secara otomatis.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Penyimpanan Aman & Privat</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Foto bukti transaksi disimpan di Supabase Storage bucket privat dan dienkripsi dengan hak akses Row Level Security (RLS). Hanya Anda yang dapat melihat dan mengunduh foto struk Anda.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsOpen(true)}
          className="gap-2 px-6 py-3 rounded-2xl text-sm"
        >
          <Camera className="w-4 h-4" />
          <span>Buka Scanner Struk</span>
        </Button>
      </Card>

      <ReceiptScannerModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.push('/transactions');
        }}
        onSuccess={() => {
          router.push('/transactions');
        }}
        categories={categories}
        accounts={accounts}
      />
    </div>
  );
}
