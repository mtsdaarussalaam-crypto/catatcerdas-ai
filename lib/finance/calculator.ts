import type { FinancialAccount, Transaction, Budget, SavingsGoal, FinancialSummary } from '../../types/index.ts';

/**
 * Calculates current balances for all accounts based on opening balance and confirmed transactions.
 * Properly handles transfers between accounts:
 * - Deducts from source account
 * - Credits target account
 * - Does NOT count as consolidated income/expense
 */
export function calculateAccountBalances(
  accounts: FinancialAccount[],
  transactions: Transaction[]
): FinancialAccount[] {
  const accountMap = new Map<string, number>();

  // Initialize with opening balance
  accounts.forEach((acc) => {
    accountMap.set(acc.id, Number(acc.opening_balance) || 0);
  });

  // Apply confirmed transactions
  transactions.forEach((tx) => {
    if (tx.status !== 'confirmed') return;

    const amount = Number(tx.amount) || 0;

    if (tx.transaction_type === 'income') {
      const current = accountMap.get(tx.account_id) ?? 0;
      accountMap.set(tx.account_id, current + amount);
    } else if (tx.transaction_type === 'expense') {
      const current = accountMap.get(tx.account_id) ?? 0;
      accountMap.set(tx.account_id, current - amount);
    } else if (tx.transaction_type === 'transfer') {
      // Source account deduction
      const sourceBal = accountMap.get(tx.account_id) ?? 0;
      accountMap.set(tx.account_id, sourceBal - amount);

      // Target account addition
      if (tx.transfer_target_account_id) {
        const targetBal = accountMap.get(tx.transfer_target_account_id) ?? 0;
        accountMap.set(tx.transfer_target_account_id, targetBal + amount);
      }
    }
  });

  return accounts.map((acc) => ({
    ...acc,
    current_balance: accountMap.get(acc.id) ?? (Number(acc.opening_balance) || 0),
  }));
}

/**
 * Computes financial summary for the current month vs previous month.
 */
export function calculateFinancialSummary(
  accounts: FinancialAccount[],
  transactions: Transaction[],
  budgets: Budget[],
  savingsGoals: SavingsGoal[],
  currentMonthDateStr: string // e.g. "2026-10"
): FinancialSummary {
  const updatedAccounts = calculateAccountBalances(accounts, transactions);
  const totalBalance = updatedAccounts.reduce((sum, acc) => sum + (acc.current_balance ?? 0), 0);

  // Parse current and previous month prefix
  const [year, month] = currentMonthDateStr.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthDateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  let totalIncome = 0;
  let totalExpense = 0;
  let previousMonthExpense = 0;

  const categoryExpenses: Record<string, { name: string; amount: number }> = {};

  transactions.forEach((tx) => {
    if (tx.status !== 'confirmed') return;
    const amount = Number(tx.amount) || 0;
    const txDate = tx.transaction_date || '';

    // Current month transactions
    if (txDate.startsWith(currentMonthDateStr)) {
      if (tx.transaction_type === 'income') {
        totalIncome += amount;
      } else if (tx.transaction_type === 'expense') {
        totalExpense += amount;

        const catName = tx.category?.name || 'Lainnya';
        if (!categoryExpenses[catName]) {
          categoryExpenses[catName] = { name: catName, amount: 0 };
        }
        categoryExpenses[catName].amount += amount;
      }
    }

    // Previous month transactions
    if (txDate.startsWith(prevMonthDateStr)) {
      if (tx.transaction_type === 'expense') {
        previousMonthExpense += amount;
      }
    }
  });

  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netCashFlow / totalIncome) * 100) : 0;

  // Expense change percentage compared to previous month
  const expenseChangePercent =
    previousMonthExpense > 0
      ? ((totalExpense - previousMonthExpense) / previousMonthExpense) * 100
      : 0;

  // Find top expense category
  let topExpenseCategory: { name: string; amount: number; percentage: number } | null = null;
  const catArray = Object.values(categoryExpenses).sort((a, b) => b.amount - a.amount);
  if (catArray.length > 0 && totalExpense > 0) {
    topExpenseCategory = {
      name: catArray[0].name,
      amount: catArray[0].amount,
      percentage: Math.round((catArray[0].amount / totalExpense) * 100),
    };
  }

  // Budget calculations
  const activeBudgets = budgets.filter((b) => b.is_active);
  const budgetTotal = activeBudgets.reduce((sum, b) => sum + Number(b.amount), 0);
  // Actual spending for categories in budget
  let budgetUsed = 0;
  activeBudgets.forEach((b) => {
    if (!b.category_id) {
      // Overall budget
      budgetUsed = Math.max(budgetUsed, totalExpense);
    } else {
      const catSpent = transactions
        .filter(
          (tx) =>
            tx.status === 'confirmed' &&
            tx.transaction_type === 'expense' &&
            tx.category_id === b.category_id &&
            tx.transaction_date >= b.start_date &&
            tx.transaction_date <= b.end_date
        )
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      budgetUsed += catSpent;
    }
  });
  const budgetRemaining = Math.max(0, budgetTotal - budgetUsed);

  // Total savings accumulated
  const totalSavings = savingsGoals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    netCashFlow,
    savingsRate,
    budgetTotal,
    budgetUsed,
    budgetRemaining,
    totalSavings,
    previousMonthExpense,
    expenseChangePercent,
    topExpenseCategory,
  };
}

/**
 * Calculates budget consumption and alert status
 */
export function calculateBudgetUsage(budget: Budget, transactions: Transaction[]): Budget {
  const budgetAmount = Number(budget.amount) || 0;
  const spent = transactions
    .filter((tx) => {
      if (tx.status !== 'confirmed' || tx.transaction_type !== 'expense') return false;
      if (tx.transaction_date < budget.start_date || tx.transaction_date > budget.end_date) return false;
      if (budget.category_id && tx.category_id !== budget.category_id) return false;
      return true;
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const remaining = Math.max(0, budgetAmount - spent);
  const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 0;

  return {
    ...budget,
    spent_amount: spent,
    remaining_amount: remaining,
    percentage,
  };
}
