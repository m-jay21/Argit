import React, { useState } from 'react';
import { AddIncomeIcon, ToSavingsIcon } from './icons';

function IncomeForm({ onAddTransaction, settings = {}, onUpdateSettings }) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      return;
    }

    // Create income transaction with no category
    onAddTransaction({
      type: 'income',
      amount,
      description: formData.description,
      date: formData.date,
      category: null
    });

    // Reset form
    setFormData({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
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
          className="bg-bg-secondary border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary w-24"
          required
        />
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          maxLength="100"
          placeholder="description"
          className="bg-bg-secondary border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary flex-1 min-w-32"
          required
        />
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-success-color text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1"
        >
          <AddIncomeIcon className="w-4 h-4" />
          Add Income
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!formData.amount || !formData.description) return;
            const amount = parseFloat(formData.amount);
            if (amount <= 0) return;

            // Deposit to savings pot - reduces spendable balance,
            // but should not count as a spending expense in reports.
            const transaction = {
              type: 'expense',
              description: formData.description || 'Deposit to Savings Pot',
              date: formData.date || new Date().toISOString().split('T')[0],
              category: 'Savings',
              amount,
              toSavings: true
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
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
              });
            } catch (error) {
              console.error('Failed to deposit to savings pot:', error);
              alert('Failed to deposit to savings pot. Please try again.');
            }
          }}
          className="flex-1 bg-success-color text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1"
          title="Deposit to savings pot (reduces balance, adds to savings pot)"
        >
          <ToSavingsIcon className="w-4 h-4" />
          To Savings
        </button>
      </div>
    </form>
  );
}

export default IncomeForm;

