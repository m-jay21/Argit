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
/**
 * Parse stored lastProcessedPayDay (YYYY-MM-DD or ISO start) to a local calendar date, or null if invalid.
 */
export function parseLastProcessedPayDay(lastProcessedPayDay) {
  if (lastProcessedPayDay == null) return null;
  const raw = String(lastProcessedPayDay).trim();
  if (!raw) return null;
  const datePart = raw.length >= 10 ? raw.slice(0, 10) : raw;
  const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function getTargetPayDayDate(payDay) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const dayNum = Number(payDay);
  if (!Number.isFinite(dayNum)) {
    return new Date(currentYear, currentMonth, 1);
  }
  // Try to create date with the payDay
  const targetDate = new Date(currentYear, currentMonth, dayNum);
  
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
 * - We haven't processed this pay day period yet (this month)
 */
export function shouldProcessPayDay(payDay, lastProcessedPayDay) {
  const d = Number(payDay);
  if (!Number.isFinite(d) || d < 1 || d > 31) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const targetDate = getTargetPayDayDate(d);
  targetDate.setHours(0, 0, 0, 0);
  
  // If today is before the pay day, don't process
  if (today < targetDate) {
    return false;
  }
  
  const lastProcessed = parseLastProcessedPayDay(lastProcessedPayDay);
  // Missing marker: need one reset for this pay period (today is on or after pay day)
  if (lastProcessed == null) {
    if (lastProcessedPayDay != null && String(lastProcessedPayDay).trim() !== '') {
      console.warn(
        'Argit: lastProcessedPayDay is set but invalid; fix argit-data.json (use YYYY-MM-DD). Skipping pay-day reset until fixed.'
      );
      return false;
    }
    return today >= targetDate;
  }
  
  // If we processed today, don't process again (prevents multiple runs on same day)
  if (lastProcessed.getTime() === today.getTime()) {
    return false;
  }
  
  // Get the month/year of the last processed date and the target date
  const lastProcessedMonth = lastProcessed.getMonth();
  const lastProcessedYear = lastProcessed.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  
  // If we've already processed this month's pay day, don't process again
  if (lastProcessedMonth === targetMonth && lastProcessedYear === targetYear) {
    return false;
  }
  
  // Process if we haven't processed this month yet
  return true;
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

export function processPayDayReset(
  budgetConfig,
  transactions,
  settings,
  updateTransactions,
  updateSettings,
  options = {}
) {
  const { getFreshData, persistWithEmptyTransactions } = options;
  return new Promise(async (resolve, reject) => {
    try {
      let txs = transactions;
      let stg = settings;

      if (typeof getFreshData === 'function') {
        const fresh = await getFreshData();
        txs = Array.isArray(fresh.transactions) ? fresh.transactions : [];
        stg = fresh.settings && typeof fresh.settings === 'object' ? fresh.settings : settings;
      }

      const payDay = Number(stg.payDay);
      const effectivePayDay = Number.isFinite(payDay) && payDay >= 1 && payDay <= 31 ? payDay : 1;

      if (!shouldProcessPayDay(effectivePayDay, stg.lastProcessedPayDay)) {
        resolve({
          processed: false,
          reason: 'Pay day not reached or already processed'
        });
        return;
      }

      const surplusData = calculateMonthlySurplus(budgetConfig, txs);
      
      // Calculate current balance before clearing transactions
      const totalIncome = txs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = txs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const currentBalance = (stg.startingBalance || 0) + totalIncome - totalExpenses;
      
      // Create transaction backup before clearing
      let backupResult = null;
      if (txs.length > 0) {
        try {
          backupResult = await saveTransactionBackup(txs, stg);
          console.log('Transaction backup created:', backupResult);
        } catch (backupError) {
          console.warn('Failed to create transaction backup:', backupError);
          // Continue with processing even if backup fails
        }
      }
      
      // Add current balance to existing savings pot (do not clear existing savings)
      const existingSavingsPot = stg.savingsPot || 0;
      const newSavingsPot = existingSavingsPot + currentBalance;
      
      // Get the target pay day date for tracking
      const targetPayDayDate = getTargetPayDayDate(effectivePayDay);
      // Store date in YYYY-MM-DD format using local time (not UTC)
      const year = targetPayDayDate.getFullYear();
      const month = String(targetPayDayDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetPayDayDate.getDate()).padStart(2, '0');
      const processedDateString = `${year}-${month}-${day}`;
      
      const updatedSettings = {
        ...stg,
        lastProcessedPayDay: processedDateString,
        savingsPot: newSavingsPot,
        startingBalance: 0 // Reset to 0 since all money is now in the savings pot
      };
      
      // Migrate from lastProcessedMonth if it exists (for backward compatibility)
      if (stg.lastProcessedMonth && !stg.lastProcessedPayDay) {
        updatedSettings.lastProcessedMonth = stg.lastProcessedMonth;
      }

      if (typeof persistWithEmptyTransactions === 'function') {
        const saveResult = await persistWithEmptyTransactions(updatedSettings);
        if (!saveResult || saveResult.success === false) {
          throw new Error(saveResult?.error || 'Failed to save pay day reset');
        }
      } else {
        const txResult = await updateTransactions([]);
        if (txResult && txResult.success === false) {
          throw new Error(txResult.error || 'Failed to clear transactions for pay day reset');
        }
        const setResult = await updateSettings(updatedSettings);
        if (setResult && setResult.success === false) {
          throw new Error(setResult.error || 'Failed to update settings for pay day reset');
        }
      }

      const payDayDisplay = targetPayDayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      resolve({
        processed: true,
        surplus: surplusData.surplus,
        newSavingsPot: newSavingsPot,
        prevMonth: surplusData.prevMonth,
        unspentByCategory: surplusData.unspentByCategory,
        message: `Balance reset on ${payDayDisplay}. ${currentBalance.toFixed(2)} AED added to savings pot (total: ${newSavingsPot.toFixed(2)} AED). All transactions cleared.`,
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
export function processMonthEndSurplus(
  budgetConfig,
  transactions,
  settings,
  updateTransactions,
  updateSettings,
  options = {}
) {
  // If payDay is set, use the new logic
  if (settings.payDay !== undefined && settings.payDay !== null) {
    return processPayDayReset(
      budgetConfig,
      transactions,
      settings,
      updateTransactions,
      updateSettings,
      options
    );
  }
  
  // Otherwise, fall back to old month-based logic
  const { getFreshData, persistWithEmptyTransactions } = options;
  return new Promise(async (resolve, reject) => {
    try {
      let txs = transactions;
      let stg = settings;

      if (typeof getFreshData === 'function') {
        const fresh = await getFreshData();
        txs = Array.isArray(fresh.transactions) ? fresh.transactions : [];
        stg = fresh.settings && typeof fresh.settings === 'object' ? fresh.settings : settings;
      }

      const currentMonth = getCurrentMonthKey();
      
      if (!shouldProcessMonthEnd(stg.lastProcessedMonth)) {
        resolve({ processed: false, reason: 'Already processed this month' });
        return;
      }

      const surplusData = calculateMonthlySurplus(budgetConfig, txs);
      
      // Calculate current balance before clearing transactions
      const totalIncome = txs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = txs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const currentBalance = (stg.startingBalance || 0) + totalIncome - totalExpenses;
      
      // Create transaction backup before clearing
      let backupResult = null;
      if (txs.length > 0) {
        try {
          backupResult = await saveTransactionBackup(txs, stg);
          console.log('Transaction backup created:', backupResult);
        } catch (backupError) {
          console.warn('Failed to create transaction backup:', backupError);
          // Continue with processing even if backup fails
        }
      }
      
      // Add current balance to existing savings pot (do not clear existing savings)
      const existingSavingsPot = stg.savingsPot || 0;
      const newSavingsPot = existingSavingsPot + currentBalance;
      
      const updatedSettings = {
        ...stg,
        lastProcessedMonth: currentMonth,
        savingsPot: newSavingsPot,
        startingBalance: 0 // Reset to 0 since all money is now in savings pot
      };

      if (typeof persistWithEmptyTransactions === 'function') {
        const saveResult = await persistWithEmptyTransactions(updatedSettings);
        if (!saveResult || saveResult.success === false) {
          throw new Error(saveResult?.error || 'Failed to save month-end reset');
        }
      } else {
        const txResult = await updateTransactions([]);
        if (txResult && txResult.success === false) {
          throw new Error(txResult.error || 'Failed to clear transactions for month-end reset');
        }
        const setResult = await updateSettings(updatedSettings);
        if (setResult && setResult.success === false) {
          throw new Error(setResult.error || 'Failed to update settings for month-end reset');
        }
      }

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
