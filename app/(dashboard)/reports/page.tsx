'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Transaction, FinancialSummary } from '@/types';
import { formatIDR, formatDateID, getTodayISODate } from '@/lib/finance/formatters';
import {
  Download,
  Printer,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  PieChart,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { ExpenseCategoryChart } from '@/components/dashboard/ExpenseCategoryChart';
import Link from 'next/link';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'last_3_months' | 'this_year'>('this_month');
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadReportData() {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const today = new Date();
        let startDate = '';
        const endDate = today.toISOString().slice(0, 10);

        if (period === 'this_month') {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        } else if (period === 'last_month') {
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
        } else if (period === 'last_3_months') {
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 10);
        } else if (period === 'this_year') {
          startDate = `${today.getFullYear()}-01-01`;
        }

        const { data } = await supabase
          .from('transactions')
          .select('*, account:financial_accounts(name), category:categories(name)')
          .eq('user_id', userData.user.id)
          .eq('status', 'confirmed')
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('transaction_date', { ascending: false });

        setTransactions(data || []);
      } catch (err) {
        console.error('Error loading report:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReportData();
  }, [period]);

  // Aggregate numbers
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    if (tx.transaction_type === 'income') totalIncome += Number(tx.amount);
    if (tx.transaction_type === 'expense') totalExpense += Number(tx.amount);
  });
  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netCashFlow / totalIncome) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
            Laporan Keuangan & Analisis
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Analisis arus kas masuk dan keluar secara komprehensif
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </Button>

          <Link href="/api/exports?format=csv" target="_blank">
            <Button variant="primary" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              <span>Unduh CSV</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setPeriod('this_month')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
            period === 'this_month'
              ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Bulan Ini
        </button>
        <button
          onClick={() => setPeriod('last_month')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
            period === 'last_month'
              ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Bulan Lalu
        </button>
        <button
          onClick={() => setPeriod('last_3_months')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
            period === 'last_3_months'
              ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          3 Bulan Terakhir
        </button>
        <button
          onClick={() => setPeriod('this_year')}
          className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
            period === 'this_year'
              ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Tahun Berjalan
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-gray-400 font-semibold">Total Pemasukan</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">{formatIDR(totalIncome)}</h3>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-gray-400 font-semibold">Total Pengeluaran</span>
          <h3 className="text-xl font-bold text-rose-600 mt-1">{formatIDR(totalExpense)}</h3>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-gray-400 font-semibold">Arus Kas Bersih (Net)</span>
          <h3
            className={`text-xl font-bold mt-1 ${
              netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatIDR(netCashFlow)}
          </h3>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-gray-400 font-semibold">Tingkat Simpanan</span>
          <h3 className="text-xl font-bold text-purple-600 mt-1">{Math.round(savingsRate)}%</h3>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <CashFlowChart transactions={transactions} />
          )}
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ExpenseCategoryChart transactions={transactions} />
          )}
        </div>
      </div>
    </div>
  );
}
