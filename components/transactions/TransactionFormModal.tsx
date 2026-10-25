'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Category, FinancialAccount, Transaction, TransactionType, TransactionStatus } from '@/types';
import { formatIDR, getTodayISODate } from '@/lib/finance/formatters';
import { Plus, ArrowRightLeft, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
  categories: Category[];
  accounts: FinancialAccount[];
  initialData?: Partial<Transaction> | null;
}

export function TransactionFormModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  accounts,
  initialData,
}: TransactionFormModalProps) {
  const [txType, setTxType] = useState<TransactionType>(initialData?.transaction_type || 'expense');
  const [amount, setAmount] = useState<string>(initialData?.amount ? String(initialData.amount) : '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [transactionDate, setTransactionDate] = useState<string>(
    initialData?.transaction_date || getTodayISODate()
  );
  const [accountId, setAccountId] = useState<string>(
    initialData?.account_id || (accounts[0]?.id || '')
  );
  const [targetAccountId, setTargetAccountId] = useState<string>(
    initialData?.transfer_target_account_id || ''
  );
  const [categoryId, setCategoryId] = useState<string>(initialData?.category_id || '');
  const [paymentMethod, setPaymentMethod] = useState<string>(initialData?.payment_method || 'cash');
  const [merchantName, setMerchantName] = useState<string>(initialData?.merchant_name || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'confirmed');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialData when modal opens
  useEffect(() => {
    if (initialData) {
      setTxType(initialData.transaction_type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setDescription(initialData.description || '');
      setTransactionDate(initialData.transaction_date || getTodayISODate());
      if (initialData.account_id) setAccountId(initialData.account_id);
      if (initialData.transfer_target_account_id) setTargetAccountId(initialData.transfer_target_account_id);
      if (initialData.category_id) setCategoryId(initialData.category_id);
      if (initialData.payment_method) setPaymentMethod(initialData.payment_method);
      if (initialData.merchant_name) setMerchantName(initialData.merchant_name);
      if (initialData.notes) setNotes(initialData.notes);
      if (initialData.status) setStatus(initialData.status);
    } else {
      setAmount('');
      setDescription('');
      setTransactionDate(getTodayISODate());
      setCategoryId('');
      setMerchantName('');
      setNotes('');
      if (accounts[0]) setAccountId(accounts[0].id);
    }
    setErrorMessage(null);
  }, [initialData, isOpen, accounts]);

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
      setErrorMessage('Deskripsi transaksi wajib diisi.');
      return;
    }

    if (!accountId) {
      setErrorMessage('Akun keuangan wajib dipilih.');
      return;
    }

    if (txType === 'transfer') {
      if (!targetAccountId) {
        setErrorMessage('Pilih akun tujuan untuk transfer.');
        return;
      }
      if (accountId === targetAccountId) {
        setErrorMessage('Akun asal dan akun tujuan transfer tidak boleh sama.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        account_id: accountId,
        category_id: txType === 'transfer' ? null : categoryId || null,
        transaction_type: txType,
        amount: numAmount,
        description: description.trim(),
        transaction_date: transactionDate,
        payment_method: paymentMethod,
        merchant_name: merchantName.trim() || null,
        source: initialData?.source || 'manual',
        status,
        notes: notes.trim() || null,
        transfer_target_account_id: txType === 'transfer' ? targetAccountId : null,
      };

      const endpoint = initialData?.id
        ? `/api/transactions/${initialData.id}`
        : '/api/transactions';
      const method = initialData?.id ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan transaksi.');
      }

      onSuccess(resData.data);

      if (addAnother) {
        setAmount('');
        setDescription('');
        setMerchantName('');
        setNotes('');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Transaksi' : 'Catat Transaksi'}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Transaction Type Tabs */}
        {!initialData?.id && (
          <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
                txType === 'expense'
                  ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
                txType === 'income'
                  ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => setTxType('transfer')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
                txType === 'transfer'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium border border-rose-200 dark:border-rose-800">
            {errorMessage}
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nominal Transaksi (Rp)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
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
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Description & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Deskripsi"
            placeholder={txType === 'expense' ? 'Makan siang, Bensin, dsb.' : 'Gaji, Usaha, dsb.'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Tanggal"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
        </div>

        {/* Accounts Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {txType === 'transfer' ? 'Dari Akun' : 'Akun Keuangan'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="">Pilih Akun</option>
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
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Metode Pembayaran</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
            placeholder="Tambahkan catatan khusus jika diperlukan..."
            className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
            Batal
          </Button>

          {!initialData?.id && (
            <Button
              variant="secondary"
              onClick={() => handleSubmit(true)}
              isLoading={isLoading}
              className="w-full sm:w-auto"
            >
              Simpan & Tambah Lagi
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => handleSubmit(false)}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {initialData?.id ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
