// Month-end processing utilities for automatic surplus distribution
import { saveTransactionBackup } from './transactionBackup';

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function shouldProcessMonthEnd(lastProcessedMonth) {
  const currentMonth = getCurrentMonthKey();
  return lastProcessedMonth !== currentMonth;
}

export function calculateMonthlySurplus(budgetConfig, transactions) {
  if (!budgetConfig || !budgetConfig.categories || !Array.isArray(budgetConfig.categories)) {
    return {
      surplus: 0,
      unspentByCategory: {},
      totalAllocated: 0,
      totalSpent: 0
    };
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Get previous month for surplus calculation
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonth = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();

  // Filter transactions from previous month
  const prevMonthExpenses = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transaction.type === 'expense' &&
           transactionDate.getMonth() === prevMonth &&
           transactionDate.getFullYear() === prevYear;
  });

  // Calculate spending by category for previous month
  const spendingByCategory = {};
  prevMonthExpenses.forEach(transaction => {
    const category = transaction.category || 'Savings';
    spendingByCategory[category] = (spendingByCategory[category] || 0) + transaction.amount;
  });

  // Calculate unspent amounts and total surplus
  let totalSurplus = 0;
  const unspentByCategory = {};
  
  budgetConfig.categories.forEach(category => {
    const allocated = category.budgetAmount || 0;
    const spent = spendingByCategory[category.name] || 0;
    const unspent = Math.max(0, allocated - spent);
    
    if (unspent > 0) {
      unspentByCategory[category.name] = unspent;
      totalSurplus += unspent;
    }
  });

  const totalAllocated = budgetConfig.categories.reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0);
  const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);

  return {
    surplus: totalSurplus,
    unspentByCategory,
    totalAllocated,
    totalSpent,
    prevMonth: prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };
}

// Surplus is now added directly to savings pot without creating transactions

export function processMonthEndSurplus(budgetConfig, transactions, settings, updateTransactions, updateSettings) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentMonth = getCurrentMonthKey();
      
      if (!shouldProcessMonthEnd(settings.lastProcessedMonth)) {
        resolve({ processed: false, reason: 'Already processed this month' });
        return;
      }

      const surplusData = calculateMonthlySurplus(budgetConfig, transactions);
      
      // Calculate current balance before clearing transactions
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const currentBalance = (settings.startingBalance || 0) + totalIncome - totalExpenses;
      
      // Create transaction backup before clearing
      let backupResult = null;
      if (transactions.length > 0) {
        try {
          backupResult = await saveTransactionBackup(transactions, settings);
          console.log('Transaction backup created:', backupResult);
        } catch (backupError) {
          console.warn('Failed to create transaction backup:', backupError);
          // Continue with processing even if backup fails
        }
      }
      
      // The entire remaining balance becomes the new savings pot
      const newSavingsPot = currentBalance;
      
      // Clear all transactions - they're no longer needed
      await updateTransactions([]);
      
      // Update settings with new savings pot, processed month, and reset starting balance to 0
      // (since the entire balance is now in the savings pot)
      await updateSettings({
        ...settings,
        lastProcessedMonth: currentMonth,
        savingsPot: newSavingsPot,
        startingBalance: 0 // Reset to 0 since all money is now in savings pot
      });

      resolve({
        processed: true,
        surplus: surplusData.surplus,
        newSavingsPot: newSavingsPot,
        prevMonth: surplusData.prevMonth,
        unspentByCategory: surplusData.unspentByCategory,
        message: surplusData.surplus > 0 
          ? `Added ${surplusData.surplus.toFixed(2)} AED from ${surplusData.prevMonth} surplus to savings pot. All transactions cleared for new month.`
          : `No surplus from ${surplusData.prevMonth}. All transactions cleared for new month.`,
        transactionsCleared: true,
        backupCreated: backupResult ? backupResult.success : false,
        backupPath: backupResult ? backupResult.filePath : null
      });
      
    } catch (error) {
      console.error('Month-end processing error:', error);
      reject(error);
    }
  });
}

export function getAvailableSavingsFromPot(settings, budgetConfig, monthlyIncome, currentBalance = 0) {
  // Available for savings = only savings pot (manual deposits)
  // No longer includes monthly allocation percentage
  return settings.savingsPot || 0;
}
