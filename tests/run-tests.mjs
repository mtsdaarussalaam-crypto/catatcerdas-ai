import assert from 'node:assert';
import {
  formatIDR,
  parseIDR,
  formatDateID,
} from '../lib/finance/formatters.ts';
import {
  calculateAccountBalances,
  calculateFinancialSummary,
  calculateBudgetUsage,
} from '../lib/finance/calculator.ts';

console.log('--- MENJALANKAN PENGUJIAN OTOMATIS CATATCERDAS AI ---');

// 1. Test formatIDR
console.log('Pengujian 1: Format Mata Uang IDR');
assert.strictEqual(formatIDR(0), 'Rp0');
assert.strictEqual(formatIDR(1250000), 'Rp1.250.000');
assert.strictEqual(formatIDR(50000), 'Rp50.000');
assert.strictEqual(parseIDR('Rp1.250.000'), 1250000);
assert.strictEqual(parseIDR('Rp50.000'), 50000);
console.log('✅ PASS: Format IDR valid');

// 2. Test calculateAccountBalances with Transfers
console.log('Pengujian 2: Perhitungan Saldo Akun & Mutasi Transfer Antar-Akun');
const mockAccounts = [
  {
    id: 'acc-1',
    user_id: 'user-1',
    name: 'Dompet Tunai',
    account_type: 'cash',
    opening_balance: 100000,
    currency: 'IDR',
    color: '#10B981',
    icon: 'wallet',
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'acc-2',
    user_id: 'user-1',
    name: 'Rekening Bank BCA',
    account_type: 'bank',
    opening_balance: 500000,
    currency: 'IDR',
    color: '#3B82F6',
    icon: 'building',
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

const mockTransactions = [
  // Income 200,000 into acc-1 -> acc-1 should become 300,000
  {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    category_id: null,
    transaction_type: 'income',
    amount: 200000,
    currency: 'IDR',
    description: 'Pemasukan Freelance',
    transaction_date: '2026-10-25',
    transaction_time: null,
    payment_method: 'cash',
    merchant_name: null,
    source: 'manual',
    status: 'confirmed',
    notes: null,
    tags: [],
    transfer_group_id: null,
    transfer_target_account_id: null,
    idempotency_key: null,
    created_at: '',
    updated_at: '',
  },
  // Expense 50,000 from acc-2 -> acc-2 should become 450,000
  {
    id: 'tx-2',
    user_id: 'user-1',
    account_id: 'acc-2',
    category_id: null,
    transaction_type: 'expense',
    amount: 50000,
    currency: 'IDR',
    description: 'Beli Bensin',
    transaction_date: '2026-10-25',
    transaction_time: null,
    payment_method: 'bank_transfer',
    merchant_name: null,
    source: 'manual',
    status: 'confirmed',
    notes: null,
    tags: [],
    transfer_group_id: null,
    transfer_target_account_id: null,
    idempotency_key: null,
    created_at: '',
    updated_at: '',
  },
  // Transfer 100,000 from acc-2 to acc-1
  // acc-2 should become 350,000 (450,000 - 100,000)
  // acc-1 should become 400,000 (300,000 + 100,000)
  {
    id: 'tx-3',
    user_id: 'user-1',
    account_id: 'acc-2',
    category_id: null,
    transaction_type: 'transfer',
    amount: 100000,
    currency: 'IDR',
    description: 'Tarik Tunai dari BCA ke Dompet',
    transaction_date: '2026-10-25',
    transaction_time: null,
    payment_method: 'cash',
    merchant_name: null,
    source: 'manual',
    status: 'confirmed',
    notes: null,
    tags: [],
    transfer_group_id: 'tg-1',
    transfer_target_account_id: 'acc-1',
    idempotency_key: null,
    created_at: '',
    updated_at: '',
  },
];

const computed = calculateAccountBalances(mockAccounts, mockTransactions);
const acc1Bal = computed.find((a) => a.id === 'acc-1')?.current_balance;
const acc2Bal = computed.find((a) => a.id === 'acc-2')?.current_balance;

assert.strictEqual(acc1Bal, 400000, 'Saldo acc-1 harus Rp400.000');
assert.strictEqual(acc2Bal, 350000, 'Saldo acc-2 harus Rp350.000');
console.log('✅ PASS: Perhitungan saldo dan transfer antar-akun konsisten tanpa salah hitung.');

// 3. Test calculateFinancialSummary (Non-duplication of transfer as income/expense)
console.log('Pengujian 3: Ringkasan Keuangan & Isolasi Mutasi Transfer');
const summary = calculateFinancialSummary(
  mockAccounts,
  mockTransactions,
  [],
  [],
  '2026-10'
);

// Total income must be ONLY 200,000 (tx-1). Transfer is NOT income!
assert.strictEqual(summary.totalIncome, 200000, 'Total pemasukan tidak boleh menduplikasi transfer');
// Total expense must be ONLY 50,000 (tx-2). Transfer is NOT expense!
assert.strictEqual(summary.totalExpense, 50000, 'Total pengeluaran tidak boleh menduplikasi transfer');
// Net cash flow must be 200,000 - 50,000 = 150,000
assert.strictEqual(summary.netCashFlow, 150000, 'Arus kas bersih harus 150.000');
// Total consolidated net worth = 400,000 + 350,000 = 750,000
assert.strictEqual(summary.totalBalance, 750000, 'Total saldo konsolidasi harus 750.000');
console.log('✅ PASS: Laporan laba/rugi dan arus kas mengabaikan transfer agar tidak terjadi penghitungan ganda.');

// 4. Test calculateBudgetUsage
console.log('Pengujian 4: Peringatan Ambang Batas Anggaran (Budget Usage)');
const mockBudget = {
  id: 'bg-1',
  user_id: 'user-1',
  category_id: null,
  name: 'Batas Total Pengeluaran',
  amount: 100000,
  period_type: 'monthly',
  start_date: '2026-10-01',
  end_date: '2026-10-31',
  alert_thresholds: [50, 75, 90, 100],
  is_active: true,
  created_at: '',
  updated_at: '',
};

const budgetUsage = calculateBudgetUsage(mockBudget, mockTransactions);
assert.strictEqual(budgetUsage.spent_amount, 50000);
assert.strictEqual(budgetUsage.remaining_amount, 50000);
assert.strictEqual(budgetUsage.percentage, 50);
console.log('✅ PASS: Persentase penggunaan anggaran tepat 50% sesuai data transaksi aktual.');

console.log('🎉 SEMUA PENGUJIAN LOGIKA KEUANGAN BERHASIL 100%!');
