import React, { useState, useMemo } from 'react';
import { AvailableForGoalsIcon, PlusIcon, EditIcon, MarkCompleteIcon, DeleteIcon, DollarSignIcon, TargetIcon, XIcon, AddIncomeIcon, FromSavingsIcon } from './icons';
import { calculateGoalProgress, getNextGoalId } from '../utils/budgetHelpers';
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
    targetAmount: ''
  });
  const [bucketModal, setBucketModal] = useState({
    isOpen: false,
    mode: null, // 'add' or 'remove'
    goalId: null,
    amount: ''
  });

  // Calculate available savings from savings pot only (manual deposits)
  // Use useMemo to recalculate when settings.savingsPot changes
  const availableForSavings = useMemo(() => {
    return getAvailableSavingsFromPot(settings, budgetConfig, monthlyIncome, currentBalance);
  }, [settings.savingsPot, settings, budgetConfig, monthlyIncome, currentBalance]);

  const formatCurrency = (amount) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `AED ${safeAmount.toFixed(2)}`;
  };

  const handleAddGoal = () => {
    const targetAmount = parseFloat(goalForm.targetAmount);

    if (goalForm.name.trim() && targetAmount > 0) {
      const newGoal = {
        id: getNextGoalId(),
        name: goalForm.name.trim(),
        description: goalForm.description.trim(),
        targetAmount,
        currentAmount: 0,
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
        targetAmount: ''
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
        targetAmount: goal.targetAmount.toString()
      });
      setEditingGoal(goalId);
    }
  };

  const handleSaveEdit = () => {
    const targetAmount = parseFloat(goalForm.targetAmount);

    if (goalForm.name.trim() && targetAmount > 0) {
      const updatedGoals = savingsGoals.map(goal =>
        goal.id === editingGoal
          ? {
              ...goal,
              name: goalForm.name.trim(),
              description: goalForm.description.trim(),
              targetAmount
            }
          : goal
      );

      onUpdateSavingsGoals(updatedGoals);
      setEditingGoal(null);
      setGoalForm({
        name: '',
        description: '',
        targetAmount: ''
      });
    }
  };

  const handleDeleteGoal = (goalId) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal && window.confirm(`Are you sure you want to delete "${goal.name}"? This will return ${formatCurrency(goal.currentAmount)} to your savings pot.`)) {
      // Return money to savings pot if goal has money
      if (goal.currentAmount > 0 && onUpdateSettings) {
        const currentPot = settings.savingsPot || 0;
        onUpdateSettings({
          ...settings,
          savingsPot: currentPot + goal.currentAmount
        });
      }
      
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

  const handleAddToBucket = (goalId) => {
    setBucketModal({
      isOpen: true,
      mode: 'add',
      goalId,
      amount: ''
    });
  };

  const handleRemoveFromBucket = (goalId) => {
    setBucketModal({
      isOpen: true,
      mode: 'remove',
      goalId,
      amount: ''
    });
  };

  const handleBucketModalSubmit = async () => {
    const { mode, goalId, amount: amountStr } = bucketModal;
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    if (mode === 'add') {
      // VALIDATION: Check if there's enough savings money
      if (amount > availableForSavings) {
        alert(`Insufficient savings! You only have ${formatCurrency(availableForSavings)} available in your savings pot, but trying to add ${formatCurrency(amount)}.`);
        return;
      }

      // Check if adding this amount would exceed the target
      if (goal.currentAmount + amount > goal.targetAmount) {
        const excess = (goal.currentAmount + amount) - goal.targetAmount;
        if (!window.confirm(`Adding ${formatCurrency(amount)} would exceed the target by ${formatCurrency(excess)}. Continue anyway?`)) {
          return;
        }
    }

      // Update goal bucket - add money to it
      const updatedGoals = savingsGoals.map(g =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: g.currentAmount + amount,
              monthlyHistory: [
                ...(g.monthlyHistory || []),
                {
                  month: new Date().toISOString().slice(0, 7),
                  contribution: amount,
                  balance: g.currentAmount + amount
                }
              ]
            }
          : g
      );

      // Update savings pot - deduct the amount from main pot
      // Await to ensure it completes before updating goals
        if (onUpdateSettings) {
          const currentPot = settings.savingsPot || 0;
        const newSavingsPot = currentPot - amount;
          
          await onUpdateSettings({
            ...settings,
            savingsPot: Math.max(0, newSavingsPot) // Ensure it doesn't go negative
          });
        }
        
      // Update goals after settings are saved
      await onUpdateSavingsGoals(updatedGoals);
    } else if (mode === 'remove') {
      if (amount > goal.currentAmount) {
        alert(`Cannot remove more than what's in the bucket! Current amount: ${formatCurrency(goal.currentAmount)}`);
        return;
      }

      // Update goal bucket - remove money from it
      const updatedGoals = savingsGoals.map(g =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: g.currentAmount - amount,
              monthlyHistory: [
                ...(g.monthlyHistory || []),
                {
                  month: new Date().toISOString().slice(0, 7),
                  contribution: -amount,
                  balance: g.currentAmount - amount
                }
              ]
            }
          : g
      );

      // Update savings pot - add the amount back to main pot
      // Await to ensure it completes before updating goals
      if (onUpdateSettings) {
        const currentPot = settings.savingsPot || 0;
        await onUpdateSettings({
          ...settings,
          savingsPot: currentPot + amount
        });
      }

      // Update goals after settings are saved
      await onUpdateSavingsGoals(updatedGoals);
    }

    // Close modal
    setBucketModal({
      isOpen: false,
      mode: null,
      goalId: null,
      amount: ''
    });
  };

  const handleBucketModalClose = () => {
    setBucketModal({
      isOpen: false,
      mode: null,
      goalId: null,
      amount: ''
    });
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
              <p className="text-sm text-text-secondary">Available in Savings Pot</p>
              <p className="text-xl font-semibold text-text-primary">
                {formatCurrency(availableForSavings)}
              </p>
              {settings.savingsPot > 0 && (
                <div className="text-xs text-text-secondary mt-1">
                  <p>• Total Savings Pot: {formatCurrency(settings.savingsPot)}</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add New Goal Bucket
          </button>
        </div>
      </div>

      {/* Add/Edit Goal Form */}
      {(showAddGoal || editingGoal) && (
        <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {editingGoal ? 'Edit Goal Bucket' : 'Add New Goal Bucket'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Goal Name</label>
              <input
                type="text"
                value={goalForm.name}
                onChange={(e) => setGoalForm({...goalForm, name: e.target.value})}
                placeholder="e.g., Lightsaber, Vacation"
                className="w-full px-3 py-2 bg-bg-secondary border border-border-input rounded-lg focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary text-text-primary"
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
                className="w-full px-3 py-2 bg-bg-secondary border border-border-input rounded-lg focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary text-text-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Description (Optional)</label>
              <input
                type="text"
                value={goalForm.description}
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                placeholder="Custom lightsaber build"
                className="w-full px-3 py-2 bg-bg-secondary border border-border-input rounded-lg focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary text-text-primary"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingGoal ? handleSaveEdit : handleAddGoal}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              {editingGoal ? 'Save Changes' : 'Add Goal Bucket'}
            </button>
            <button
              onClick={() => {
                setShowAddGoal(false);
                setEditingGoal(null);
                setGoalForm({
                  name: '',
                  description: '',
                  targetAmount: ''
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
                    onClick={() => handleAddToBucket(goal.id)}
                    className="px-3 py-2 bg-accent-primary text-white text-xs rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-1"
                    title="Add money to bucket from savings pot"
                  >
                    <AddIncomeIcon className="w-3 h-3" />
                    Add
                  </button>
                  {goal.currentAmount > 0 && (
                    <button
                      onClick={() => handleRemoveFromBucket(goal.id)}
                      className="px-3 py-2 bg-error-color text-white text-xs rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-1"
                      title="Remove money from bucket (returns to savings pot)"
                    >
                      <FromSavingsIcon className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => handleEditGoal(goal.id)}
                    className="p-2 text-accent-primary hover:bg-bg-accent rounded-lg transition-colors"
                    title="Edit Goal"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMarkComplete(goal.id)}
                    className="p-2 text-success-color hover:bg-bg-accent rounded-lg transition-colors"
                    title="Mark Complete"
                  >
                    <MarkCompleteIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-error-color hover:bg-bg-accent rounded-lg transition-colors"
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
            </div>
          );
        })}

        {savingsGoals.filter(goal => goal.isActive).length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <TargetIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">No savings goal buckets yet</p>
            <p className="text-sm">Create your first goal bucket to start allocating money from your savings pot!</p>
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

      {/* Bucket Amount Modal */}
      {bucketModal.isOpen && (() => {
        const goal = savingsGoals.find(g => g.id === bucketModal.goalId);
        if (!goal) return null;

        const isAddMode = bucketModal.mode === 'add';

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 w-full max-w-md mx-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">
                  {isAddMode ? `Add money to "${goal.name}" bucket` : `Remove money from "${goal.name}" bucket`}
                </h3>
                <button
                  onClick={handleBucketModalClose}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                  title="Close"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4 mb-6">
                {isAddMode ? (
                  <>
                    <div className="bg-bg-primary p-3 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Available in savings pot:</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(availableForSavings)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Current in bucket:</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(goal.currentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Target:</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-bg-primary p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Current in bucket:</span>
                      <span className="font-semibold text-text-primary">{formatCurrency(goal.currentAmount)}</span>
                    </div>
                    <div className="text-xs text-text-secondary mt-2">
                      Money will be returned to your savings pot
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Enter amount to {isAddMode ? 'add' : 'remove'}:
                  </label>
                  <input
                    type="number"
                    value={bucketModal.amount}
                    onChange={(e) => setBucketModal({...bucketModal, amount: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-bg-secondary border border-border-input rounded-lg focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary text-text-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleBucketModalSubmit();
                      } else if (e.key === 'Escape') {
                        handleBucketModalClose();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3">
                <button
                  onClick={handleBucketModalSubmit}
                  className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  {isAddMode ? (
                    <>
                      <AddIncomeIcon className="w-4 h-4" />
                      Add to Bucket
                    </>
                  ) : (
                    <>
                      <FromSavingsIcon className="w-4 h-4" />
                      Remove from Bucket
                    </>
                  )}
                </button>
                <button
                  onClick={handleBucketModalClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default SavingsGoals;
