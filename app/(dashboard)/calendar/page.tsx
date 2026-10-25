'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Transaction } from '@/types';
import { formatIDR, formatDateLongID, formatDateID, getTodayISODate } from '@/lib/finance/formatters';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISODate());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadMonthTransactions() {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Fetch transactions for current year and month
        const start = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const end = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const { data } = await supabase
          .from('transactions')
          .select('*, account:financial_accounts(name), category:categories(name)')
          .eq('user_id', userData.user.id)
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: false });

        setTransactions(data || []);
      } catch (err) {
        console.error('Error loading calendar tx:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMonthTransactions();
  }, [currentYear, currentMonth]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Map transactions by date
  const txByDate: Record<string, { income: number; expense: number; count: number }> = {};
  transactions.forEach((tx) => {
    if (tx.status !== 'confirmed') return;
    const d = tx.transaction_date;
    if (!txByDate[d]) txByDate[d] = { income: 0, expense: 0, count: 0 };
    if (tx.transaction_type === 'income') txByDate[d].income += Number(tx.amount);
    if (tx.transaction_type === 'expense') txByDate[d].expense += Number(tx.amount);
    txByDate[d].count += 1;
  });

  const selectedTransactions = transactions.filter((t) => t.transaction_date === selectedDate);
  const selectedDaySummary = txByDate[selectedDate] || { income: 0, expense: 0, count: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Kalender Keuangan</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Pantau aktivitas harian dan pola pengeluaran Anda dalam tampilan kalender interaktif
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 p-5 sm:p-6 space-y-5">
          {/* Month Header Controller */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={prevMonth} className="p-1.5">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentYear(new Date().getFullYear());
                  setCurrentMonth(new Date().getMonth());
                  setSelectedDate(getTodayISODate());
                }}
                className="text-xs px-2.5 py-1"
              >
                Hari Ini
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth} className="p-1.5">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Blank offset days */}
            {[...Array(firstDayIndex)].map((_, i) => (
              <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-xl bg-transparent" />
            ))}

            {/* Days of current month */}
            {[...Array(daysInMonth)].map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = getTodayISODate() === dateStr;
              const dayData = txByDate[dateStr];

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'h-14 sm:h-20 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none',
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : isToday
                      ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
                      : 'border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center',
                        isToday
                          ? 'bg-emerald-600 text-white font-extrabold'
                          : isSelected
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {dayNum}
                    </span>
                    {dayData && (
                      <span className="hidden sm:inline text-[9px] text-gray-400 font-semibold">
                        {dayData.count} tx
                      </span>
                    )}
                  </div>

                  {/* Financial Activity Dots & Labels */}
                  <div className="space-y-0.5">
                    {dayData?.income ? (
                      <div className="hidden sm:block text-[9px] text-emerald-600 font-bold truncate">
                        +{formatIDR(dayData.income)}
                      </div>
                    ) : null}
                    {dayData?.expense ? (
                      <div className="hidden sm:block text-[9px] text-rose-600 font-bold truncate">
                        -{formatIDR(dayData.expense)}
                      </div>
                    ) : null}

                    {/* Mobile Dots */}
                    <div className="flex sm:hidden items-center justify-center gap-1">
                      {dayData?.income ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ) : null}
                      {dayData?.expense ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Date Summary & Transactions */}
        <Card className="p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Aktivitas Keuangan Harian
              </span>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 mt-0.5">
                {formatDateLongID(selectedDate)}
              </h3>
            </div>

            {/* Daily Net Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                <span className="text-[10px] block font-medium">Pemasukan</span>
                <span className="font-extrabold">{formatIDR(selectedDaySummary.income)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                <span className="text-[10px] block font-medium">Pengeluaran</span>
                <span className="font-extrabold">{formatIDR(selectedDaySummary.expense)}</span>
              </div>
            </div>

            {/* Transactions on Selected Date */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Daftar Transaksi ({selectedTransactions.length})
              </h4>

              {selectedTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Tidak ada transaksi tercatat pada tanggal ini.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto pr-1 text-xs">
                  {selectedTransactions.map((tx) => {
                    const isIncome = tx.transaction_type === 'income';

                    return (
                      <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                            {tx.description}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {tx.account?.name} • {tx.category?.name || 'Tanpa Kategori'}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'font-black text-right shrink-0',
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          )}
                        >
                          {isIncome ? '+' : '-'}
                          {formatIDR(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
