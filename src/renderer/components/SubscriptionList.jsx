import React from 'react';
import { DeleteIcon, NextBillDateIcon, DaysUntilBillIcon } from './icons';
import { getSubscriptionStatus } from '../utils/subscriptionHelpers';

function SubscriptionList({ subscriptions, onRemoveSubscription, currency = 'AED' }) {
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



  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No subscriptions yet</p>
        <p className="text-sm">Add your first subscription above</p>
      </div>
    );
  }

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Monthly Cost
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalMonthly)}
          </span>
        </div>
      </div>

      {/* Subscription List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {subscriptions.map((subscription) => {
          const status = getSubscriptionStatus(subscription);
          return (
            <div
              key={subscription.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {subscription.name}
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <NextBillDateIcon className="h-3 w-3" />
                    <span>Next: {formatDate(subscription.nextBillDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DaysUntilBillIcon className="h-3 w-3" />
                    <span className={status.color}>
                      {status.text}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(subscription.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    /month
                  </p>
                </div>

                <button
                  onClick={() => onRemoveSubscription(subscription.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete subscription"
                >
                  <DeleteIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SubscriptionList;