// Helper functions for financial calculations

export function formatCurrency(amount, currency = 'AED') {
  // Custom format to ensure AED shows correctly
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return `AED ${formatted}`;
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

export function getMonthlyStats(transactions) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === currentMonth &&
           transactionDate.getFullYear() === currentYear;
  });

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