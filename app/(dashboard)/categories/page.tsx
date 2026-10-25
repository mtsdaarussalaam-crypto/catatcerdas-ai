'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Category } from '@/types';
import { Plus, Tags, Edit2, Archive, ShieldCheck, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#10B981');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
        .eq('is_archived', false)
        .order('is_system', { ascending: false })
        .order('name');

      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setTransactionType(activeTab);
    setColor(activeTab === 'expense' ? '#EF4444' : '#10B981');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setTransactionType(cat.transaction_type === 'income' ? 'income' : 'expense');
    setColor(cat.color || '#10B981');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Unauthorized');

      if (editingCategory) {
        // Update user category only
        if (editingCategory.is_system) {
          throw new Error('Kategori bawaan sistem tidak dapat diubah namanya.');
        }

        const { error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            transaction_type: transactionType,
            color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id)
          .eq('user_id', userData.user.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('categories').insert({
          user_id: userData.user.id,
          name: name.trim(),
          transaction_type: transactionType,
          color,
          is_system: false,
          is_archived: false,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (cat: Category) => {
    if (cat.is_system) {
      alert('Kategori bawaan sistem tidak dapat diarsipkan.');
      return;
    }

    if (!confirm(`Arsipkan kategori "${cat.name}"? Kategori ini tidak akan muncul di daftar pilihan baru.`)) return;

    try {
      await supabase
        .from('categories')
        .update({ is_archived: true })
        .eq('id', cat.id);
      loadCategories();
    } catch (err) {
      alert('Gagal mengarsipkan kategori.');
    }
  };

  const filtered = categories.filter(
    (c) => c.transaction_type === activeTab || c.transaction_type === 'both'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Manajemen Kategori</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Atur pos-pos pemasukan dan pengeluaran Anda agar laporan terstruktur
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('expense')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'expense'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          )}
        >
          Kategori Pengeluaran ({categories.filter((c) => c.transaction_type === 'expense').length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'income'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          )}
        >
          Kategori Pemasukan ({categories.filter((c) => c.transaction_type === 'income').length})
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {isLoading ? (
          [...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-4 py-12 text-center text-xs text-gray-400">
            Belum ada kategori untuk tipe ini.
          </div>
        ) : (
          filtered.map((cat) => (
            <Card key={cat.id} hoverEffect className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                  style={{ backgroundColor: cat.color || '#10B981' }}
                >
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate block">
                    {cat.name}
                  </span>
                  {cat.is_system ? (
                    <span className="text-[9px] text-gray-400 font-medium">Bawaan Sistem</span>
                  ) : (
                    <span className="text-[9px] text-emerald-600 font-bold">Kustom Anda</span>
                  )}
                </div>
              </div>

              {!cat.is_system && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(cat)}
                    className="p-1 rounded-md text-gray-400 hover:text-rose-600"
                    title="Arsipkan"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}

          <Input
            label="Nama Kategori"
            placeholder="Contoh: Belanja Online, Servis Motor, Kopi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tipe Kategori</label>
            <select
              value={transactionType}
              onChange={(e: any) => setTransactionType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {editingCategory ? 'Perbarui' : 'Simpan Kategori'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
