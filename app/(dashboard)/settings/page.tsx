'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { Settings, Shield, User, Bell, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyRecap, setWeeklyRecap] = useState(true);
  const [monthlyRecap, setMonthlyRecap] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (data) {
        setProfile(data);
        if (data.preferences) {
          setBudgetAlerts(data.preferences.budget_alerts !== false);
          setWeeklyRecap(data.preferences.weekly_recap !== false);
          setMonthlyRecap(data.preferences.monthly_recap !== false);
        }
      }
    }
    loadSettings();
  }, []);

  const handleSavePreferences = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          preferences: {
            ...profile.preferences,
            budget_alerts: budgetAlerts,
            weekly_recap: weeklyRecap,
            monthly_recap: monthlyRecap,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch {
      alert('Gagal menyimpan preferensi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Pengaturan Aplikasi</h1>
        <p className="text-xs text-gray-400 mt-0.5">Kelola preferensi notifikasi, privasi, dan akun Anda</p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan preferensi berhasil disimpan.</span>
        </div>
      )}

      {/* Navigation Submenu */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 text-xs font-bold">
        <Link
          href="/settings"
          className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Umum & Notifikasi
        </Link>
        <Link
          href="/settings/privacy"
          className="px-3.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-800"
        >
          Kebijakan & Privasi AI
        </Link>
        <Link
          href="/settings/account"
          className="px-3.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
        >
          Pengaturan Akun & Hapus
        </Link>
      </div>

      {/* Preferences Card */}
      <Card className="p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifikasi Dalam Aplikasi</h2>
          <p className="text-xs text-gray-400">Pilih jenis pemberitahuan otomatis yang ingin Anda terima</p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                Peringatan Batas Anggaran
              </span>
              <span className="text-[11px] text-gray-400">
                Kirim notifikasi saat pengeluaran mendekati 80% dan melebihi 100% anggaran.
              </span>
            </div>
            <input
              type="checkbox"
              checked={budgetAlerts}
              onChange={(e) => setBudgetAlerts(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                Rekap Keuangan Mingguan
              </span>
              <span className="text-[11px] text-gray-400">
                Pemberitahuan ringkasan arus kas setiap akhir pekan.
              </span>
            </div>
            <input
              type="checkbox"
              checked={weeklyRecap}
              onChange={(e) => setWeeklyRecap(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                Rekap Keuangan Bulanan
              </span>
              <span className="text-[11px] text-gray-400">
                Laporan komprehensif pemasukan dan pengeluaran pada pergantian bulan.
              </span>
            </div>
            <input
              type="checkbox"
              checked={monthlyRecap}
              onChange={(e) => setMonthlyRecap(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded"
            />
          </label>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button variant="primary" size="sm" onClick={handleSavePreferences} isLoading={isSaving}>
            Simpan Preferensi
          </Button>
        </div>
      </Card>
    </div>
  );
}
