-- ====================================================================
-- CATATCERDAS AI - DATABASE SCHEMA & RLS MIGRATION
-- Database: Supabase PostgreSQL
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS (OR CHECK CONSTRAINTS)
-- Using check constraints for portability and flexible migrations.

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Asia/Jakarta',
    default_currency TEXT DEFAULT 'IDR',
    preferences JSONB DEFAULT '{"budget_alerts": true, "weekly_recap": true, "monthly_recap": true, "strict_gmail": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();

    -- Also create default Cash account for the new user
    INSERT INTO public.financial_accounts (user_id, name, account_type, opening_balance, currency, color, icon)
    VALUES (NEW.id, 'Dompet Tunai', 'cash', 0, 'IDR', '#10B981', 'wallet')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. FINANCIAL ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'bank', 'e_wallet', 'savings', 'credit_card', 'investment', 'other')),
    opening_balance NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'IDR',
    color TEXT DEFAULT '#10B981',
    icon TEXT DEFAULT 'wallet',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_user ON public.financial_accounts(user_id);

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system categories
    name TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'both')),
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#10B981',
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_system ON public.categories(is_system);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'IDR',
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_time TIME DEFAULT CURRENT_TIME,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'qris', 'debit_card', 'credit_card', 'e_wallet', 'other')),
    merchant_name TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'photo', 'recurring', 'import')),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    transfer_group_id UUID, -- Links source and destination transactions for transfers
    transfer_target_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_group ON public.transactions(transfer_group_id);

-- 7. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE, -- NULL means overall budget
    name TEXT NOT NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_thresholds INTEGER[] DEFAULT '{50, 75, 90, 100}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets(user_id, start_date, end_date);

-- 8. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(18,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    target_date DATE,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    color TEXT DEFAULT '#10B981',
    icon TEXT DEFAULT 'target',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);

-- 9. RECURRING TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    recurrence_rule TEXT NOT NULL CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    last_processed_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_transactions(user_id);

-- 10. ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_tx ON public.attachments(transaction_id);

-- 11. RECEIPT ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_tx ON public.receipt_items(transaction_id);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('budget_warning', 'budget_exceeded', 'bill_reminder', 'goal_milestone', 'recap', 'duplicate_warning', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- 13. AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Percakapan Keuangan',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);

-- ====================================================================
-- SEED DEFAULT SYSTEM CATEGORIES
-- ====================================================================

INSERT INTO public.categories (name, transaction_type, icon, color, is_system) VALUES
-- Pemasukan
('Gaji', 'income', 'briefcase', '#10B981', true),
('Usaha', 'income', 'store', '#059669', true),
('Penjualan', 'income', 'trending-up', '#047857', true),
('Freelance', 'income', 'laptop', '#34D399', true),
('Bonus', 'income', 'award', '#6EE7B7', true),
('Investasi', 'income', 'pie-chart', '#0284C7', true),
('Hadiah', 'income', 'gift', '#8B5CF6', true),
('Sewa', 'income', 'home', '#EC4899', true),
('Pengembalian Dana', 'income', 'rotate-ccw', '#F59E0B', true),
('Pemasukan Lainnya', 'income', 'plus-circle', '#64748B', true),

-- Pengeluaran
('Makanan dan Minuman', 'expense', 'utensils', '#EF4444', true),
('Kebutuhan Rumah Tangga', 'expense', 'shopping-cart', '#F97316', true),
('Transportasi', 'expense', 'car', '#F59E0B', true),
('Pendidikan', 'expense', 'book-open', '#10B981', true),
('Kesehatan', 'expense', 'activity', '#06B6D4', true),
('Tagihan', 'expense', 'file-text', '#3B82F6', true),
('Tempat Tinggal', 'expense', 'home', '#6366F1', true),
('Belanja', 'expense', 'shopping-bag', '#8B5CF6', true),
('Hiburan', 'expense', 'film', '#EC4899', true),
('Komunikasi dan Internet', 'expense', 'wifi', '#14B8A6', true),
('Cicilan dan Utang', 'expense', 'credit-card', '#DC2626', true),
('Donasi', 'expense', 'heart', '#F43F5E', true),
('Perawatan Diri', 'expense', 'smile', '#A855F7', true),
('Biaya Administrasi', 'expense', 'shield-alert', '#94A3B8', true),
('Pengeluaran Lainnya', 'expense', 'minus-circle', '#64748B', true)
ON CONFLICT DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 1. profiles
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. financial_accounts
CREATE POLICY "Users can CRUD own accounts" ON public.financial_accounts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. categories
CREATE POLICY "Users can read system or own categories" ON public.categories
    FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id AND is_system = false)
    WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- 4. transactions
CREATE POLICY "Users can CRUD own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. budgets
CREATE POLICY "Users can CRUD own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. savings_goals
CREATE POLICY "Users can CRUD own savings goals" ON public.savings_goals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. recurring_transactions
CREATE POLICY "Users can CRUD own recurring transactions" ON public.recurring_transactions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. attachments
CREATE POLICY "Users can CRUD own attachments" ON public.attachments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. receipt_items
CREATE POLICY "Users can CRUD own receipt items" ON public.receipt_items
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. notifications
CREATE POLICY "Users can CRUD own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. ai_conversations
CREATE POLICY "Users can CRUD own AI conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. ai_messages
CREATE POLICY "Users can CRUD own AI messages" ON public.ai_messages
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION & POLICIES
-- ====================================================================

-- Create private receipts bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS: User can only upload and read inside their own folder: userId/filename
DROP POLICY IF EXISTS "Users can view own receipt files" ON storage.objects;
CREATE POLICY "Users can view own receipt files" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload own receipt files" ON storage.objects;
CREATE POLICY "Users can upload own receipt files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own receipt files" ON storage.objects;
CREATE POLICY "Users can update own receipt files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own receipt files" ON storage.objects;
CREATE POLICY "Users can delete own receipt files" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ====================================================================
-- HELPER FUNCTIONS FOR BALANCE CALCULATION & DATA DELETION
-- ====================================================================

-- Function to safely delete all user account data (Account Deletion)
CREATE OR REPLACE FUNCTION public.delete_user_entire_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verify caller is deleting their own data
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Anda hanya dapat menghapus akun Anda sendiri.';
    END IF;

    DELETE FROM public.profiles WHERE id = target_user_id;
    -- Cascades will clean up transactions, accounts, budgets, goals, etc.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
