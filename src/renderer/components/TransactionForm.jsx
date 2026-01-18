import React, { useState } from 'react';
import { AddExpenseIcon, SavingsPotIcon, FromSavingsIcon } from './icons';

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
        <div className="text-xs text-teal-600 mb-2 flex items-center gap-1">
          <SavingsPotIcon className="w-3 h-3" />
          Savings pot: {(settings.savingsPot || 0).toFixed(2)} AED available
        </div>
      )}
      
      <div className="flex gap-2 my-1">
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
          className="flex-1 bg-error-color text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1"
        >
          <AddExpenseIcon className="w-4 h-4" />
          Add Expense
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

            try {
              // Create expense transaction using selected category (counts towards budget)
              const transaction = {
                ...formData,
                type: 'expense',
                amount,
                description: formData.description || 'Spent from Savings',
                date: formData.date || new Date().toISOString().split('T')[0],
                category: formData.category || 'Savings'
              };

              // Add the transaction first
              await onAddTransaction(transaction);
              
              // Then deduct from savings pot
              if (onUpdateSettings) {
                const currentPot = settings.savingsPot || 0;
                const updatedSettings = {
                  ...settings,
                  savingsPot: currentPot - amount
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
              console.error('Failed to spend from savings:', error);
              alert('Failed to spend from savings. Please try again.');
            }
          }}
          className="flex-1 bg-amber-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1"
          title={`Spend from savings pot (${(settings.savingsPot || 0).toFixed(2)} AED available) - Uses selected category`}
        >
          <FromSavingsIcon className="w-4 h-4" />
          From Savings
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;