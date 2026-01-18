// Budget calculation and management utilities

export const DEFAULT_CATEGORIES = [
  { name: 'Food' },
  { name: 'Transport' },
  { name: 'Shopping' },
  { name: 'Entertainment' },
  { name: 'Utilities' },
  { name: 'Healthcare' },
  { name: 'Education' },
  { name: 'Subscription' }
];

export const PROTECTED_CATEGORIES = ['Income', 'Subscription'];

export function createDefaultBudgetConfig() {
  return {
    monthlyIncome: 0,
    categories: DEFAULT_CATEGORIES.map((cat, index) => ({
      id: `cat_${cat.name.toLowerCase()}`,
      name: cat.name,
      percentage: 0,
      budgetAmount: 0,
      spentAmount: 0,
      remainingAmount: 0,
      isActive: true
    })),
    totalAllocatedPercentage: 0,
    availableForSavings: 100,
    lastUpdated: new Date().toISOString()
  };
}

export function calculateBudgetAmounts(budgetConfig, monthlyIncome) {
  const safeMonthlyIncome = typeof monthlyIncome === 'number' && !isNaN(monthlyIncome) ? monthlyIncome : 0;

  const updatedCategories = budgetConfig.categories.map(category => {
    const budgetAmount = (safeMonthlyIncome * (category.percentage || 0)) / 100;
    const remainingAmount = budgetAmount - (category.spentAmount || 0);

    return {
      ...category,
      budgetAmount: budgetAmount,
      remainingAmount: remainingAmount
    };
  });

  const totalAllocated = updatedCategories.reduce((sum, cat) => sum + (cat.percentage || 0), 0);

  return {
    ...budgetConfig,
    monthlyIncome: safeMonthlyIncome,
    categories: updatedCategories,
    totalAllocatedPercentage: totalAllocated,
    availableForSavings: Math.max(0, 100 - totalAllocated),
    lastUpdated: new Date().toISOString()
  };
}

export function calculateCategorySpending(budgetConfig, transactions) {
  if (!budgetConfig || !budgetConfig.categories || !Array.isArray(budgetConfig.categories)) {
    return budgetConfig || createDefaultBudgetConfig();
  }

  if (!transactions || !Array.isArray(transactions)) {
    return budgetConfig;
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter transactions for current month expenses only
  const currentMonthExpenses = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transaction.type === 'expense' &&
           transactionDate.getMonth() === currentMonth &&
           transactionDate.getFullYear() === currentYear;
  });

  // Calculate spending by category
  const spendingByCategory = {};
  currentMonthExpenses.forEach(transaction => {
    const category = transaction.category || 'Savings';
    const amount = typeof transaction.amount === 'number' && !isNaN(transaction.amount) ? transaction.amount : 0;
    spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
    
  });

  // Update budget config with actual spending
  const updatedCategories = budgetConfig.categories.map(category => {
    const spentAmount = spendingByCategory[category.name] || 0;
    const budgetAmount = typeof category.budgetAmount === 'number' && !isNaN(category.budgetAmount) ? category.budgetAmount : 0;
    const remainingAmount = budgetAmount - spentAmount;

    return {
      ...category,
      spentAmount,
      remainingAmount
    };
  });

  return {
    ...budgetConfig,
    categories: updatedCategories,
    lastUpdated: new Date().toISOString()
  };
}

export function validateBudgetPercentages(categories) {
  const totalPercentage = categories.reduce((sum, cat) => sum + (cat.percentage || 0), 0);

  return {
    isValid: totalPercentage <= 100,
    totalPercentage,
    availableForSavings: Math.max(0, 100 - totalPercentage),
    errors: totalPercentage > 100 ? ['Total percentages cannot exceed 100%'] : []
  };
}

export function canDeleteCategory(categoryName, transactions) {
  if (PROTECTED_CATEGORIES.includes(categoryName)) {
    return { canDelete: false, reason: 'This is a protected category' };
  }

  const hasTransactions = transactions.some(t => t.category === categoryName);
  if (hasTransactions) {
    return { canDelete: false, reason: 'Category has existing transactions' };
  }

  return { canDelete: true };
}

export function calculateSurplusDistribution(budgetConfig) {
  if (!budgetConfig || !budgetConfig.categories || !Array.isArray(budgetConfig.categories)) {
    return {
      categorySurplus: 0,
      originalSavingsAllocation: 0,
      totalAvailableForSavings: 0
    };
  }

  // Calculate surplus from each category (positive remaining amounts)
  const surplus = budgetConfig.categories.reduce((total, category) => {
    return total + Math.max(0, category.remainingAmount || 0);
  }, 0);

  const safeMonthlyIncome = typeof budgetConfig.monthlyIncome === 'number' && !isNaN(budgetConfig.monthlyIncome) ? budgetConfig.monthlyIncome : 0;
  const safeAvailableForSavings = typeof budgetConfig.availableForSavings === 'number' && !isNaN(budgetConfig.availableForSavings) ? budgetConfig.availableForSavings : 0;

  // Add the original savings allocation
  const originalSavingsAllocation = (safeMonthlyIncome * safeAvailableForSavings) / 100;
  const totalAvailableForSavings = surplus + originalSavingsAllocation;

  return {
    categorySurplus: surplus,
    originalSavingsAllocation,
    totalAvailableForSavings
  };
}

export function getNextGoalId() {
  return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateGoalProgress(goal) {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  return {
    progress: Math.min(100, Math.max(0, progress)),
    remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount)
  };
}