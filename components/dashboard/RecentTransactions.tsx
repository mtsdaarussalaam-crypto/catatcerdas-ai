'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Transaction } from '@/types';
import { formatIDR, formatDateID } from '@/lib/finance/formatters';
import {
  Mic,
  Camera,
  Edit2,
  Repeat,
  FileSpreadsheet,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  onSelectTransaction,
}: RecentTransactionsProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'voice':
        return <Mic className="w-3 h-3 text-blue-500" />;
      case 'photo':
        return <Camera className="w-3 h-3 text-purple-500" />;
      case 'recurring':
        return <Repeat className="w-3 h-3 text-amber-500" />;
      case 'import':
        return <FileSpreadsheet className="w-3 h-3 text-cyan-500" />;
      default:
        return <Edit2 className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Transaksi Terbaru</h4>
          <p className="text-xs text-gray-400">Aktivitas keuangan terakhir yang tercatat</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>Lihat Semua</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-gray-400">Belum ada transaksi yang dicatat.</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Gunakan tombol di atas untuk mencatat via formulir, suara, atau scan struk.
            </p>
          </div>
        ) : (
          transactions.slice(0, 7).map((tx) => {
            const isIncome = tx.transaction_type === 'income';
            const isTransfer = tx.transaction_type === 'transfer';

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
              >
                {/* Left: Type Icon & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                      isIncome
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : isTransfer
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
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
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {tx.description}
                      </h5>
                      <span title={tx.source}>{getSourceIcon(tx.source)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 truncate">
                      <span>{formatDateID(tx.transaction_date)}</span>
                      <span>•</span>
                      <span>{tx.account?.name || 'Akun'}</span>
                      {tx.category && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                            {tx.category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isTransfer
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {isIncome ? '+' : isTransfer ? '' : '-'}
                    {formatIDR(tx.amount)}
                  </span>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    {tx.payment_method.replace('_', ' ')}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
