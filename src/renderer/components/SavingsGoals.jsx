import React, { useState } from 'react';
import { AvailableForGoalsIcon, PlusIcon, EditIcon, MarkCompleteIcon, DeleteIcon, DollarSignIcon, PercentIcon, ShuffleIcon, TargetIcon } from './icons';
import { calculateGoalProgress, getNextGoalId, calculateSurplusDistribution } from '../utils/budgetHelpers';
import { getAvailableSavingsFromPot } from '../utils/monthEndProcessing';

function SavingsGoals({
  savingsGoals,
  budgetConfig,
  monthlyIncome = 0,
  onUpdateSavingsGoals,
  onAddTransaction,
  currency,
  currentBalance = 0,
  settings = {},
  onUpdateSettings
}) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    name: '',
    description: '',
    targetAmount: '',
    contributionType: 'fixed',
    monthlyContribution: '',
    percentageContribution: '',
    priority: 1
  });

  // Calculate available savings from savings pot only (manual deposits)
  const calculateAvailableSavings = () => {
    return getAvailableSavingsFromPot(settings, budgetConfig, monthlyIncome, currentBalance);
  };

  const availableForSavings = calculateAvailableSavings();

  const formatCurrency = (amount) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `AED ${safeAmount.toFixed(2)}`;
  };

  const handleAddGoal = () => {
    const targetAmount = parseFloat(goalForm.targetAmount);
    const monthlyContribution = goalForm.contributionType === 'fixed' ? parseFloat(goalForm.monthlyContribution) : 0;
    const percentageContribution = goalForm.contributionType === 'percentage' ? parseFloat(goalForm.percentageContribution) : null;

    if (goalForm.name.trim() && targetAmount > 0) {
      const newGoal = {
        id: getNextGoalId(),
        name: goalForm.name.trim(),
        description: goalForm.description.trim(),
        targetAmount,
        currentAmount: 0,
        contributionType: goalForm.contributionType,
        monthlyContribution: monthlyContribution || 0,
        percentageContribution,
        priority: parseInt(goalForm.priority),
        targetDate: null,
        calculatedCompletionDate: null,
        isActive: true,
        createdDate: new Date().toISOString(),
        completedDate: null,
        monthlyHistory: []
      };

      const updatedGoals = [...savingsGoals, newGoal];
      onUpdateSavingsGoals(updatedGoals);

      // Reset form
      setGoalForm({
        name: '',
        description: '',
        targetAmount: '',
        contributionType: 'fixed',
        monthlyContribution: '',
        percentageContribution: '',
        priority: 1
      });
      setShowAddGoal(false);
    }
  };

  const handleEditGoal = (goalId) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal) {
      setGoalForm({
        name: goal.name,
        description: goal.description || '',
        targetAmount: goal.targetAmount.toString(),
        contributionType: goal.contributionType,
        monthlyContribution: goal.monthlyContribution.toString(),
        percentageContribution: goal.percentageContribution ? goal.percentageContribution.toString() : '',
        priority: goal.priority
      });
      setEditingGoal(goalId);
    }
  };

  const handleSaveEdit = () => {
    const targetAmount = parseFloat(goalForm.targetAmount);
    const monthlyContribution = goalForm.contributionType === 'fixed' ? parseFloat(goalForm.monthlyContribution) : 0;
    const percentageContribution = goalForm.contributionType === 'percentage' ? parseFloat(goalForm.percentageContribution) : null;

    if (goalForm.name.trim() && targetAmount > 0) {
      const updatedGoals = savingsGoals.map(goal =>
        goal.id === editingGoal
          ? {
              ...goal,
              name: goalForm.name.trim(),
              description: goalForm.description.trim(),
              targetAmount,
              contributionType: goalForm.contributionType,
              monthlyContribution: monthlyContribution || 0,
              percentageContribution,
              priority: parseInt(goalForm.priority)
            }
          : goal
      );

      onUpdateSavingsGoals(updatedGoals);
      setEditingGoal(null);
      setGoalForm({
        name: '',
        description: '',
        targetAmount: '',
        contributionType: 'fixed',
        monthlyContribution: '',
        percentageContribution: '',
        priority: 1
      });
    }
  };

  const handleDeleteGoal = (goalId) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal && window.confirm(`Are you sure you want to delete "${goal.name}"?`)) {
      const updatedGoals = savingsGoals.filter(g => g.id !== goalId);
      onUpdateSavingsGoals(updatedGoals);
    }
  };

  const handleMarkComplete = (goalId) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal && window.confirm(`Mark "${goal.name}" as complete?`)) {
      const updatedGoals = savingsGoals.map(g =>
        g.id === goalId
          ? {
              ...g,
              isActive: false,
              completedDate: new Date().toISOString(),
              currentAmount: g.targetAmount
            }
          : g
      );
      onUpdateSavingsGoals(updatedGoals);
    }
  };

  const handleContribute = (goalId) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    let contributionAmount = 0;
    const contribution = getContributionDisplay(goal);

    if (goal.contributionType === 'fixed') {
      contributionAmount = goal.monthlyContribution;
    } else if (goal.contributionType === 'percentage') {
      contributionAmount = contribution.amount;
    } else {
      // For flexible goals, prompt for amount
      const amountStr = window.prompt(`Enter contribution amount for "${goal.name}":`);
      if (!amountStr) return;
      contributionAmount = parseFloat(amountStr);
      if (isNaN(contributionAmount) || contributionAmount <= 0) return;
    }

    if (contributionAmount <= 0) return;

    // VALIDATION: Check if there's enough savings money
    if (contributionAmount > availableForSavings) {
      alert(`Insufficient savings! You only have ${formatCurrency(availableForSavings)} available for goals, but trying to contribute ${formatCurrency(contributionAmount)}.`);
      return;
    }

    // Create transaction for the contribution
    const transaction = {
      type: 'expense',
      amount: contributionAmount,
      description: `Contribution to ${goal.name}`,
      date: new Date().toISOString().split('T')[0],
      category: 'Savings'
    };

    // Add the transaction FIRST and wait for it to complete
    if (onAddTransaction) {
      const addTransactionPromise = onAddTransaction(transaction);
      
      // Wait for transaction to be saved before updating goals
      if (addTransactionPromise && typeof addTransactionPromise.then === 'function') {
        addTransactionPromise.then(() => {
          updateGoalAmount();
        }).catch((error) => {
          console.error('SavingsGoals: Failed to save transaction:', error);
          alert('Failed to save transaction. Please try again.');
        });
      } else {
        // If onAddTransaction doesn't return a promise, update immediately
        setTimeout(updateGoalAmount, 100); // Small delay to avoid race condition
      }
    } else {
      console.error('SavingsGoals: onAddTransaction is not available!');
    }

    // Function to update goal amount
    async function updateGoalAmount() {
      const updatedGoals = savingsGoals.map(g =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: g.currentAmount + contributionAmount,
              monthlyHistory: [
                ...(g.monthlyHistory || []),
                {
                  month: new Date().toISOString().slice(0, 7),
                  contribution: contributionAmount,
                  balance: g.currentAmount + contributionAmount
                }
              ]
            }
          : g
      );

      try {
        const result = await onUpdateSavingsGoals(updatedGoals);
        
        // Update savings pot - deduct the contribution amount
        if (onUpdateSettings) {
          const currentPot = settings.savingsPot || 0;
          const newSavingsPot = currentPot - contributionAmount;
          
          await onUpdateSettings({
            ...settings,
            savingsPot: Math.max(0, newSavingsPot) // Ensure it doesn't go negative
          });
        }
        
      } catch (error) {
        console.error('SavingsGoals: Failed to update goals:', error);
        alert('Failed to update goal progress. Please refresh the page.');
      }
    }
  };

  const getContributionDisplay = (goal) => {
    switch (goal.contributionType) {
      case 'fixed':
        return {
          icon: <DollarSignIcon className="w-4 h-4" />,
          text: `Fixed: ${formatCurrency(goal.monthlyContribution)}/month`,
          amount: goal.monthlyContribution
        };
      case 'percentage':
        return {
          icon: <PercentIcon className="w-4 h-4" />,
          text: `Percentage: ${goal.percentageContribution}%`,
          amount: (availableForSavings * goal.percentageContribution) / 100
        };
      case 'flexible':
        return {
          icon: <ShuffleIcon className="w-4 h-4" />,
          text: 'Gets remaining funds automatically',
          amount: 0 // Calculated at distribution time
        };
      default:
        return { icon: null, text: '', amount: 0 };
    }
  };

  const getEstimatedCompletion = (goal) => {
    const progress = calculateGoalProgress(goal);
    if (progress.estimatedCompletion) {
      const months = Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyContribution);
      return `${months} months remaining`;
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Available Savings Display */}
      <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-color rounded-lg flex items-center justify-center">
              <AvailableForGoalsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Available for Goals</p>
              <p className="text-xl font-semibold text-text-primary">
                {formatCurrency(availableForSavings)}
              </p>
              {settings.savingsPot > 0 && (
                <div className="text-xs text-text-secondary mt-1">
                  <p>• Savings Pot: {formatCurrency(settings.savingsPot)} (from manual deposits)</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add New Goal
          </button>
        </div>
      </div>

      {/* Add/Edit Goal Form */}
      {(showAddGoal || editingGoal) && (
        <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Goal Name</label>
              <input
                type="text"
                value={goalForm.name}
                onChange={(e) => setGoalForm({...goalForm, name: e.target.value})}
                placeholder="e.g., Lightsaber, Vacation"
                className="w-full px-3 py-2 border border-border-input rounded-lg focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Target Amount</label>
              <input
                type="number"
                value={goalForm.targetAmount}
                onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})}
                placeholder="2000"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-border-input rounded-lg focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Description (Optional)</label>
              <input
                type="text"
                value={goalForm.description}
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                placeholder="Custom lightsaber build"
                className="w-full px-3 py-2 border border-border-input rounded-lg focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Contribution Type</label>
              <select
                value={goalForm.contributionType}
                onChange={(e) => setGoalForm({...goalForm, contributionType: e.target.value})}
                className="w-full px-3 py-2 border border-border-input rounded-lg focus:outline-none focus:border-accent-primary"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
                <option value="flexible">Flexible (Remaining Funds)</option>
              </select>
            </div>

            {goalForm.contributionType === 'fixed' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Monthly Contribution</label>
                <input
                  type="number"
                  value={goalForm.monthlyContribution}
                  onChange={(e) => setGoalForm({...goalForm, monthlyContribution: e.target.value})}
                  placeholder="100"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-border-input rounded-lg focus:outline-none focus:border-accent-primary"
                />
              </div>
            )}

            {goalForm.contributionType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Percentage of Savings Pot</label>
                <input
                  type="number"
                  value={goalForm.percentageContribution}
                  onChange={(e) => setGoalForm({...goalForm, percentageContribution: e.target.value})}
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-border-input rounded-lg focus:outline-none focus:border-accent-primary"
                />
              </div>
            )}

            {goalForm.contributionType === 'flexible' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Priority</label>
                <select
                  value={goalForm.priority}
                  onChange={(e) => setGoalForm({...goalForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-border-input rounded-lg focus:outline-none focus:border-accent-primary"
                >
                  <option value={1}>High Priority (1st)</option>
                  <option value={2}>Medium Priority (2nd)</option>
                  <option value={3}>Low Priority (3rd)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingGoal ? handleSaveEdit : handleAddGoal}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              {editingGoal ? 'Save Changes' : 'Add Goal'}
            </button>
            <button
              onClick={() => {
                setShowAddGoal(false);
                setEditingGoal(null);
                setGoalForm({
                  name: '',
                  description: '',
                  targetAmount: '',
                  contributionType: 'fixed',
                  monthlyContribution: '',
                  percentageContribution: '',
                  priority: 1
                });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {savingsGoals.filter(goal => goal.isActive).map((goal) => {
          const progress = calculateGoalProgress(goal);
          const contribution = getContributionDisplay(goal);
          const completion = getEstimatedCompletion(goal);

          return (
            <div key={goal.id} className="bg-bg-secondary border border-border-light p-4 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {goal.name}
                    </h3>
                    <span className="text-lg font-bold text-accent-primary">
                      {formatCurrency(goal.currentAmount)}/{formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-text-secondary mb-2">{goal.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleContribute(goal.id)}
                    className="px-3 py-2 bg-accent-primary text-white text-xs rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-1"
                    title="Contribute to Goal"
                  >
                    <DollarSign className="w-3 h-3" />
                    Contribute
                  </button>
                  <button
                    onClick={() => handleEditGoal(goal.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit Goal"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMarkComplete(goal.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Mark Complete"
                  >
                    <MarkCompleteIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete Goal"
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-accent-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-text-secondary mt-1">
                  <span>{progress.progress.toFixed(1)}% complete</span>
                  <span>{formatCurrency(progress.remainingAmount)} remaining</span>
                </div>
              </div>

              {/* Contribution Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-primary">
                  {contribution.icon}
                  <span>{contribution.text}</span>
                </div>
                {completion && (
                  <span className="text-text-secondary">• {completion}</span>
                )}
              </div>
            </div>
          );
        })}

        {savingsGoals.filter(goal => goal.isActive).length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <TargetIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">No savings goals yet</p>
            <p className="text-sm">Create your first savings goal to start tracking progress!</p>
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {savingsGoals.filter(goal => !goal.isActive).length > 0 && (
        <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Completed Goals</h3>
          <div className="space-y-2">
            {savingsGoals.filter(goal => !goal.isActive).map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-text-primary font-medium">{goal.name}</span>
                <span className="text-green-600 font-semibold">{formatCurrency(goal.targetAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SavingsGoals;