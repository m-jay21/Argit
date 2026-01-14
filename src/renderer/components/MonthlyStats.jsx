import React from 'react';
import { QuickOverviewIcon, TrendingUpIcon, TrendingDownIcon, SubscriptionsStatIcon, NetIncomeIcon } from './icons';

function MonthlyStats({ transactions, subscriptions, currency = 'AED' }) {
  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `AED ${formatted}`;
  };

  // Calculate current month stats
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

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = monthlyIncome - monthlyExpenses;

  const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  const stats = [
    {
      label: 'Monthly Income',
      value: monthlyIncome,
      icon: TrendingUpIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Monthly Expenses',
      value: monthlyExpenses,
      icon: TrendingDownIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: 'Net Income',
      value: netIncome,
      icon: NetIncomeIcon,
      color: netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: netIncome >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: 'Subscriptions',
      value: totalSubscriptions,
      icon: SubscriptionsStatIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="bg-bg-secondary border border-border-light p-4 my-3 rounded-lg">
      <div className="flex items-center text-text-primary font-semibold mb-3">
        <QuickOverviewIcon className="w-4 h-4 text-accent-primary mr-2" />
        Quick Overview
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="bg-accent-secondary text-white px-2 py-1 rounded-xl text-xs font-medium">
          monthly income: {formatCurrency(monthlyIncome)}
        </span>
        <span className="bg-accent-secondary text-white px-2 py-1 rounded-xl text-xs font-medium">
          expenses: {formatCurrency(monthlyExpenses)}
        </span>
        <span className="bg-accent-secondary text-white px-2 py-1 rounded-xl text-xs font-medium">
          remaining: {formatCurrency(netIncome)}
        </span>
      </div>
    </div>
  );
}

export default MonthlyStats;