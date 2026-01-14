import React, { useState, useEffect } from 'react';
import { PieChartIcon, SaveChangesIcon, ResetBudgetIcon, PlusIcon, AlertCircleIcon } from './icons';
import { calculateBudgetAmounts, validateBudgetPercentages, calculateSurplusDistribution } from '../utils/budgetHelpers';

function BudgetAllocation({
  monthlyIncome = 0,
  budgetConfig,
  transactions,
  onUpdateBudgetConfig,
  currency,
  currentBalance = 0
}) {
  const [localBudgetConfig, setLocalBudgetConfig] = useState(budgetConfig);
  const [validation, setValidation] = useState({ isValid: true, errors: [] });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Update local config when props change
  useEffect(() => {
    if (budgetConfig && budgetConfig.categories && Array.isArray(budgetConfig.categories)) {
      // Use monthly income for budget allocation (not total balance)
      const updatedConfig = calculateBudgetAmounts(budgetConfig, monthlyIncome);
      setLocalBudgetConfig(updatedConfig);
    }
  }, [budgetConfig, monthlyIncome]);

  // Validate percentages whenever they change
  useEffect(() => {
    if (localBudgetConfig && localBudgetConfig.categories && Array.isArray(localBudgetConfig.categories)) {
      const validationResult = validateBudgetPercentages(localBudgetConfig.categories);
      setValidation(validationResult);
    }
  }, [localBudgetConfig.categories]);

  const handlePercentageChange = (categoryId, newPercentage) => {
    if (!localBudgetConfig || !localBudgetConfig.categories || !Array.isArray(localBudgetConfig.categories)) {
      return;
    }

    const updatedCategories = localBudgetConfig.categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, percentage: Math.max(0, Math.min(100, parseFloat(newPercentage) || 0)) }
        : cat
    );

    const updatedConfig = {
      ...localBudgetConfig,
      categories: updatedCategories
    };

    setLocalBudgetConfig(calculateBudgetAmounts(updatedConfig, monthlyIncome));
  };

  const handleSaveChanges = () => {
    if (validation.isValid) {
      onUpdateBudgetConfig(localBudgetConfig);
    }
  };

  const handleResetBudget = () => {
    const resetConfig = {
      ...localBudgetConfig,
      categories: localBudgetConfig.categories.map(cat => ({
        ...cat,
        percentage: 0
      }))
    };
    setLocalBudgetConfig(calculateBudgetAmounts(resetConfig, monthlyIncome));
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() &&
        localBudgetConfig &&
        localBudgetConfig.categories &&
        !localBudgetConfig.categories.find(cat => cat.name === newCategoryName.trim())) {
      const newCategory = {
        id: `cat_${newCategoryName.toLowerCase().replace(/\s+/g, '_')}`,
        name: newCategoryName.trim(),
        percentage: 0,
        budgetAmount: 0,
        spentAmount: 0,
        remainingAmount: 0,
        isActive: true
      };

      const updatedConfig = {
        ...localBudgetConfig,
        categories: [...localBudgetConfig.categories, newCategory]
      };

      setLocalBudgetConfig(updatedConfig);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const surplusInfo = localBudgetConfig && localBudgetConfig.categories
    ? calculateSurplusDistribution(localBudgetConfig)
    : { categorySurplus: 0, originalSavingsAllocation: 0, totalAvailableForSavings: 0 };

  const formatCurrency = (amount) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `AED ${safeAmount.toFixed(2)}`;
  };

  const getProgressBarColor = (remaining, budget) => {
    if (remaining < 0) return 'bg-red-500';
    if (remaining < budget * 0.2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-5">
      {/* Budget Allocation Header */}
      <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center">
            <PieChartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Budget Allocation</h2>
            <p className="text-sm text-text-secondary">
              This Month's Income: {formatCurrency(monthlyIncome)}
            </p>
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Budget Validation Errors:</span>
            </div>
            <ul className="mt-1 text-sm text-red-600">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Budget Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Category</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">%</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Budgeted</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Used</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Progress</th>
              </tr>
            </thead>
            <tbody>
              {(localBudgetConfig?.categories || []).map((category) => {
                const usedPercentage = category.budgetAmount > 0
                  ? (category.spentAmount / category.budgetAmount) * 100
                  : 0;

                return (
                  <tr key={category.id} className="border-b border-border-light/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={category.percentage}
                        onChange={(e) => handlePercentageChange(category.id, e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-border-input rounded focus:outline-none focus:border-accent-primary"
                      />
                      <span className="text-xs text-text-secondary ml-1">%</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-text-primary">{formatCurrency(category.budgetAmount)}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-text-primary">{formatCurrency(category.spentAmount)}</span>
                    </td>
                    <td className="py-3">
                      <div className="w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressBarColor(category.remainingAmount, category.budgetAmount)}`}
                            style={{ width: `${Math.min(100, usedPercentage)}%` }}
                          />
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          {(usedPercentage || 0).toFixed(0)}%
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Add Category Row */}
              {showAddCategory ? (
                <tr className="border-b border-border-light/50">
                  <td className="py-3" colSpan="5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="px-3 py-2 text-sm border border-border-input rounded focus:outline-none focus:border-accent-primary flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <button
                        onClick={handleAddCategory}
                        className="px-3 py-2 bg-accent-primary text-white text-sm rounded hover:bg-opacity-90"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCategory(false);
                          setNewCategoryName('');
                        }}
                        className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-opacity-90"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="py-3" colSpan="5">
                    <button
                      onClick={() => setShowAddCategory(true)}
                      className="flex items-center gap-2 text-sm text-accent-primary hover:underline"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Category
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-bg-accent rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Total Allocated:</span>
            <span className="font-medium text-text-primary">
              {(validation.totalPercentage || 0).toFixed(1)}% ({formatCurrency((monthlyIncome || 0) * (validation.totalPercentage || 0) / 100)})
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-text-secondary">Available for Savings:</span>
            <span className={`font-medium ${(validation.availableForSavings || 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {(validation.availableForSavings || 0).toFixed(1)}% ({formatCurrency((monthlyIncome || 0) * (validation.availableForSavings || 0) / 100)})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSaveChanges}
            disabled={!validation.isValid}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              validation.isValid
                ? 'bg-accent-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <SaveChangesIcon className="w-4 h-4" />
            Save Changes
          </button>
          <button
            onClick={handleResetBudget}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <ResetBudgetIcon className="w-4 h-4" />
            Reset Budget
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetAllocation;