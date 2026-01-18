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
      <div className="text-center py-8 text-text-secondary">
        <p>No subscriptions yet</p>
        <p className="text-sm">Add your first subscription above</p>
      </div>
    );
  }

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-bg-secondary rounded-lg p-3 border border-border-light">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            Total Monthly Cost
          </span>
          <span className="text-lg font-bold text-text-primary">
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
              className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-light"
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {subscription.name}
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-xs text-text-secondary">
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
                  <p className="text-sm font-semibold text-text-primary">
                    {formatCurrency(subscription.amount)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    /month
                  </p>
                </div>

                <button
                  onClick={() => onRemoveSubscription(subscription.id)}
                  className="p-1 text-text-secondary hover:text-error-color transition-colors"
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