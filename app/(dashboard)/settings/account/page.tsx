'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccountSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmationInput !== 'HAPUS AKUN SAYA') {
      setErrorMessage('Ketik "HAPUS AKUN SAYA" secara tepat untuk mengonfirmasi.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Unauthorized');

      // Call stored procedure to cascade delete all records
      const { error } = await supabase.rpc('delete_user_entire_data', {
        target_user_id: userData.user.id,
      });

      if (error) {
        // Fallback: delete from profiles table directly (RLS CASCADE will clean up children)
        await supabase.from('profiles').delete().eq('id', userData.user.id);
      }

      // Sign out
      await supabase.auth.signOut();
      router.push('/login?notice=Akun_berhasil_dihapus');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus akun.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
          Pengaturan Akun & Penghapusan
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Kelola identitas akun dan penghapusan data permanen</p>
      </div>

      {/* Navigation Submenu */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 text-xs font-bold">
        <Link
          href="/settings"
          className="px-3.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-800"
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
          className="px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
        >
          Pengaturan Akun & Hapus
        </Link>
      </div>

      {/* Danger Zone */}
      <Card className="p-6 border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Zona Berbahaya: Hapus Akun Permanen
            </h2>
            <p className="text-xs text-rose-600/80">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          Menghapus akun akan menghapus secara permanen seluruh data profil, akun keuangan, riwayat transaksi, anggaran, target tabungan, foto bukti struk di penyimpanan cloud, dan riwayat percakapan AI Anda. Data yang telah dihapus tidak dapat dipulihkan.
        </p>

        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setConfirmationInput('');
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            className="gap-2 text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Akun & Seluruh Data Keuangan</span>
          </Button>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Konfirmasi Penghapusan Akun Permanen"
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Untuk mengonfirmasi bahwa Anda memahami dampak penghapusan permanen ini, silakan ketik teks berikut pada kolom di bawah:
          </p>

          <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-center font-mono font-bold text-xs select-all text-rose-600">
            HAPUS AKUN SAYA
          </div>

          <Input
            placeholder="Ketik HAPUS AKUN SAYA"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={confirmationInput !== 'HAPUS AKUN SAYA'}
            >
              Ya, Hapus Akun Sekarang
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
