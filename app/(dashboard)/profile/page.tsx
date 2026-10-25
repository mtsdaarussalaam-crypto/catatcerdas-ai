'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Globe, Clock, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setTimezone(data.timezone || 'Asia/Jakarta');
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    setSuccessNotice(false);

    try {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
    } catch {
      alert('Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Profil Pengguna</h1>
        <p className="text-xs text-gray-400 mt-0.5">Informasi akun Google terverifikasi Anda</p>
      </div>

      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Profil berhasil diperbarui.</span>
        </div>
      )}

      <Card className="p-6 sm:p-8 space-y-6">
        {/* Avatar & Email */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center overflow-hidden shadow-md">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              fullName?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {fullName || 'Pengguna CatatCerdas'}
            </h2>
            <p className="text-xs text-gray-400">{profile?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              Akun Google Terautentikasi
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Alamat Email (Akun Google)
            </label>
            <input
              type="text"
              disabled
              value={profile?.email || ''}
              className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800 border rounded-xl text-xs text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Zona Waktu</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-xs"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Mata Uang Utama</label>
              <input
                type="text"
                disabled
                value="Rupiah (IDR / Rp)"
                className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800 border rounded-xl text-xs text-gray-500 cursor-not-allowed font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            Simpan Perubahan
          </Button>
        </div>
      </Card>
    </div>
  );
}
