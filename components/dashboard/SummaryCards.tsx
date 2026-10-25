'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { FinancialSummary } from '@/types';
import { formatIDR } from '@/lib/finance/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  PieChart,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/Progress';

interface SummaryCardsProps {
  summary: FinancialSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const isNetPositive = summary.netCashFlow >= 0;
  const budgetPercentage =
    summary.budgetTotal > 0
      ? Math.min(100, Math.round((summary.budgetUsed / summary.budgetTotal) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Total Saldo */}
      <Card hoverEffect className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-100">Total Saldo</span>
          <div className="p-2 rounded-xl bg-white/10 text-white">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-xl font-extrabold tracking-tight">{formatIDR(summary.totalBalance)}</h3>
          <p className="text-[10px] text-emerald-200 mt-0.5">Saldo aktif seluruh akun</p>
        </div>
      </Card>

      {/* 2. Pemasukan Bulan Ini */}
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pemasukan Bulan Ini</span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-emerald-600 dark:text-emerald-400">
            {formatIDR(summary.totalIncome)}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Bulan berjalan</p>
        </div>
      </Card>

      {/* 3. Pengeluaran Bulan Ini */}
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pengeluaran Bulan Ini</span>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
            {formatIDR(summary.totalExpense)}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
            {summary.expenseChangePercent !== 0 && (
              <span
                className={cn(
                  'inline-flex items-center font-bold',
                  summary.expenseChangePercent > 0 ? 'text-rose-500' : 'text-emerald-500'
                )}
              >
                {summary.expenseChangePercent > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(Math.round(summary.expenseChangePercent))}%
              </span>
            )}
            <span>vs bulan lalu</span>
          </div>
        </div>
      </Card>

      {/* 4. Selisih / Net Cashflow */}
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Arus Kas Bersih</span>
          <div
            className={cn(
              'p-2 rounded-xl',
              isNetPositive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
            )}
          >
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3
            className={cn(
              'text-lg font-bold',
              isNetPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatIDR(summary.netCashFlow)}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {isNetPositive ? 'Surplus (Pemasukan > Pengeluaran)' : 'Defisit (Pengeluaran > Pemasukan)'}
          </p>
        </div>
      </Card>

      {/* 5. Anggaran Terpakai */}
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Anggaran Terpakai</span>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{budgetPercentage}%</h3>
            <span className="text-[10px] text-gray-400">Sisa {formatIDR(summary.budgetRemaining)}</span>
          </div>
          <div className="mt-2">
            <Progress
              value={budgetPercentage}
              color={
                budgetPercentage >= 100
                  ? 'bg-rose-500'
                  : budgetPercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }
            />
          </div>
        </div>
      </Card>

      {/* 6. Total Tabungan */}
      <Card hoverEffect>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tabungan Terkumpul</span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatIDR(summary.totalSavings)}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {summary.savingsRate > 0 ? `${Math.round(summary.savingsRate)}% rasio simpanan` : 'Target tabungan aktif'}
          </p>
        </div>
      </Card>
    </div>
  );
}
