'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Transaction } from '@/types';
import { formatIDR, formatDateID } from '@/lib/finance/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CashFlowChartProps {
  transactions: Transaction[];
}

export function CashFlowChart({ transactions }: CashFlowChartProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="h-80 flex items-center justify-center">
        <p className="text-xs text-gray-400">Memuat grafik arus kas...</p>
      </Card>
    );
  }

  // Aggregate by date or month
  const aggregated: Record<string, { label: string; Pemasukan: number; Pengeluaran: number }> = {};

  transactions
    .filter((t) => t.status === 'confirmed' && t.transaction_type !== 'transfer')
    .forEach((t) => {
      const key = viewMode === 'daily' ? t.transaction_date : t.transaction_date.slice(0, 7);
      const label =
        viewMode === 'daily'
          ? t.transaction_date.slice(8, 10) + '/' + t.transaction_date.slice(5, 7)
          : t.transaction_date.slice(0, 7);

      if (!aggregated[key]) {
        aggregated[key] = { label, Pemasukan: 0, Pengeluaran: 0 };
      }

      if (t.transaction_type === 'income') {
        aggregated[key].Pemasukan += Number(t.amount);
      } else if (t.transaction_type === 'expense') {
        aggregated[key].Pengeluaran += Number(t.amount);
      }
    });

  const chartData = Object.keys(aggregated)
    .sort()
    .slice(-14) // Last 14 entries
    .map((k) => aggregated[k]);

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Arus Kas Masuk & Keluar</h4>
          <p className="text-xs text-gray-400">Perbandingan pemasukan vs pengeluaran</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      <div className="flex-1 w-full pt-4 min-h-[260px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6 text-gray-400 text-xs">
            Belum ada transaksi tercatat untuk periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={(val) => (val >= 1000000 ? `${val / 1000000}M` : val >= 1000 ? `${val / 1000}k` : val)}
              />
              <Tooltip
                formatter={(value: any) => [formatIDR(Number(value)), '']}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  borderRadius: '0.75rem',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#F43F5E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
