'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Budget, Category, Transaction, PeriodType } from '@/types';
import { formatIDR, getTodayISODate } from '@/lib/finance/formatters';
import { calculateBudgetUsage } from '@/lib/finance/calculator';
import { Plus, PieChart, AlertTriangle, AlertCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const loadBudgetData = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
        .eq('is_archived', false);
      setCategories(cats || []);

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('status', 'confirmed');
      setTransactions(txs || []);

      const { data: bgs } = await supabase
        .from('budgets')
        .select('*, category:categories(id, name, color)')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (bgs && txs) {
        const enriched = bgs.map((b) => calculateBudgetUsage(b, txs));
        setBudgets(enriched);
      }
    } catch (err) {
      console.error('Error loading budgets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  const openCreateModal = () => {
    setEditingBudget(null);
    setName('');
    setAmount('');
    setCategoryId('');
    setPeriodType('monthly');

    // Default dates: start of current month to end of current month
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const start = new Date(y, m, 1).toISOString().slice(0, 10);
    const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    setStartDate(start);
    setEndDate(end);

    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (bg: Budget) => {
    setEditingBudget(bg);
    setName(bg.name);
    setAmount(String(bg.amount));
    setCategoryId(bg.category_id || '');
    setPeriodType(bg.period_type);
    setStartDate(bg.start_date);
    setEndDate(bg.end_date);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage('Nama anggaran wajib diisi.');
      return;
    }
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Nominal batas anggaran harus lebih dari 0.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Tanggal periode awal dan akhir wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Unauthorized');

      const payload = {
        name: name.trim(),
        amount: numAmount,
        category_id: categoryId || null,
        period_type: periodType,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      };

      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update(payload)
          .eq('id', editingBudget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budgets').insert({
          ...payload,
          user_id: userData.user.id,
        });
        if (error) throw error;
      }

      setIsModalOpen(false);
      loadBudgetData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan anggaran.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (bgId: string) => {
    if (!confirm('Hapus anggaran ini?')) return;
    try {
      await supabase.from('budgets').delete().eq('id', bgId);
      loadBudgetData();
    } catch (err) {
      alert('Gagal menghapus anggaran.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
            Manajemen Anggaran (Budgeting)
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tetapkan batas pengeluaran mingguan atau bulanan agar tidak boros
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Buat Anggaran Baru</span>
        </Button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)
        ) : budgets.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-gray-400 space-y-2">
            <PieChart className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700 dark:text-gray-300">Belum ada anggaran aktif</p>
            <p>Buat anggaran per kategori (misal: Makan, Hiburan) atau batas pengeluaran total.</p>
          </div>
        ) : (
          budgets.map((bg) => {
            const pct = bg.percentage ?? 0;
            const isExceeded = pct >= 100;
            const isWarning = pct >= 80 && !isExceeded;

            return (
              <Card key={bg.id} hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{bg.name}</h3>
                    <p className="text-[10px] text-gray-400">
                      {bg.category ? bg.category.name : 'Anggaran Pengeluaran Total'} • {bg.period_type === 'monthly' ? 'Bulanan' : 'Mingguan'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(bg)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bg.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress & Numbers */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {formatIDR(bg.spent_amount)}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      dari {formatIDR(bg.amount)}
                    </span>
                  </div>

                  <Progress
                    value={pct}
                    color={isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}
                  />

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span
                      className={cn(
                        'font-bold',
                        isExceeded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                      )}
                    >
                      {pct}% Terpakai
                    </span>
                    <span className="text-gray-500">
                      Sisa {formatIDR(bg.remaining_amount)}
                    </span>
                  </div>
                </div>

                {/* Alert Badge if critical */}
                {isExceeded ? (
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 text-[10px] font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Peringatan: Anggaran telah melebihi batas 100%!</span>
                  </div>
                ) : isWarning ? (
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 text-[10px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Perhatian: Penggunaan telah mencapai {pct}%</span>
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Anggaran' : 'Buat Anggaran Baru'}
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}

          <Input
            label="Nama Anggaran"
            placeholder="Contoh: Anggaran Makan & Minum, Batas Hiburan"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Batas Maksimum Anggaran (Rp)"
            placeholder="1.000.000"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
            }}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
            >
              <option value="">Semua Kategori (Anggaran Total)</option>
              {categories
                .filter((c) => c.transaction_type === 'expense' || c.transaction_type === 'both')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mulai Tanggal"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Sampai Tanggal"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {editingBudget ? 'Perbarui Anggaran' : 'Simpan Anggaran'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
