'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Transaction, Category, FinancialAccount } from '@/types';
import { formatIDR, formatDateID, formatDateLongID } from '@/lib/finance/formatters';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Mic,
  Camera,
  Repeat,
  FileSpreadsheet,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const supabase = createClient();

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (accountFilter) params.set('accountId', accountFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', String(page));
      params.set('limit', '25');

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
          setTotalCount(json.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial accounts & categories
  useEffect(() => {
    async function initMeta() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userData.user.id},is_system.eq.true`)
        .eq('is_archived', false);
      if (cats) setCategories(cats);

      const { data: accs } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_active', true);
      if (accs) setAccounts(accs);
    }
    initMeta();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, categoryFilter, accountFilter, sourceFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setAccountFilter('');
    setSourceFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'voice':
        return <Mic className="w-3.5 h-3.5 text-blue-500" />;
      case 'photo':
        return <Camera className="w-3.5 h-3.5 text-purple-500" />;
      case 'recurring':
        return <Repeat className="w-3.5 h-3.5 text-amber-500" />;
      case 'import':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-500" />;
      default:
        return <Edit2 className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Riwayat Transaksi</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Daftar lengkap pemasukan, pengeluaran, dan transfer ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Link href="/api/exports?format=csv" target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTx(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari deskripsi transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </form>

          {/* Quick Type Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => {
                setTypeFilter('');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap',
                typeFilter === '' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'
              )}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setTypeFilter('expense');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap',
                typeFilter === 'expense' ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm' : 'text-gray-500'
              )}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => {
                setTypeFilter('income');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap',
                typeFilter === 'income' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm' : 'text-gray-500'
              )}
            >
              Pemasukan
            </button>
            <button
              onClick={() => {
                setTypeFilter('transfer');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap',
                typeFilter === 'transfer' ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500'
              )}
            >
              Transfer
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="gap-2 shrink-0 w-full sm:w-auto"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Detail</span>
          </Button>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilterDrawer && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                Kategori
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-xs"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                Akun Keuangan
              </label>
              <select
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-xs"
              >
                <option value="">Semua Akun</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                Sumber Input
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-xs"
              >
                <option value="">Semua Sumber</option>
                <option value="manual">Manual</option>
                <option value="voice">Suara AI</option>
                <option value="photo">Scan Struk AI</option>
                <option value="recurring">Berulang</option>
                <option value="import">Impor</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                Rentang Tanggal
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border rounded-xl text-[11px]"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border rounded-xl text-[11px]"
                />
              </div>
            </div>

            <div className="sm:col-span-2 md:col-span-4 flex justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                Reset Filter
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Transactions Table & Mobile Cards */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Tidak ada transaksi yang cocok
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Coba ubah kata kunci pencarian atau reset filter yang dipilih.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 dark:bg-gray-800/40 text-gray-500 border-b border-gray-100 dark:border-gray-800 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Deskripsi</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Akun</th>
                    <th className="py-3.5 px-4">Metode</th>
                    <th className="py-3.5 px-4">Sumber</th>
                    <th className="py-3.5 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.map((tx) => {
                    const isIncome = tx.transaction_type === 'income';
                    const isTransfer = tx.transaction_type === 'transfer';

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {formatDateID(tx.transaction_date)}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">
                          {tx.description}
                          {tx.merchant_name && (
                            <span className="block text-[10px] text-gray-400 font-normal">
                              {tx.merchant_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isTransfer ? (
                            <span className="text-blue-600 font-semibold">Transfer</span>
                          ) : tx.category ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                              {tx.category.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          {tx.account?.name || '-'}
                          {isTransfer && tx.target_account && (
                            <span className="text-gray-400 block text-[10px]">
                              → {tx.target_account.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 uppercase text-[10px] font-semibold">
                          {tx.payment_method.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 p-1 rounded-md bg-gray-100 dark:bg-gray-800">
                            {getSourceIcon(tx.source)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right font-black whitespace-nowrap text-sm',
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isTransfer
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatIDR(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {transactions.map((tx) => {
                const isIncome = tx.transaction_type === 'income';
                const isTransfer = tx.transaction_type === 'transfer';

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="p-4 flex items-center justify-between gap-3 active:bg-gray-50 dark:active:bg-gray-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                            : isTransfer
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
                        )}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : isTransfer ? (
                          <ArrowRightLeft className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                            {tx.description}
                          </h4>
                          {getSourceIcon(tx.source)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                          <span>{formatDateID(tx.transaction_date)}</span>
                          <span>•</span>
                          <span>{tx.account?.name}</span>
                          {tx.category && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold">
                                {tx.category.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          'text-xs font-bold',
                          isIncome
                            ? 'text-emerald-600'
                            : isTransfer
                            ? 'text-blue-600'
                            : 'text-rose-600'
                        )}
                      >
                        {isIncome ? '+' : isTransfer ? '' : '-'}
                        {formatIDR(tx.amount)}
                      </span>
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                        {tx.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <span>
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Form Modal */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTx(null);
        }}
        onSuccess={() => fetchTransactions()}
        categories={categories}
        accounts={accounts}
        initialData={editingTx}
      />

      {/* Detail Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        onEdit={(tx) => {
          setEditingTx(tx);
          setIsFormOpen(true);
        }}
        onDeleteSuccess={() => fetchTransactions()}
      />
    </div>
  );
}
