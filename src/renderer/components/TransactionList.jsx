import React from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

function TransactionList({ transactions, onRemoveTransaction, currency = 'AED' }) {
  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `AED ${formatted}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      shopping: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      entertainment: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      healthcare: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      education: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      subscription: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      savings: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    };
    // Default to savings color for any unrecognized categories
    return colors[category?.toLowerCase()] || colors.savings;
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No transactions yet</p>
        <p className="text-sm">Add your first transaction above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className={`flex-shrink-0 ${
              transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {transaction.type === 'income' ? (
                <ArrowUpCircle className="h-5 w-5" />
              ) : (
                <ArrowDownCircle className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {transaction.description}
                </p>
                {transaction.category && (
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(transaction.date)}
              </p>
            </div>

            <div className="text-right">
              <p className={`text-sm font-semibold ${
                transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          <button
            onClick={() => onRemoveTransaction(transaction.id)}
            className="ml-3 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete transaction"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default TransactionList;