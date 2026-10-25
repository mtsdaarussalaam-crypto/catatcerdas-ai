'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Category, FinancialAccount, TransactionType } from '@/types';
import { getTodayISODate } from '@/lib/finance/formatters';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TrendingDown, TrendingUp, ArrowRightLeft, ArrowLeft, Mic, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NewTransactionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(getTodayISODate());
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: accs } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_active', true);
      if (accs) {
        setAccounts(accs);
        if (accs[0]) setAccountId(accs[0].id);
      }

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
        .eq('is_archived', false);
      if (cats) setCategories(cats);
    }
    loadData();
  }, []);

  const filteredCategories = categories.filter((c) => {
    if (txType === 'income') return c.transaction_type === 'income' || c.transaction_type === 'both';
    if (txType === 'expense') return c.transaction_type === 'expense' || c.transaction_type === 'both';
    return false;
  });

  const handleSubmit = async (addAnother = false) => {
    setErrorMessage(null);
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Nominal harus lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Deskripsi wajib diisi.');
      return;
    }
    if (!accountId) {
      setErrorMessage('Akun keuangan wajib dipilih.');
      return;
    }
    if (txType === 'transfer') {
      if (!targetAccountId) {
        setErrorMessage('Akun tujuan transfer wajib dipilih.');
        return;
      }
      if (accountId === targetAccountId) {
        setErrorMessage('Akun asal dan tujuan tidak boleh sama.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          category_id: txType === 'transfer' ? null : categoryId || null,
          transaction_type: txType,
          amount: numAmount,
          description: description.trim(),
          transaction_date: transactionDate,
          payment_method: paymentMethod,
          merchant_name: merchantName.trim() || null,
          source: 'manual',
          status: 'confirmed',
          notes: notes.trim() || null,
          transfer_target_account_id: txType === 'transfer' ? targetAccountId : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan transaksi.');

      if (addAnother) {
        setAmount('');
        setDescription('');
        setMerchantName('');
        setNotes('');
      } else {
        router.push('/transactions');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button & Shortcuts */}
      <div className="flex items-center justify-between">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Transaksi</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/voice">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Gunakan Suara</span>
            </Button>
          </Link>
          <Link href="/scan">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span>Scan Struk</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6 sm:p-8 space-y-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Catat Transaksi Baru</h1>
          <p className="text-xs text-gray-400 mt-0.5">Isi rincian transaksi dengan akurat</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setTxType('expense')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all',
              txType === 'expense'
                ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('income')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all',
              txType === 'income'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Pemasukan</span>
          </button>
          <button
            type="button"
            onClick={() => setTxType('transfer')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all',
              txType === 'transfer'
                ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nominal (Rp)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">
              Rp
            </span>
            <input
              type="text"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xl font-black text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Description & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Deskripsi Transaksi"
            placeholder={txType === 'expense' ? 'Makan siang, Bensin, dsb.' : 'Gaji, Penjualan, dsb.'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Tanggal Transaksi"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
        </div>

        {/* Accounts & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {txType === 'transfer' ? 'Dari Akun' : 'Akun Keuangan'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.account_type})
                </option>
              ))}
            </select>
          </div>

          {txType === 'transfer' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ke Akun Tujuan</label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              >
                <option value="">Pilih Akun Tujuan</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.account_type})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              >
                <option value="">Tanpa Kategori</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Payment Method & Merchant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Metode Pembayaran</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              <option value="cash">Tunai</option>
              <option value="bank_transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
              <option value="debit_card">Kartu Debit</option>
              <option value="credit_card">Kartu Kredit</option>
              <option value="e_wallet">Dompet Digital / E-Wallet</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <Input
            label="Merchant / Toko (Opsional)"
            placeholder="Indomaret, Tokopedia, dsb."
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Catatan Tambahan (Opsional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan khusus transaksi..."
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={() => router.back()} disabled={isLoading} className="w-full sm:w-auto">
            Batal
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            Simpan & Tambah Lagi
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit(false)}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            Simpan Transaksi
          </Button>
        </div>
      </Card>
    </div>
  );
}
