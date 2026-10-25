export type AccountType = 'cash' | 'bank' | 'e_wallet' | 'savings' | 'credit_card' | 'investment' | 'other';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'qris' | 'debit_card' | 'credit_card' | 'e_wallet' | 'other';
export type TransactionSource = 'manual' | 'voice' | 'photo' | 'recurring' | 'import';
export type TransactionStatus = 'draft' | 'confirmed' | 'cancelled';
export type PeriodType = 'weekly' | 'monthly' | 'yearly';
export type GoalStatus = 'active' | 'completed' | 'cancelled';
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type NotificationType = 'budget_warning' | 'budget_exceeded' | 'bill_reminder' | 'goal_milestone' | 'recap' | 'duplicate_warning' | 'system';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string;
  default_currency: string;
  preferences: {
    budget_alerts?: boolean;
    weekly_recap?: boolean;
    monthly_recap?: boolean;
    strict_gmail?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  opening_balance: number;
  currency: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  current_balance?: number;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  transaction_type: 'income' | 'expense' | 'both';
  icon: string;
  color: string;
  is_system: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  transaction_date: string; // YYYY-MM-DD
  transaction_time: string | null; // HH:mm:ss
  payment_method: PaymentMethod;
  merchant_name: string | null;
  source: TransactionSource;
  status: TransactionStatus;
  notes: string | null;
  tags: string[];
  transfer_group_id: string | null;
  transfer_target_account_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  account?: FinancialAccount;
  target_account?: FinancialAccount;
  category?: Category;
  attachments?: Attachment[];
  receipt_items?: ReceiptItem[];
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  period_type: PeriodType;
  start_date: string;
  end_date: string;
  alert_thresholds: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Computed fields
  spent_amount?: number;
  remaining_amount?: number;
  percentage?: number;
  category?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  account_id: string | null;
  description: string | null;
  status: GoalStatus;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;

  account?: FinancialAccount;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  recurrence_rule: RecurrenceRule;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  last_processed_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  account?: FinancialAccount;
  category?: Category;
}

export interface Attachment {
  id: string;
  user_id: string;
  transaction_id: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  original_filename: string;
  created_at: string;
  signed_url?: string;
}

export interface ReceiptItem {
  id: string;
  user_id: string;
  transaction_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsRate: number;
  budgetTotal: number;
  budgetUsed: number;
  budgetRemaining: number;
  totalSavings: number;
  previousMonthExpense: number;
  expenseChangePercent: number;
  topExpenseCategory: { name: string; amount: number; percentage: number } | null;
}
