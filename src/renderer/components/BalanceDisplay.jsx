import React from 'react';
import { BalanceDisplayIcon, TrendingUpIcon, TrendingDownIcon, BanknoteIcon } from './icons';
import { formatCurrency } from '../utils/calculations';

function BalanceDisplay({ balance, currency = 'USD' }) {

  const getBalanceColor = () => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getBalanceIcon = () => {
    if (balance > 0) return <TrendingUpIcon className="h-8 w-8" />;
    if (balance < 0) return <TrendingDownIcon className="h-8 w-8" />;
    return <BanknoteIcon className="h-8 w-8" />;
  };

  return (
    <div className="bg-accent-primary text-white p-4 rounded-lg text-2xl font-semibold my-4 shadow-cozy-accent flex items-center">
      <BalanceDisplayIcon className="w-6 h-6 mr-3" />
      {formatCurrency(balance, currency)}
    </div>
  );
}

export default BalanceDisplay;