import React, { useState } from 'react';
import { PlusIcon } from './icons';
import { getNextBillDate } from '../utils/dateHelpers';
import { validateAmount, validateBillDate } from '../utils/calculations';

function SubscriptionForm({ onAddSubscription }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || !formData.billDate) {
      return;
    }

    const amount = parseFloat(formData.amount);
    const billDate = parseInt(formData.billDate);

    if (!validateAmount(amount) || !validateBillDate(billDate)) {
      return;
    }

    onAddSubscription({
      ...formData,
      amount,
      billDate,
      nextBillDate: getNextBillDate(billDate)
    });

    // Reset form
    setFormData({
      name: '',
      amount: '',
      billDate: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Netflix, Spotify..."
          className="bg-white border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary flex-1 min-w-32"
          required
        />
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="50.00"
          className="bg-white border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary w-24"
          required
        />
        <input
          type="number"
          name="billDate"
          value={formData.billDate}
          onChange={handleChange}
          min="1"
          max="31"
          placeholder="Day (15)"
          className="bg-white border border-border-input px-3 py-2 rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary w-28"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-button-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-button-hover transition-colors flex items-center gap-1"
      >
        <PlusIcon className="w-4 h-4" />
        Add Subscription
      </button>
    </form>
  );
}

export default SubscriptionForm;