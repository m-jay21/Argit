// Pay Day processing utilities for automatic balance reset and savings transfer
import { saveTransactionBackup } from './transactionBackup';

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Gets the target pay day date for the current month
 * Handles edge cases like payDay 31 in months with fewer days
 */
export function getTargetPayDayDate(payDay) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Try to create date with the payDay
  const targetDate = new Date(currentYear, currentMonth, payDay);
  
  // If the month doesn't have that many days, use the last day of the month
  if (targetDate.getMonth() !== currentMonth) {
    // Set to last day of current month
    return new Date(currentYear, currentMonth + 1, 0);
  }
  
  return targetDate;
}

/**
 * Checks if the pay day reset should be processed
 * Returns true if:
 * - Today is on or after the pay day
 * - We haven't processed this pay day period yet
 */
export function shouldProcessPayDay(payDay, lastProcessedPayDay) {
  if (!payDay || payDay < 1 || payDay > 31) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const targetDate = getTargetPayDayDate(payDay);
  targetDate.setHours(0, 0, 0, 0);
  
  // If today is before the pay day, don't process
  if (today < targetDate) {
    return false;
  }
  
  // If we haven't processed any pay day yet, process it
  if (!lastProcessedPayDay) {
    return true;
  }
  
  // Check if we've already processed this pay day period
  const lastProcessed = new Date(lastProcessedPayDay);
  lastProcessed.setHours(0, 0, 0, 0);
  
  // Process if last processed date is before the target pay day date
  return lastProcessed < targetDate;
}

// Legacy function for backward compatibility
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

// Balance reset processing - transfers entire balance to savings pot on pay day

export function processPayDayReset(budgetConfig, transactions, settings, updateTransactions, updateSettings) {
  return new Promise(async (resolve, reject) => {
    try {
      const payDay = settings.payDay || 1;
      
      // Check if we should process using payDay logic
      if (!shouldProcessPayDay(payDay, settings.lastProcessedPayDay)) {
        resolve({ processed: false, reason: 'Pay day not reached or already processed' });
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
      
      // Get the target pay day date for tracking
      const targetPayDayDate = getTargetPayDayDate(payDay);
      const processedDateString = targetPayDayDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Clear all transactions - they're no longer needed
      await updateTransactions([]);
      
      // Update settings with new savings pot, processed pay day, and reset starting balance to 0
      // (since the entire balance is now in the savings pot)
      const updatedSettings = {
        ...settings,
        lastProcessedPayDay: processedDateString,
        savingsPot: newSavingsPot,
        startingBalance: 0 // Reset to 0 since all money is now in savings pot
      };
      
      // Migrate from lastProcessedMonth if it exists (for backward compatibility)
      if (settings.lastProcessedMonth && !settings.lastProcessedPayDay) {
        // Keep lastProcessedMonth for now but also set lastProcessedPayDay
        updatedSettings.lastProcessedMonth = settings.lastProcessedMonth;
      }
      
      await updateSettings(updatedSettings);

      const payDayDisplay = targetPayDayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      resolve({
        processed: true,
        surplus: surplusData.surplus,
        newSavingsPot: newSavingsPot,
        prevMonth: surplusData.prevMonth,
        unspentByCategory: surplusData.unspentByCategory,
        message: `Balance reset on ${payDayDisplay}. ${newSavingsPot.toFixed(2)} AED transferred to savings pot. All transactions cleared.`,
        transactionsCleared: true,
        backupCreated: backupResult ? backupResult.success : false,
        backupPath: backupResult ? backupResult.filePath : null
      });
      
    } catch (error) {
      console.error('Pay day processing error:', error);
      reject(error);
    }
  });
}

// Legacy function for backward compatibility
export function processMonthEndSurplus(budgetConfig, transactions, settings, updateTransactions, updateSettings) {
  // If payDay is set, use the new logic
  if (settings.payDay !== undefined && settings.payDay !== null) {
    return processPayDayReset(budgetConfig, transactions, settings, updateTransactions, updateSettings);
  }
  
  // Otherwise, fall back to old month-based logic
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
