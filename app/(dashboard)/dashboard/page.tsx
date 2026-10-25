'use client';

import React, { useState, useEffect } from 'react';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { ExpenseCategoryChart } from '@/components/dashboard/ExpenseCategoryChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AIInsightWidget } from '@/components/dashboard/AIInsightWidget';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { VoiceRecordModal } from '@/components/voice/VoiceRecordModal';
import { ReceiptScannerModal } from '@/components/receipts/ReceiptScannerModal';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { FinancialAccount, Transaction, Budget, SavingsGoal, FinancialSummary, Category } from '@/types';
import { calculateFinancialSummary } from '@/lib/finance/calculator';
import { getTodayISODate } from '@/lib/finance/formatters';
import { createClient } from '@/lib/supabase/client';
import { Plus, TrendingDown, TrendingUp, Mic, Camera, ArrowRightLeft, Sparkles, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualInitialType, setManualInitialType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTxData, setEditTxData] = useState<Transaction | null>(null);

  const supabase = createClient();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const userId = userData.user.id;

      // 1. Fetch Accounts
      const { data: accs } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      setAccounts(accs || []);

      // 2. Fetch Categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userId},is_system.eq.true`)
        .eq('is_archived', false);
      setCategories(cats || []);

      // 3. Fetch Transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('*, account:financial_accounts!account_id(id, name, account_type, color), target_account:financial_accounts!transfer_target_account_id(id, name, account_type, color), category:categories(id, name, icon, color), attachments(*), receipt_items(*)')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });
      setTransactions(txs || []);

      // 4. Fetch Budgets
      const { data: bgs } = await supabase
        .from('budgets')
        .select('*, category:categories(id, name)')
        .eq('user_id', userId)
        .eq('is_active', true);
      setBudgets(bgs || []);

      // 5. Fetch Goals
      const { data: sgs } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      setGoals(sgs || []);

      // Calculate Summary
      const today = getTodayISODate();
      const currentMonth = today.slice(0, 7);
      const computedSummary = calculateFinancialSummary(
        accs || [],
        txs || [],
        bgs || [],
        sgs || [],
        currentMonth
      );
      setSummary(computedSummary);

      // Fetch AI Insights
      try {
        const insightsRes = await fetch('/api/ai/insights');
        if (insightsRes.ok) {
          const json = await insightsRes.json();
          if (json.data?.insights) {
            setInsights(json.data.insights);
          }
        }
      } catch {
        // Fallback default insight
        setInsights(['Selamat datang di CatatCerdas AI! Catat transaksi untuk analisis otomatis.']);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTransactionSaved = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setManualInitialType('expense');
            setEditTxData(null);
            setIsManualModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-xs transition-colors shadow-sm"
        >
          <TrendingDown className="w-4 h-4 text-rose-600" />
          <span>− Pengeluaran</span>
        </button>

        <button
          onClick={() => {
            setManualInitialType('income');
            setEditTxData(null);
            setIsManualModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs transition-colors shadow-sm"
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>+ Pemasukan</span>
        </button>

        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-xs transition-colors shadow-sm"
        >
          <Mic className="w-4 h-4 text-blue-600" />
          <span>Input Suara AI</span>
        </button>

        <button
          onClick={() => setIsScanModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold text-xs transition-colors shadow-sm"
        >
          <Camera className="w-4 h-4 text-purple-600" />
          <span>Scan Struk</span>
        </button>

        <button
          onClick={() => {
            setManualInitialType('transfer');
            setEditTxData(null);
            setIsManualModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-bold text-xs transition-colors shadow-sm"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Transfer Antar-Akun</span>
        </button>

        <Link
          href="/assistant"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 font-bold text-xs transition-colors shadow-sm ml-auto"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Tanya Asisten AI</span>
        </Link>
      </div>

      {/* Summary Cards */}
      {isLoading || !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <SummaryCards summary={summary} />
      )}

      {/* AI Insights Banner Widget */}
      {insights.length > 0 && <AIInsightWidget insights={insights} />}

      {/* Charts Grid */}
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

      {/* Recent Transactions List */}
      <div>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <RecentTransactions
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        )}
      </div>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditTxData(null);
        }}
        onSuccess={handleTransactionSaved}
        categories={categories}
        accounts={accounts}
        initialData={editTxData ? editTxData : { transaction_type: manualInitialType }}
      />

      <VoiceRecordModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={handleTransactionSaved}
        categories={categories}
        accounts={accounts}
      />

      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={handleTransactionSaved}
        categories={categories}
        accounts={accounts}
      />

      <TransactionDetailModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        onEdit={(tx) => {
          setEditTxData(tx);
          setIsManualModalOpen(true);
        }}
        onDeleteSuccess={handleTransactionSaved}
      />
    </div>
  );
}
