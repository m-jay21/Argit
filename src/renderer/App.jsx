import React, { useState, useEffect } from 'react';
import { Plus, Banknote, Calendar, TrendingUp, TrendingDown, Loader2, CheckCircle, X, Target } from 'lucide-react';
import BalanceDisplay from './components/BalanceDisplay';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import SubscriptionForm from './components/SubscriptionForm';
import SubscriptionList from './components/SubscriptionList';
import MonthlyStats from './components/MonthlyStats';
import BudgetGoalsTab from './components/BudgetGoalsTab';
import { useLocalStorage } from './hooks/useLocalStorage';
import { processDueSubscriptions } from './utils/subscriptionHelpers';
import { calculateBudgetAmounts, calculateCategorySpending } from './utils/budgetHelpers';
import { processMonthEndSurplus, shouldProcessMonthEnd } from './utils/monthEndProcessing';

function App() {
  const [theme, setTheme] = useState('light');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [processedPayments, setProcessedPayments] = useState([]);
  const [showPaymentNotification, setShowPaymentNotification] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Use the local storage hook for data persistence
  const { data, isLoading, updateTransactions, updateSubscriptions, updateBudgetConfig, updateSavingsGoals, updateSettings } = useLocalStorage();
  const { transactions, subscriptions, budgetConfig, savingsGoals, settings } = data;

  // Calculate balance including starting balance
  // Exclude transactions from savings pot (they don't affect balance, only savings pot)
  useEffect(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense' && !t.fromSavings)
      .reduce((sum, t) => sum + t.amount, 0);

    const newBalance = settings.startingBalance + totalIncome - totalExpenses;
    setCurrentBalance(newBalance);
  }, [transactions, settings.startingBalance]);

  // Update budget spending when transactions change
  useEffect(() => {
    if (!isLoading && budgetConfig && budgetConfig.categories && Array.isArray(budgetConfig.categories) && transactions) {
      const updatedBudgetConfig = calculateCategorySpending(budgetConfig, transactions);
      // Only update if the spending amounts actually changed, not the lastUpdated timestamp
      const hasSpendingChanged = budgetConfig.categories.some((cat, index) => {
        const newCat = updatedBudgetConfig.categories[index];
        return newCat && cat.spentAmount !== newCat.spentAmount;
      });

      if (hasSpendingChanged) {
        updateBudgetConfig(updatedBudgetConfig);
      }
    }
  }, [transactions, isLoading]); // Removed budgetConfig from dependencies to prevent loop

  // Theme handling
  useEffect(() => {
    if (window.electronAPI) {
      // Get initial theme
      window.electronAPI.getSystemTheme().then(setTheme);

      // Listen for theme changes
      const handleThemeChange = (event, newTheme) => setTheme(newTheme);
      window.electronAPI.onThemeChanged(handleThemeChange);

      return () => {
        window.electronAPI.removeThemeListener(handleThemeChange);
      };
    }
  }, []);

  // Auto-process subscription payments when data loads
  useEffect(() => {
    if (!isLoading && subscriptions.length > 0) {
      const result = processDueSubscriptions(subscriptions);

      if (result.processedPayments.length > 0) {
        // Update subscriptions with new next bill dates
        updateSubscriptions(result.updatedSubscriptions);

        // Create transactions for each processed payment
        const newTransactions = [...transactions];
        result.processedPayments.forEach(payment => {
          const transaction = {
            ...payment.transaction,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
          };
          newTransactions.unshift(transaction);
        });

        // Update transactions
        updateTransactions(newTransactions);

        // Show notification
        setProcessedPayments(result.processedPayments);
        setShowPaymentNotification(true);
      }
    }
  }, [isLoading]); // Only run when loading state changes

  // Auto-process month-end surplus when data loads
  useEffect(() => {
    if (!isLoading && budgetConfig && transactions && settings) {
      if (shouldProcessMonthEnd(settings.lastProcessedMonth)) {
        processMonthEndSurplus(
          budgetConfig,
          transactions,
          settings,
          updateTransactions,
          updateSettings
        ).then(result => {
          if (result.processed) {
            console.log('Month-end processing:', result.message);
            if (result.backupCreated) {
              console.log('Transaction backup saved to:', result.backupPath);
            }
            // Could show a notification here about surplus added to savings and backup created
          }
        }).catch(error => {
          console.error('Month-end processing failed:', error);
        });
      }
    }
  }, [isLoading]); // Only run when loading state changes

  const addTransaction = async (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    const newTransactions = [newTransaction, ...transactions];

    try {
      await updateTransactions(newTransactions);
    } catch (error) {
      console.error('Error updating transactions:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const removeTransaction = async (id) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    await updateTransactions(newTransactions);
  };

  const addSubscription = async (subscription) => {
    const newSubscription = {
      ...subscription,
      id: Date.now().toString(),
      isActive: true
    };
    const newSubscriptions = [...subscriptions, newSubscription];
    await updateSubscriptions(newSubscriptions);
  };

  const removeSubscription = async (id) => {
    const newSubscriptions = subscriptions.filter(s => s.id !== id);
    await updateSubscriptions(newSubscriptions);
  };

  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Loading screen
  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">Loading Argit...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-primary p-5 overflow-auto">
      <div className="max-w-4xl mx-auto bg-bg-primary rounded-xl shadow-cozy border border-border-color relative">
        {/* Scanline effect */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,168,130,0.06) 2px, rgba(200,168,130,0.06) 4px)'
          }}
        />

        {/* Window Title */}
        <div className="bg-bg-accent px-4 py-2.5 rounded-t-xl text-sm text-text-secondary font-medium">
          argit - the money manager
        </div>

        <div className="p-5">
          {/* Payment Notification */}
          {showPaymentNotification && (
            <div className="bg-success-color text-white p-3 rounded-lg mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Subscription Payments Processed</span>
              </div>
              <button
                onClick={() => setShowPaymentNotification(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Balance Display */}
          <BalanceDisplay balance={currentBalance} currency={settings.currency} />

          {/* Tab Navigation */}
          <div className="bg-bg-secondary border border-border-light rounded-lg mb-5">
            <div className="flex border-b border-border-light">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium rounded-tl-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-accent-primary text-white'
                    : 'text-text-primary hover:bg-bg-accent'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-accent-primary text-white'
                    : 'text-text-primary hover:bg-bg-accent'
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setActiveTab('budget')}
                className={`px-4 py-3 text-sm font-medium rounded-tr-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'budget'
                    ? 'bg-accent-primary text-white'
                    : 'text-text-primary hover:bg-bg-accent'
                }`}
              >
                <Target className="w-4 h-4" />
                Budget & Goals
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Quick Overview */}
              <MonthlyStats transactions={transactions} subscriptions={subscriptions} currency={settings.currency} />

              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-5">
                {/* Add Transaction Section */}
                <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
                  <div className="flex items-center text-text-primary font-semibold mb-3">
                    <Plus className="w-4 h-4 text-accent-primary mr-2" />
                    Add Transaction
                  </div>
                  <TransactionForm
                    onAddTransaction={addTransaction}
                    availableCategories={budgetConfig?.categories || []}
                    settings={settings || {}}
                    onUpdateSettings={updateSettings}
                  />
                </div>

                {/* Recent Activity Section */}
                <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
                  <div className="flex items-center text-text-primary font-semibold mb-3">
                    <TrendingUp className="w-4 h-4 text-accent-primary mr-2" />
                    Recent Activity
                  </div>
                  <TransactionList
                    transactions={transactions.slice(0, 3)}
                    onRemoveTransaction={removeTransaction}
                    currency={settings.currency}
                  />
                  {transactions.length > 3 && (
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-accent-primary text-sm font-medium mt-2 hover:underline"
                    >
                      View all transactions →
                    </button>
                  )}
                </div>
              </div>

              {/* Subscription Management Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-5">
                {/* Add Subscription Section */}
                <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
                  <div className="flex items-center text-text-primary font-semibold mb-3">
                    <Plus className="w-4 h-4 text-accent-primary mr-2" />
                    Add Subscription
                  </div>
                  <SubscriptionForm onAddSubscription={addSubscription} />
                </div>

                {/* Upcoming Bills Section */}
                <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
                  <div className="flex items-center text-text-primary font-semibold mb-3">
                    <Calendar className="w-4 h-4 text-accent-primary mr-2" />
                    Upcoming Bills
                  </div>
                  <SubscriptionList
                    subscriptions={subscriptions}
                    onRemoveSubscription={removeSubscription}
                    currency={settings.currency}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              {/* Monthly Transaction View */}
              <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-text-primary font-semibold">
                    <TrendingUp className="w-4 h-4 text-accent-primary mr-2" />
                    All Transactions - {currentMonth}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Total: {transactions.length} transactions
                  </div>
                </div>
                <TransactionList
                  transactions={transactions}
                  onRemoveTransaction={removeTransaction}
                  currency={settings.currency}
                />
              </div>
            </>
          )}

        {activeTab === 'budget' && (
          <BudgetGoalsTab
            transactions={transactions || []}
            budgetConfig={budgetConfig || { categories: [], totalAllocatedPercentage: 0, availableForSavings: 100 }}
            savingsGoals={savingsGoals || []}
            onUpdateBudgetConfig={updateBudgetConfig}
            onUpdateSavingsGoals={updateSavingsGoals}
            onAddTransaction={addTransaction}
            currency={settings?.currency || 'AED'}
            currentBalance={currentBalance}
            settings={settings || {}}
            onUpdateSettings={updateSettings}
          />
        )}
        </div>
      </div>
    </div>
  );
}

export default App;