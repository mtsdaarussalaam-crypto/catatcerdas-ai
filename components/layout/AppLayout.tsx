'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { VoiceRecordModal } from '@/components/voice/VoiceRecordModal';
import { ReceiptScannerModal } from '@/components/receipts/ReceiptScannerModal';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { Category, FinancialAccount, Transaction, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global Modals State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTxData, setEditTxData] = useState<Transaction | null>(null);

  const loadData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    if (profile) setUserProfile(profile);

    // Load categories
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${authData.user.id},is_system.eq.true`)
      .eq('is_archived', false)
      .order('name');
    if (cats) setCategories(cats);

    // Load accounts
    const { data: accs } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .order('name');
    if (accs) setAccounts(accs);

    // Load unread notifications count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authData.user.id)
      .is('read_at', null);
    if (count !== null) setUnreadCount(count);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransactionSaved = (tx: Transaction) => {
    // Refresh page / state
    router.refresh();
    loadData();
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-950 font-sans antialiased text-gray-900 dark:text-gray-100">
      {/* Desktop Sidebar */}
      <Sidebar userProfile={userProfile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Header
          title={title}
          onOpenNewTransaction={() => {
            setEditTxData(null);
            setIsManualModalOpen(true);
          }}
          onOpenVoice={() => setIsVoiceModalOpen(true)}
          onOpenScan={() => setIsScanModalOpen(true)}
          unreadNotificationsCount={unreadCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Mobile Floating Bottom Navigation */}
        <MobileNav
          onOpenNewTransaction={() => {
            setEditTxData(null);
            setIsManualModalOpen(true);
          }}
          onOpenVoice={() => setIsVoiceModalOpen(true)}
          onOpenScan={() => setIsScanModalOpen(true)}
        />
      </div>

      {/* Global Modals */}
      <TransactionFormModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditTxData(null);
        }}
        onSuccess={handleTransactionSaved}
        categories={categories}
        accounts={accounts}
        initialData={editTxData}
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
        onDeleteSuccess={() => {
          router.refresh();
          loadData();
        }}
      />
    </div>
  );
}
