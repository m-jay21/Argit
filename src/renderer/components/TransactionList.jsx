import React from 'react';
import { DeleteIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from './icons';
import { formatCurrency } from '../utils/calculations';

function TransactionList({ transactions, onRemoveTransaction, currency = 'USD' }) {

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    // Use theme category colors that work in both light and dark themes
    const colors = {
      food: 'bg-category-red text-category-red-text',
      transport: 'bg-category-blue text-category-blue-text',
      shopping: 'bg-category-purple text-category-purple-text',
      entertainment: 'bg-category-pink text-category-pink-text',
      utilities: 'bg-category-yellow text-category-yellow-text',
      healthcare: 'bg-category-green text-category-green-text',
      education: 'bg-category-indigo text-category-indigo-text',
      subscription: 'bg-category-orange text-category-orange-text',
      savings: 'bg-category-teal text-category-teal-text',
      income: 'bg-category-emerald text-category-emerald-text'
    };
    // Default to savings color for any unrecognized categories
    return colors[category?.toLowerCase()] || colors.savings;
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
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
          className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-light"
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className={`flex-shrink-0 ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.type === 'income' ? (
                <ArrowUpCircleIcon className="h-5 w-5" />
              ) : (
                <ArrowDownCircleIcon className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-text-primary truncate">
                  {transaction.description}
                </p>
                {transaction.category && (
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                {formatDate(transaction.date)}
              </p>
            </div>

            <div className="text-right">
              <p className={`text-sm font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
              </p>
            </div>
          </div>

          <button
            onClick={() => onRemoveTransaction(transaction.id)}
            className="ml-3 p-1 text-text-secondary hover:text-error-color transition-colors"
            title="Delete transaction"
          >
            <DeleteIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default TransactionList;