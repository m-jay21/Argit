import React from 'react';
import { QuickOverviewIcon, TrendingUpIcon, TrendingDownIcon, SubscriptionsStatIcon, NetIncomeIcon } from './icons';
import { formatCurrency, getOrdinalDay } from '../utils/calculations';

function MonthlyStats({ transactions, subscriptions, currency = 'USD', payDay }) {

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
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Monthly Expenses',
      value: monthlyExpenses,
      icon: TrendingDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Net Income',
      value: netIncome,
      icon: NetIncomeIcon,
      color: netIncome >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      label: 'Subscriptions',
      value: totalSubscriptions,
      icon: SubscriptionsStatIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
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
          monthly income: {formatCurrency(monthlyIncome, currency)}
        </span>
        <span className="bg-accent-secondary text-white px-2 py-1 rounded-xl text-xs font-medium">
          expenses: {formatCurrency(monthlyExpenses, currency)}
        </span>
        <span className="bg-accent-secondary text-white px-2 py-1 rounded-xl text-xs font-medium">
          remaining: {formatCurrency(netIncome, currency)}
        </span>
      </div>
      {payDay != null && payDay >= 1 && payDay <= 31 && (
        <p className="text-xs text-text-secondary mt-2" role="status">
          Balance resets on the {getOrdinalDay(payDay)} of each month.
        </p>
      )}
    </div>
  );
}

export default MonthlyStats;