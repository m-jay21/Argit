import { getNextBillDate } from './dateHelpers';

// Check if a subscription payment is due or overdue
export function isSubscriptionDue(subscription) {
  const today = new Date();
  const nextBillDate = new Date(subscription.nextBillDate);

  // Remove time component for date-only comparison
  today.setHours(0, 0, 0, 0);
  nextBillDate.setHours(0, 0, 0, 0);

  return today >= nextBillDate;
}

// Process due subscriptions and create transactions
export function processDueSubscriptions(subscriptions, addTransaction) {
  const today = new Date().toISOString().split('T')[0];
  const processedPayments = [];
  const updatedSubscriptions = [];

  subscriptions.forEach(subscription => {
    if (subscription.isActive && isSubscriptionDue(subscription)) {
      // Create transaction for this subscription payment
      const transaction = {
        type: 'expense',
        amount: subscription.amount,
        description: `${subscription.name} (Subscription)`,
        date: today,
        category: 'subscription'
      };

      // Add transaction (this will be handled by the calling component)
      processedPayments.push({
        subscription: subscription.name,
        amount: subscription.amount,
        transaction
      });

      // Update subscription with new next bill date
      const updatedSubscription = {
        ...subscription,
        nextBillDate: getNextBillDate(subscription.billDate)
      };

      updatedSubscriptions.push(updatedSubscription);
    } else {
      // Keep subscription unchanged
      updatedSubscriptions.push(subscription);
    }
  });

  return {
    processedPayments,
    updatedSubscriptions
  };
}

// Get days until next bill for display
export function getDaysUntilBill(nextBillDate) {
  const today = new Date();
  const billDate = new Date(nextBillDate);
  const diffTime = billDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format subscription status message
export function getSubscriptionStatus(subscription) {
  const daysUntil = getDaysUntilBill(subscription.nextBillDate);

  if (daysUntil < 0) {
    return {
      text: `${Math.abs(daysUntil)} days overdue`,
      color: 'text-red-600 dark:text-red-400',
      urgent: true
    };
  } else if (daysUntil === 0) {
    return {
      text: 'Due today',
      color: 'text-orange-600 dark:text-orange-400',
      urgent: true
    };
  } else if (daysUntil === 1) {
    return {
      text: 'Due tomorrow',
      color: 'text-yellow-600 dark:text-yellow-400',
      urgent: false
    };
  } else {
    return {
      text: `${daysUntil} days`,
      color: 'text-gray-600 dark:text-gray-400',
      urgent: false
    };
  }
}