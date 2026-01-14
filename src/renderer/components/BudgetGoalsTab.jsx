import React, { useState, useEffect } from 'react';
import { TargetIcon, ManageCategoriesIcon, SavingsGoalsTabIcon, TrendingUpIcon } from './icons';
import BudgetAllocation from './BudgetAllocation';
import CategoryManagement from './CategoryManagement';
import SavingsGoals from './SavingsGoals';
import { getMonthlyStats } from '../utils/calculations';

function BudgetGoalsTab({
  transactions,
  budgetConfig,
  savingsGoals,
  onUpdateBudgetConfig,
  onUpdateSavingsGoals,
  onAddTransaction,
  currency,
  currentBalance = 0,
  settings = {},
  onUpdateSettings
}) {
  const [activeSection, setActiveSection] = useState('budget');
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  // Calculate monthly income from transactions (available for budget after savings deposits)
  useEffect(() => {
    const stats = getMonthlyStats(transactions);
    // Use availableIncomeForBudget instead of total income (subtracts savings deposits)
    setMonthlyIncome(stats.availableIncomeForBudget || stats.income);
  }, [transactions]);

  // Show loading if essential data is missing
  if (!budgetConfig || !Array.isArray(budgetConfig.categories)) {
    return (
      <div className="space-y-5">
        <div className="bg-bg-secondary border border-border-light p-8 rounded-lg text-center">
          <div className="w-12 h-12 bg-accent-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <TargetIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Setting up Budget & Goals</h3>
          <p className="text-text-secondary">Please wait while we initialize your budget configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Section Navigation */}
      <div className="bg-bg-secondary border border-border-light rounded-lg">
        <div className="flex border-b border-border-light">
          <button
            onClick={() => setActiveSection('budget')}
            className={`px-4 py-3 text-sm font-medium rounded-tl-lg transition-colors flex items-center gap-2 ${
              activeSection === 'budget'
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-accent'
            }`}
          >
            Budget Allocation
          </button>
          <button
            onClick={() => setActiveSection('goals')}
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSection === 'goals'
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-accent'
            }`}
          >
            <SavingsGoalsTabIcon className="w-4 h-4" />
            Savings Goals
          </button>
          <button
            onClick={() => setActiveSection('categories')}
            className={`px-4 py-3 text-sm font-medium rounded-tr-lg transition-colors flex items-center gap-2 ${
              activeSection === 'categories'
                ? 'bg-accent-primary text-white'
                : 'text-text-primary hover:bg-bg-accent'
            }`}
          >
            <ManageCategoriesIcon className="w-4 h-4" />
            Manage Categories
          </button>
        </div>
      </div>

      {/* Monthly Income Display */}
      <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center">
              <TrendingUpIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">This Month's Income</p>
              <p className="text-xl font-semibold text-text-primary">
                AED {(monthlyIncome || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            ⮤ Updates automatically from transactions
          </div>
        </div>
      </div>

      {/* Section Content */}
      {activeSection === 'budget' && (
        <BudgetAllocation
          monthlyIncome={monthlyIncome || 0}
          budgetConfig={budgetConfig}
          transactions={transactions || []}
          onUpdateBudgetConfig={onUpdateBudgetConfig}
          currency={currency}
          currentBalance={currentBalance}
        />
      )}

        {activeSection === 'goals' && (
          <SavingsGoals
            savingsGoals={savingsGoals || []}
            budgetConfig={budgetConfig}
            monthlyIncome={monthlyIncome || 0}
            onUpdateSavingsGoals={onUpdateSavingsGoals}
            onAddTransaction={onAddTransaction}
            currency={currency}
            currentBalance={currentBalance}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        )}

      {activeSection === 'categories' && (
        <CategoryManagement
          budgetConfig={budgetConfig}
          transactions={transactions}
          onUpdateBudgetConfig={onUpdateBudgetConfig}
        />
      )}
    </div>
  );
}

export default BudgetGoalsTab;