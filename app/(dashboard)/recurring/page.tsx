'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { RecurringTransaction, Category, FinancialAccount, RecurrenceRule } from '@/types';
import { formatIDR, formatDateID, getTodayISODate } from '@/lib/finance/formatters';
import { Plus, Repeat, Play, CheckCircle, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function RecurringPage() {
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('monthly');
  const [startDate, setStartDate] = useState(getTodayISODate());
  const [nextDueDate, setNextDueDate] = useState(getTodayISODate());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: accs } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_active', true);
      setAccounts(accs || []);
      if (accs && accs[0]) setAccountId(accs[0].id);

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
        .eq('is_archived', false);
      setCategories(cats || []);

      const { data: recs } = await supabase
        .from('recurring_transactions')
        .select('*, account:financial_accounts(name), category:categories(name)')
        .eq('user_id', userData.user.id)
        .order('next_due_date', { ascending: true });
      setRecurringList(recs || []);
    } catch (err) {
      console.error('Error loading recurring:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setDescription('');
    setAmount('');
    setTransactionType('expense');
    setRecurrenceRule('monthly');
    setStartDate(getTodayISODate());
    setNextDueDate(getTodayISODate());
    setCategoryId('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!description.trim()) {
      setErrorMessage('Deskripsi tagihan/pemasukan rutin wajib diisi.');
      return;
    }
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Nominal harus lebih dari 0.');
      return;
    }
    if (!accountId) {
      setErrorMessage('Akun keuangan wajib dipilih.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Unauthorized');

      const { error } = await supabase.from('recurring_transactions').insert({
        user_id: userData.user.id,
        account_id: accountId,
        category_id: categoryId || null,
        transaction_type: transactionType,
        amount: numAmount,
        description: description.trim(),
        recurrence_rule: recurrenceRule,
        start_date: startDate,
        next_due_date: nextDueDate,
        is_active: true,
      });

      if (error) throw error;

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan transaksi berulang.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcessDue = async () => {
    setIsProcessing(true);
    setProcessResult(null);
    try {
      const res = await fetch('/api/recurring/process', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setProcessResult(json.message || 'Transaksi berhasil diproses.');
        loadData();
      } else {
        setProcessResult(json.error || 'Gagal memproses transaksi berulang.');
      }
    } catch {
      setProcessResult('Terjadi gangguan saat memproses tagihan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal transaksi berulang ini?')) return;
    try {
      await supabase.from('recurring_transactions').delete().eq('id', id);
      loadData();
    } catch (err) {
      alert('Gagal menghapus.');
    }
  };

  const getFrequencyLabel = (rule: RecurrenceRule) => {
    switch (rule) {
      case 'daily':
        return 'Harian';
      case 'weekly':
        return 'Mingguan';
      case 'monthly':
        return 'Bulanan';
      case 'yearly':
        return 'Tahunan';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
            Transaksi Berulang & Tagihan Rutin
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Otomatisasi pengingat gaji bulanan, pembayaran listrik, internet, cicilan, dan langganan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessDue}
            isLoading={isProcessing}
            className="gap-2"
          >
            <Play className="w-4 h-4 text-emerald-600" />
            <span>Proses Jatuh Tempo</span>
          </Button>

          <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </Button>
        </div>
      </div>

      {processResult && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{processResult}</span>
        </div>
      )}

      {/* List */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : recurringList.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 space-y-2">
            <Repeat className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700 dark:text-gray-300">Belum ada transaksi berulang</p>
            <p>Jadwalkan pengeluaran rutin Anda agar tidak pernah terlambat bayar tagihan.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {recurringList.map((r) => {
              const isIncome = r.transaction_type === 'income';

              return (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      )}
                    >
                      <Repeat className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{r.description}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span className="font-semibold text-emerald-600">
                          {getFrequencyLabel(r.recurrence_rule)}
                        </span>
                        <span>•</span>
                        <span>Jatuh Tempo: {formatDateID(r.next_due_date)}</span>
                        <span>•</span>
                        <span>{r.account?.name || 'Akun'}</span>
                        {r.category && <span>• {r.category.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={cn(
                          'font-bold text-sm',
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        )}
                      >
                        {isIncome ? '+' : '-'}
                        {formatIDR(r.amount)}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {r.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Transaksi Berulang"
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}

          <Input
            label="Deskripsi Transaksi"
            placeholder="Contoh: Tagihan Listrik PLN, WiFi Indihome, Gaji Bulanan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tipe</label>
              <select
                value={transactionType}
                onChange={(e: any) => setTransactionType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Frekuensi</label>
              <select
                value={recurrenceRule}
                onChange={(e: any) => setRecurrenceRule(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm"
              >
                <option value="daily">Setiap Hari</option>
                <option value="weekly">Setiap Minggu</option>
                <option value="monthly">Setiap Bulan</option>
                <option value="yearly">Setiap Tahun</option>
              </select>
            </div>
          </div>

          <Input
            label="Nominal (Rp)"
            placeholder="250.000"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Akun</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm"
              >
                <option value="">Tanpa Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Tanggal Jatuh Tempo Berikutnya"
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              Simpan Jadwal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
