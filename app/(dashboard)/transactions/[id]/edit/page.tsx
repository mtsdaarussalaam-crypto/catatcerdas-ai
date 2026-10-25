'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Category, FinancialAccount, Transaction, TransactionType } from '@/types';
import { ArrowLeft, TrendingDown, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Fetch accounts
        const { data: accs } = await supabase
          .from('financial_accounts')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('is_active', true);
        if (accs) setAccounts(accs);

        // Fetch categories
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
          .eq('is_archived', false);
        if (cats) setCategories(cats);

        // Fetch tx
        const res = await fetch(`/api/transactions/${id}`);
        if (res.ok) {
          const json = await res.json();
          const tx: Transaction = json.data;
          setTransaction(tx);
          setTxType(tx.transaction_type);
          setAmount(Number(tx.amount).toLocaleString('id-ID'));
          setDescription(tx.description);
          setTransactionDate(tx.transaction_date);
          setAccountId(tx.account_id);
          setTargetAccountId(tx.transfer_target_account_id || '');
          setCategoryId(tx.category_id || '');
          setPaymentMethod(tx.payment_method);
          setMerchantName(tx.merchant_name || '');
          setNotes(tx.notes || '');
        }
      } catch (err) {
        console.error('Error loading transaction for edit:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const filteredCategories = categories.filter((c) => {
    if (txType === 'income') return c.transaction_type === 'income' || c.transaction_type === 'both';
    if (txType === 'expense') return c.transaction_type === 'expense' || c.transaction_type === 'both';
    return false;
  });

  const handleUpdate = async () => {
    setErrorMessage(null);
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Nominal harus lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Deskripsi transaksi wajib diisi.');
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
        setErrorMessage('Akun asal dan akun tujuan transfer tidak boleh sama.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
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
          notes: notes.trim() || null,
          transfer_target_account_id: txType === 'transfer' ? targetAccountId : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui transaksi.');

      router.push(`/transactions/${id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/transactions/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail</span>
        </Link>
      </div>

      <Card className="p-6 sm:p-8 space-y-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Transaksi</h1>
          <p className="text-xs text-gray-400 mt-0.5">Perbarui rincian transaksi</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
            {errorMessage}
          </div>
        )}

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
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xl font-black text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Description & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Deskripsi Transaksi"
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
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
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
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
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
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
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
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
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
            label="Merchant / Toko"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Catatan</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={() => router.back()} disabled={isSaving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={isSaving}>
            Simpan Perubahan
          </Button>
        </div>
      </Card>
    </div>
  );
}
