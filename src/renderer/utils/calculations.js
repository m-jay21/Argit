// Helper functions for financial calculations
import { getPayPeriodRange } from './dateHelpers';

/** Returns ordinal suffix for day of month (e.g. 15 -> "15th", 1 -> "1st") */
export function getOrdinalDay(n) {
  if (typeof n !== 'number' || n < 1 || n > 31) return String(n);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function calculateBalance(transactions, startingBalance = 0) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return startingBalance + totalIncome - totalExpenses;
}

/**
 * Get transactions that fall in the current period (calendar month, or pay period when payDay is set).
 * @param {Array} transactions
 * @param {number|null|undefined} payDay - If 1-31, use pay period (e.g. 15th to 14th); otherwise calendar month
 */
export function getMonthlyStats(transactions, payDay) {
  let periodTransactions;

  if (payDay != null && payDay >= 1 && payDay <= 31) {
    const range = getPayPeriodRange(payDay);
    if (range) {
      periodTransactions = (transactions || []).filter(transaction => {
        const d = new Date(transaction.date);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        dayStart.setHours(0, 0, 0, 0);
        return dayStart >= range.start && dayStart <= range.end;
      });
    } else {
      periodTransactions = [];
    }
  } else {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    periodTransactions = (transactions || []).filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });
  }

  const currentMonthTransactions = periodTransactions;

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate savings deposits (expenses with category 'Savings') - these reduce available income for budget
  const savingsDeposits = currentMonthTransactions
    .filter(t => t.type === 'expense' && t.category === 'Savings')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Available income for budget = total income - savings deposits
  // This ensures money allocated to savings pot reduces available income for budget allocation
  const availableIncomeForBudget = monthlyIncome - savingsDeposits;

  return {
    income: monthlyIncome,
    availableIncomeForBudget: Math.max(0, availableIncomeForBudget), // Don't go negative
    expenses: monthlyExpenses,
    net: monthlyIncome - monthlyExpenses,
    transactionCount: currentMonthTransactions.length
  };
}

export function getTotalSubscriptionCost(subscriptions) {
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((sum, sub) => sum + sub.amount, 0);
}

export function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

export function validateBillDate(day) {
  const num = parseInt(day);
  return !isNaN(num) && num >= 1 && num <= 31;
}