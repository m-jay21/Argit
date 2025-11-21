// Transaction backup utilities for monthly archives

export function formatTransactionForBackup(transaction) {
  const date = new Date(transaction.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
  
  const amount = `AED ${transaction.amount.toFixed(2)}`;
  const type = transaction.type.toUpperCase();
  const category = transaction.category || 'Other';
  const description = transaction.description || '';
  
  return `${date} | ${type} | ${amount} | ${category} | ${description}`;
}

export function generateMonthlyTransactionReport(transactions, year, month) {
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Filter transactions for the specific month
  const monthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === month - 1 && 
           transactionDate.getFullYear() === year;
  });
  
  if (monthTransactions.length === 0) {
    return `TRANSACTION BACKUP - ${monthName}
=====================================

No transactions recorded for this month.

Generated on: ${new Date().toLocaleString()}
`;
  }
  
  // Sort by date
  monthTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate totals
  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const net = income - expenses;
  
  // Group by category
  const expensesByCategory = {};
  monthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const category = t.category || 'Other';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + t.amount;
    });
  
  let report = `TRANSACTION BACKUP - ${monthName}
=====================================

SUMMARY:
--------
Total Income:  AED ${income.toFixed(2)}
Total Expenses: AED ${expenses.toFixed(2)}
Net:           AED ${net.toFixed(2)}
Transaction Count: ${monthTransactions.length}

EXPENSES BY CATEGORY:
--------------------
`;
  
  Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, amount]) => {
      report += `${category}: AED ${amount.toFixed(2)}\n`;
    });
  
  report += `\nALL TRANSACTIONS:
-----------------
Date      | Type    | Amount      | Category      | Description
--------------------------------------------------------------
`;
  
  monthTransactions.forEach(transaction => {
    report += formatTransactionForBackup(transaction) + '\n';
  });
  
  report += `\nGenerated on: ${new Date().toLocaleString()}
This file was automatically created during month-end processing.
`;
  
  return report;
}

export function getBackupFileName(year, month) {
  const monthStr = String(month).padStart(2, '0');
  return `transactions-${year}-${monthStr}.txt`;
}

export async function saveTransactionBackup(transactions, settings) {
  try {
    // Get previous month info
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    // Generate backup report
    const report = generateMonthlyTransactionReport(transactions, prevYear, prevMonth);
    const fileName = getBackupFileName(prevYear, prevMonth);
    
    if (window.electronAPI) {
      // Running in Electron - save to user data directory
      const result = await window.electronAPI.saveTransactionBackup(fileName, report);
      return {
        success: result.success,
        fileName: fileName,
        filePath: result.filePath,
        error: result.error
      };
    } else {
      // Running in browser - download as file
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        fileName: fileName,
        filePath: 'Downloaded to browser downloads',
        error: null
      };
    }
  } catch (error) {
    console.error('Failed to save transaction backup:', error);
    return {
      success: false,
      fileName: null,
      filePath: null,
      error: error.message
    };
  }
}
