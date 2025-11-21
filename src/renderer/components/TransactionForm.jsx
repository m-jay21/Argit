import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

function TransactionForm({ onAddTransaction, availableCategories = [], settings = {}, onUpdateSettings }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: availableCategories.length > 0 ? availableCategories[0].name : 'Savings'
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      return;
    }

    onAddTransaction({
      ...formData,
      amount
    });

    // Reset form
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: availableCategories.length > 0 ? availableCategories[0].name : 'Savings'
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 w-full">
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="0.00"
          className="bg-white border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary w-24"
          required
        />
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          maxLength="100"
          placeholder="description"
          className="bg-white border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary flex-1 min-w-32"
          required
        />
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="bg-white border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
        >
          {availableCategories.length > 0 ? (
            availableCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))
          ) : (
            // Fallback categories if none provided
            <>
              <option value="Savings">Savings</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Subscription">Subscription</option>
              <option value="Income">Income</option>
            </>
          )}
        </select>
      </div>
      
      {/* Savings pot indicator */}
      {(settings.savingsPot || 0) > 0 && (
        <div className="text-xs text-teal-600 dark:text-teal-400 mb-2 flex items-center gap-1">
          <Wallet className="w-3 h-3" />
          Savings pot: {(settings.savingsPot || 0).toFixed(2)} AED available
        </div>
      )}
      
      <div className="flex flex-col gap-2 my-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!formData.amount || !formData.description) return;
              const amount = parseFloat(formData.amount);
              if (amount <= 0) return;

              onAddTransaction({
                ...formData,
                type: 'income',
                amount
              });

              setFormData({
                type: 'expense',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                category: availableCategories.length > 0 ? availableCategories[0].name : 'Savings'
              });
            }}
            className="bg-success-color text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1 flex-1"
          >
            <TrendingUp className="w-4 h-4" />
            Income
          </button>
          <button
            type="button"
            onClick={() => {
              if (!formData.amount || !formData.description) return;
              const amount = parseFloat(formData.amount);
              if (amount <= 0) return;

              onAddTransaction({
                ...formData,
                type: 'expense',
                amount
              });

              setFormData({
                type: 'expense',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                category: availableCategories.length > 0 ? availableCategories[0].name : 'Savings'
              });
            }}
            className="bg-error-color text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1 flex-1"
          >
            <TrendingDown className="w-4 h-4" />
            Expense
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!formData.amount || !formData.description) return;
              const amount = parseFloat(formData.amount);
              if (amount <= 0) return;

              // Deposit to savings pot - creates an expense transaction that reduces balance
              // but increases savings pot
              const transaction = {
                type: 'expense',
                description: formData.description || 'Deposit to Savings Pot',
                date: formData.date || new Date().toISOString().split('T')[0],
                category: 'Savings',
                amount
              };

              try {
                // Add the transaction first (this reduces your balance)
                await onAddTransaction(transaction);
                
                // Then add to savings pot
                if (onUpdateSettings) {
                  const currentPot = settings.savingsPot || 0;
                  const updatedSettings = {
                    ...settings,
                    savingsPot: currentPot + amount
                  };
                  await onUpdateSettings(updatedSettings);
                }

                // Reset form
                setFormData({
                  type: 'expense',
                  amount: '',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                  category: availableCategories.length > 0 ? availableCategories[0].name : 'Savings'
                });
              } catch (error) {
                console.error('Failed to deposit to savings pot:', error);
                alert('Failed to deposit to savings pot. Please try again.');
              }
            }}
            className="bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1 flex-1"
            title="Deposit to savings pot (reduces balance, adds to savings pot)"
          >
            <Wallet className="w-4 h-4" />
            To Savings
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!formData.amount || !formData.description) return;
              const amount = parseFloat(formData.amount);
              if (amount <= 0) return;

              // Check if there's enough in savings pot
              const availableSavings = settings.savingsPot || 0;
              if (amount > availableSavings) {
                alert(`Insufficient savings! You have ${availableSavings.toFixed(2)} AED in your savings pot, but trying to spend ${amount.toFixed(2)} AED.`);
                return;
              }

              // Create expense transaction using selected category (counts towards budget)
              // Mark as fromSavings so it doesn't affect balance calculation
              const transaction = {
                ...formData,
                type: 'expense',
                amount,
                fromSavings: true // Flag to exclude from balance calculation
                // Use selected category from formData, not hardcoded 'Savings'
              };

              try {
                // Add the transaction first and wait for it to complete
                await onAddTransaction(transaction);
                
                // Then deduct from savings pot and wait for it to complete
                if (onUpdateSettings) {
                  const updatedSettings = {
                    ...settings,
                    savingsPot: availableSavings - amount
                  };
                  await onUpdateSettings(updatedSettings);
                }

                // Reset form
                setFormData({
                  type: 'expense',
                  amount: '',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                  category: availableCategories.length > 0 ? availableCategories[0].name : 'Savings'
                });
              } catch (error) {
                console.error('Failed to process savings expense:', error);
                alert('Failed to process savings expense. Please try again.');
              }
            }}
            className="bg-teal-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1 flex-1"
            title={`Spend from savings pot (${(settings.savingsPot || 0).toFixed(2)} AED available) - Uses selected category`}
          >
            <Wallet className="w-4 h-4" />
            From Savings
          </button>
        </div>
      </div>
    </form>
  );
}

export default TransactionForm;