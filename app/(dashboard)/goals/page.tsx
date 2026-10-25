'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { SavingsGoal } from '@/types';
import { formatIDR, formatDateID, formatDateLongID } from '@/lib/finance/formatters';
import { Plus, Target, CheckCircle2, Calendar, Calculator, Edit2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      setGoals(data || []);
    } catch (err) {
      console.error('Error loading goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const openCreateModal = () => {
    setSelectedGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setDescription('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openDepositModal = (g: SavingsGoal) => {
    setSelectedGoal(g);
    setDepositAmount('');
    setErrorMessage(null);
    setIsDepositOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!name.trim()) {
      setErrorMessage('Nama target tabungan wajib diisi.');
      return;
    }
    const numTarget = parseFloat(targetAmount.replace(/[^0-9]/g, ''));
    if (isNaN(numTarget) || numTarget <= 0) {
      setErrorMessage('Target nominal harus lebih dari 0.');
      return;
    }
    const numCurrent = parseFloat(currentAmount.replace(/[^0-9]/g, '')) || 0;

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Unauthorized');

      const payload = {
        name: name.trim(),
        target_amount: numTarget,
        current_amount: numCurrent,
        target_date: targetDate || null,
        description: description.trim() || null,
        status: (numCurrent >= numTarget ? 'completed' : 'active') as any,
      };

      if (selectedGoal) {
        await supabase.from('savings_goals').update(payload).eq('id', selectedGoal.id);
      } else {
        await supabase.from('savings_goals').insert({ ...payload, user_id: userData.user.id });
      }

      setIsModalOpen(false);
      loadGoals();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan target tabungan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedGoal) return;
    const numDeposit = parseFloat(depositAmount.replace(/[^0-9]/g, ''));
    if (isNaN(numDeposit) || numDeposit <= 0) {
      setErrorMessage('Nominal tabungan harus lebih dari 0.');
      return;
    }

    setIsSaving(true);
    try {
      const newTotal = Number(selectedGoal.current_amount) + numDeposit;
      const isComplete = newTotal >= Number(selectedGoal.target_amount);

      await supabase
        .from('savings_goals')
        .update({
          current_amount: newTotal,
          status: isComplete ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedGoal.id);

      setIsDepositOpen(false);
      loadGoals();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyetor tabungan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Hapus target tabungan ini?')) return;
    try {
      await supabase.from('savings_goals').delete().eq('id', goalId);
      loadGoals();
    } catch (err) {
      alert('Gagal menghapus.');
    }
  };

  // Savings Calculator Helper
  const calculateRequiredSaving = (target: number, current: number, targetDateStr: string | null) => {
    if (!targetDateStr) return null;
    const remaining = Math.max(0, target - current);
    if (remaining <= 0) return { months: 0, perMonth: 0, perWeek: 0 };

    const now = new Date();
    const tDate = new Date(targetDateStr);
    const diffTime = tDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return null;

    const diffMonths = Math.max(1, Math.round(diffDays / 30));
    const diffWeeks = Math.max(1, Math.round(diffDays / 7));

    return {
      months: diffMonths,
      weeks: diffWeeks,
      perMonth: Math.round(remaining / diffMonths),
      perWeek: Math.round(remaining / diffWeeks),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
            Target Tabungan (Savings Goals)
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Rencanakan dana darurat, liburan, pendidikan, kendaraan, dan impian finansial Anda
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Buat Target Baru</span>
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full" />)
        ) : goals.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-xs text-gray-400 space-y-2">
            <Target className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-700 dark:text-gray-300">Belum ada target tabungan</p>
            <p>Mulai tetapkan tujuan menabung pertama Anda hari ini.</p>
          </div>
        ) : (
          goals.map((g) => {
            const current = Number(g.current_amount) || 0;
            const target = Number(g.target_amount) || 1;
            const percentage = Math.min(100, Math.round((current / target) * 100));
            const isCompleted = percentage >= 100;
            const calc = calculateRequiredSaving(target, current, g.target_date);

            return (
              <Card key={g.id} hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{g.name}</h3>
                      {g.target_date && (
                        <p className="text-[10px] text-gray-400">
                          Target: {formatDateID(g.target_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id)}
                    className="p-1 rounded-md text-gray-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {formatIDR(current)}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      dari {formatIDR(target)}
                    </span>
                  </div>

                  <Progress
                    value={percentage}
                    color={isCompleted ? 'bg-emerald-500' : 'bg-purple-600'}
                  />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {percentage}% Tercapai
                    </span>
                    <span className="text-gray-400">
                      Kekurangan: {formatIDR(Math.max(0, target - current))}
                    </span>
                  </div>
                </div>

                {/* Savings Requirement Calculator Box */}
                {calc && !isCompleted && (
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-200">
                      <Calculator className="w-3 h-3 text-purple-600" />
                      <span>Rekomendasi Tabungan:</span>
                    </div>
                    <p>
                      Sisihkan <strong>{formatIDR(calc.perMonth)}</strong>/bulan (atau{' '}
                      <strong>{formatIDR(calc.perWeek)}</strong>/minggu) untuk mencapai target tepat waktu.
                    </p>
                  </div>
                )}

                {isCompleted ? (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Target Berhasil Tercapai!</span>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openDepositModal(g)}
                    className="w-full text-xs font-bold"
                  >
                    + Catat Tabungan Baru
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGoal ? 'Edit Target Tabungan' : 'Buat Target Tabungan'}
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}

          <Input
            label="Nama Target"
            placeholder="Contoh: Dana Darurat 6 Bulan, Beli Laptop, DP Rumah"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Target Nominal yang Ingin Dicapai (Rp)"
            placeholder="10.000.000"
            value={targetAmount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setTargetAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
            }}
          />

          <Input
            label="Saldo yang Sudah Terkumpul Saat Ini (Rp)"
            placeholder="0"
            value={currentAmount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setCurrentAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
            }}
          />

          <Input
            label="Target Tanggal Tercapai (Opsional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Deskripsi / Catatan (Opsional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan motivasi atau alasan menabung..."
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border rounded-xl text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveGoal} isLoading={isSaving}>
              Simpan Target
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Deposit Modal */}
      <Modal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        title={`Tambah Tabungan: ${selectedGoal?.name}`}
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Masukkan jumlah uang yang ingin Anda tambahkan ke target tabungan ini.
          </p>

          <Input
            label="Jumlah Tambahan Tabungan (Rp)"
            placeholder="500.000"
            value={depositAmount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setDepositAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
            }}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" onClick={() => setIsDepositOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleDeposit} isLoading={isSaving}>
              Simpan Tabungan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
