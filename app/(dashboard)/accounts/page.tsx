'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { FinancialAccount, Transaction, AccountType } from '@/types';
import { formatIDR, formatDateID } from '@/lib/finance/formatters';
import { calculateAccountBalances } from '@/lib/finance/calculator';
import { createClient } from '@/lib/supabase/client';
import {
  Wallet,
  Plus,
  Building,
  CreditCard,
  PiggyBank,
  CircleDollarSign,
  Edit2,
  Trash2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [color, setColor] = useState('#10B981');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const loadAccountsData = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: accs } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: true });

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('status', 'confirmed');

      const computedAccounts = calculateAccountBalances(accs || [], txs || []);
      setAccounts(computedAccounts);
      setTransactions(txs || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccountsData();
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setAccountType('bank');
    setOpeningBalance('0');
    setColor('#10B981');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setAccountType(acc.account_type);
    setOpeningBalance(String(acc.opening_balance));
    setColor(acc.color || '#10B981');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!name.trim()) {
      setErrorMessage('Nama akun wajib diisi.');
      return;
    }
    const numOpening = parseFloat(openingBalance.replace(/[^0-9-]/g, '')) || 0;

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Unauthorized');

      if (editingAccount) {
        // Update
        const { error } = await supabase
          .from('financial_accounts')
          .update({
            name: name.trim(),
            account_type: accountType,
            opening_balance: numOpening,
            color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAccount.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('financial_accounts').insert({
          user_id: userData.user.id,
          name: name.trim(),
          account_type: accountType,
          opening_balance: numOpening,
          currency: 'IDR',
          color,
          is_active: true,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      loadAccountsData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan akun.');
    } finally {
      setIsSaving(false);
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building className="w-5 h-5 text-blue-600" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-rose-600" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-purple-600" />;
      case 'e_wallet':
        return <CircleDollarSign className="w-5 h-5 text-amber-600" />;
      default:
        return <Wallet className="w-5 h-5 text-emerald-600" />;
    }
  };

  const totalConsolidated = accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
            Akun Keuangan & Dompet
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Kelola seluruh rekening bank, dompet tunai, e-wallet, dan kartu kredit Anda
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </Button>
      </div>

      {/* Net Worth Banner */}
      <Card className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white border-none p-6 shadow-md">
        <span className="text-xs font-semibold text-emerald-200">Total Kekayaan Bersih (Seluruh Akun)</span>
        <h2 className="text-2xl sm:text-3xl font-black mt-1">
          {formatIDR(totalConsolidated)}
        </h2>
        <p className="text-xs text-emerald-100/80 mt-1">
          Terhitung dari saldo awal dan seluruh mutasi transaksi yang terverifikasi.
        </p>
      </Card>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)
        ) : accounts.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-gray-400 text-xs">
            Belum ada akun keuangan. Buat akun pertama Anda sekarang.
          </div>
        ) : (
          accounts.map((acc) => (
            <Card key={acc.id} hoverEffect className="flex flex-col justify-between p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${acc.color}20` }}
                  >
                    {getAccountIcon(acc.account_type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
                      {acc.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {acc.account_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(acc)}
                    title="Edit Akun"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href={`/accounts/${acc.id}`}
                    title="Lihat Mutasi Buku Kas"
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-semibold block">Saldo Saat Ini</span>
                <span
                  className={cn(
                    'text-lg font-black',
                    (acc.current_balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {formatIDR(acc.current_balance)}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Saldo Awal: {formatIDR(acc.opening_balance)}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Edit Akun Keuangan' : 'Tambah Akun Baru'}
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
              {errorMessage}
            </div>
          )}

          <Input
            label="Nama Akun"
            placeholder="Contoh: BCA Utama, Dompet Tunai, GoPay"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tipe Akun</label>
            <select
              value={accountType}
              onChange={(e: any) => setAccountType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm"
            >
              <option value="bank">Rekening Bank</option>
              <option value="cash">Tunai / Kas</option>
              <option value="e_wallet">Dompet Digital / E-Wallet</option>
              <option value="savings">Tabungan / Investasi</option>
              <option value="credit_card">Kartu Kredit</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <Input
            label="Saldo Awal (Rp)"
            placeholder="0"
            value={openingBalance}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9-]/g, '');
              setOpeningBalance(raw ? Number(raw).toLocaleString('id-ID') : '');
            }}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveAccount} isLoading={isSaving}>
              {editingAccount ? 'Perbarui Akun' : 'Simpan Akun'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
