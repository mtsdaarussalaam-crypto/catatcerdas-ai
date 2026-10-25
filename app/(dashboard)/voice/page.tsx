'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { VoiceRecordModal } from '@/components/voice/VoiceRecordModal';
import { Category, FinancialAccount } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mic, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function VoicePage() {
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
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto shadow-md">
          <Mic className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Pencatatan Keuangan Melalui Suara
          </h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
            Ucapkan transaksi Anda secara santai dalam Bahasa Indonesia. AI CatatCerdas akan mengenali nominal, jenis transaksi, kategori, dan metode pembayaran.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-left text-xs space-y-2">
          <p className="font-bold text-gray-700 dark:text-gray-300">Contoh ucapan yang dipahami AI:</p>
          <ul className="space-y-1.5 text-gray-500 dark:text-gray-400 list-disc list-inside">
            <li>&ldquo;Tadi beli bensin lima puluh ribu tunai&rdquo;</li>
            <li>&ldquo;Makan siang dua puluh lima ribu pakai QRIS&rdquo;</li>
            <li>&ldquo;Hari ini saya menerima gaji lima juta rupiah&rdquo;</li>
            <li>&ldquo;Bayar listrik rumah tiga ratus ribu melalui transfer&rdquo;</li>
          </ul>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsOpen(true)}
          className="gap-2 px-6 py-3 rounded-2xl text-sm"
        >
          <Mic className="w-4 h-4" />
          <span>Buka Perekam Suara</span>
        </Button>
      </Card>

      <VoiceRecordModal
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
