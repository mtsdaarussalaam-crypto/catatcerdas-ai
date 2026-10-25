'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Transaction } from '@/types';
import { formatIDR } from '@/lib/finance/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ExpenseCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#14B8A6',
  '#6366F1',
];

export function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="h-80 flex items-center justify-center">
        <p className="text-xs text-gray-400">Memuat kategori...</p>
      </Card>
    );
  }

  // Aggregate expenses by category
  const catMap: Record<string, number> = {};
  let totalExpense = 0;

  transactions
    .filter((t) => t.status === 'confirmed' && t.transaction_type === 'expense')
    .forEach((t) => {
      const catName = t.category?.name || 'Lainnya';
      const amount = Number(t.amount) || 0;
      catMap[catName] = (catMap[catName] || 0) + amount;
      totalExpense += amount;
    });

  const chartData = Object.keys(catMap)
    .map((name) => ({
      name,
      value: catMap[name],
      percentage: totalExpense > 0 ? Math.round((catMap[name] / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="flex flex-col h-full">
      <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Kategori Pengeluaran</h4>
        <p className="text-xs text-gray-400">Distribusi belanja menurut pos pengeluaran</p>
      </div>

      <div className="flex-1 w-full pt-4 min-h-[260px] flex flex-col justify-between">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6 text-gray-400 text-xs">
            Belum ada pengeluaran tercatat.
          </div>
        ) : (
          <>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatIDR(Number(val)), '']}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Categories List */}
            <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
              {chartData.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatIDR(entry.value)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold w-7">
                      {entry.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
