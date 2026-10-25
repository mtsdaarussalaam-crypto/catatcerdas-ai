'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { FinancialAccount, Transaction } from '@/types';
import { formatIDR, formatDateID } from '@/lib/finance/formatters';
import { ArrowLeft, Wallet, Building, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadAccountData() {
      setIsLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Fetch account
        const { data: acc } = await supabase
          .from('financial_accounts')
          .select('*')
          .eq('id', id)
          .eq('user_id', userData.user.id)
          .single();
        setAccount(acc);

        // Fetch transactions for this account
        const { data: txs } = await supabase
          .from('transactions')
          .select('*, category:categories(name)')
          .eq('user_id', userData.user.id)
          .or(`account_id.eq.${id},transfer_target_account_id.eq.${id}`)
          .order('transaction_date', { ascending: false });
        setTransactions(txs || []);
      } catch (err) {
        console.error('Error loading account ledger:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadAccountData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="py-12 text-center text-gray-500">
        Akun tidak ditemukan.
      </div>
    );
  }

  // Calculate balance
  let runningBalance = Number(account.opening_balance) || 0;
  transactions.forEach((tx) => {
    if (tx.status !== 'confirmed') return;
    const amt = Number(tx.amount) || 0;
    if (tx.account_id === id) {
      if (tx.transaction_type === 'income') runningBalance += amt;
      else if (tx.transaction_type === 'expense' || tx.transaction_type === 'transfer') runningBalance -= amt;
    } else if (tx.transfer_target_account_id === id && tx.transaction_type === 'transfer') {
      runningBalance += amt;
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/accounts"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Akun Keuangan</span>
      </Link>

      {/* Account Hero Card */}
      <Card className="p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white border-none space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-emerald-200 tracking-wider">
              {account.account_type.replace('_', ' ')}
            </span>
            <h1 className="text-2xl font-black mt-0.5">{account.name}</h1>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 text-white">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-emerald-200">Saldo Berjalan Saat Ini</span>
            <h2 className="text-2xl font-black">{formatIDR(runningBalance)}</h2>
          </div>
          <span className="text-xs text-emerald-100">
            Saldo Awal: {formatIDR(account.opening_balance)}
          </span>
        </div>
      </Card>

      {/* Transactions Ledger */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Buku Kas & Mutasi ({transactions.length} transaksi)
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Belum ada mutasi transaksi pada akun ini.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {transactions.map((tx) => {
              const isIncome =
                tx.transaction_type === 'income' ||
                (tx.transaction_type === 'transfer' && tx.transfer_target_account_id === id);

              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      )}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{tx.description}</p>
                      <p className="text-[10px] text-gray-400">
                        {formatDateID(tx.transaction_date)} • {tx.category?.name || 'Tanpa Kategori'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'font-black',
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
      </Card>
    </div>
  );
}
