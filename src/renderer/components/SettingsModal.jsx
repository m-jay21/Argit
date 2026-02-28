import React, { useState, useEffect } from 'react';
import { XIcon, SettingsIcon } from './icons';
import { getAllThemes } from '../themes';
import { createDefaultBudgetConfig } from '../utils/budgetHelpers';
import { getOrdinalDay } from '../utils/calculations';

function SettingsModal({ isOpen, onClose, currentTheme, onThemeChange, settings, onUpdateSettings, onResetAllData }) {
  const [payDay, setPayDay] = useState(settings?.payDay || 1);
  const [currency, setCurrency] = useState(settings?.currency || 'USD');
  const [customThemePath, setCustomThemePath] = useState(settings?.customThemePath || null);
  
  useEffect(() => {
    if (settings?.payDay !== undefined) {
      setPayDay(settings.payDay);
    }
  }, [settings?.payDay]);

  useEffect(() => {
    if (settings?.currency !== undefined) {
      setCurrency(settings.currency);
    }
  }, [settings?.currency]);

  useEffect(() => {
    if (settings?.customThemePath !== undefined) {
      setCustomThemePath(settings.customThemePath);
    }
  }, [settings?.customThemePath]);

  if (!isOpen) return null;

  const themes = getAllThemes();

  const handleThemeSelect = (themeId) => {
    onThemeChange(themeId);
  };

  const handlePayDayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= 31) {
      setPayDay(value);
    }
  };

  const handlePayDayBlur = async () => {
    if (payDay >= 1 && payDay <= 31 && onUpdateSettings) {
      await onUpdateSettings({
        ...settings,
        payDay: payDay
      });
    }
  };

  const handleDone = async () => {
    if (onUpdateSettings) {
      await onUpdateSettings({
        ...settings,
        payDay: payDay >= 1 && payDay <= 31 ? payDay : settings?.payDay ?? 1,
        currency,
        customThemePath: customThemePath ?? settings?.customThemePath ?? null
      });
    }
    onClose();
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    if (onUpdateSettings) {
      await onUpdateSettings({
        ...settings,
        currency: newCurrency
      });
    }
  };

  const handleSelectCustomThemeFile = async () => {
    if (!window.electronAPI || !window.electronAPI.selectCustomThemeFile) {
      return;
    }
    
    try {
      const result = await window.electronAPI.selectCustomThemeFile();
      if (result.success && result.filePath && onUpdateSettings) {
        setCustomThemePath(result.filePath);
        await onUpdateSettings({
          ...settings,
          customThemePath: result.filePath
        });
        // Reinitialize watcher in main process
        if (window.electronAPI && window.electronAPI.reinitializeCustomThemeWatcher) {
          await window.electronAPI.reinitializeCustomThemeWatcher();
        }
        // Reload theme if custom is active
        if (currentTheme === 'custom') {
          onThemeChange('custom');
        }
      }
    } catch (error) {
      console.error('Error selecting custom theme file:', error);
    }
  };

  const handleFreshStart = async () => {
    // Confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to reset everything?\n\n' +
      'This will:\n' +
      '• Clear all transactions\n' +
      '• Clear all subscriptions\n' +
      '• Reset budget to default configuration\n' +
      '• Clear all savings goals\n' +
      '• Reset balance and savings pot to 0\n' +
      '• Clear pay day processing history\n\n' +
      'Your theme, currency, and pay day settings will be preserved.\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) {
      return;
    }

    try {
      if (!onResetAllData) {
        alert('Reset functionality not available');
        return;
      }

      // Clear all transactions
      await onResetAllData.updateTransactions([]);

      // Clear all subscriptions
      await onResetAllData.updateSubscriptions([]);

      // Reset budget config to default (fresh start)
      const defaultBudgetConfig = createDefaultBudgetConfig();
      await onResetAllData.updateBudgetConfig(defaultBudgetConfig);

      // Clear all savings goals
      await onResetAllData.updateSavingsGoals([]);

      // Reset settings - preserve theme, currency, payDay, customThemePath
      await onUpdateSettings({
        ...settings,
        startingBalance: 0,
        savingsPot: 0,
        lastProcessedPayDay: null,
        lastProcessedMonth: null,
        transfersFromSavings: 0
      });

      alert('Fresh start complete! All data has been reset.');
      onClose();
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6 w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-accent-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            title="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-6">
          {/* Theme Section */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-3">Theme</h4>
            <div className="space-y-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    currentTheme === theme.id
                      ? 'border-accent-primary bg-accent-primary bg-opacity-10'
                      : 'border-border-input hover:border-accent-primary hover:bg-bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{theme.name}</span>
                    {currentTheme === theme.id && (
                      <span className="text-xs text-accent-primary font-semibold">Active</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Custom Theme Path Selector - Only show when Custom theme is selected */}
            {currentTheme === 'custom' && (
              <div className="mt-4 pt-4 border-t border-border-light">
                <h5 className="text-xs font-medium text-text-primary mb-2">Custom Theme File</h5>
                <p className="text-xs text-text-secondary mb-3">
                  Select a btop theme file (.theme) to use for the Custom theme. The app will read colors from this file and update in real-time when the file changes. The file format should be: <code className="text-xs bg-bg-accent px-1 rounded">theme[key]=#color</code>
                </p>
                <div className="space-y-2">
                  {customThemePath && (
                    <div className="px-3 py-2 bg-bg-accent rounded-md">
                      <p className="text-xs text-text-secondary mb-1">Current file:</p>
                      <p className="text-xs text-text-primary font-mono break-all">{customThemePath}</p>
                    </div>
                  )}
                  <button
                    onClick={handleSelectCustomThemeFile}
                    className="w-full px-4 py-2 bg-accent-primary text-white rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
                  >
                    {customThemePath ? 'Change Theme File' : 'Select Theme File'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Currency Section */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">Currency</h4>
            <p className="text-xs text-text-secondary mb-3">
              Change the currency symbol displayed throughout the app. This only affects the display format, not the actual values.
            </p>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="w-full px-3 py-2 bg-bg-secondary text-text-primary border border-border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="AED">AED - UAE Dirham (د.إ)</option>
              <option value="JPY">JPY - Japanese Yen (¥)</option>
              <option value="CAD">CAD - Canadian Dollar (C$)</option>
              <option value="AUD">AUD - Australian Dollar (A$)</option>
              <option value="CHF">CHF - Swiss Franc (CHF)</option>
              <option value="CNY">CNY - Chinese Yuan (¥)</option>
              <option value="INR">INR - Indian Rupee (₹)</option>
            </select>
          </div>

          {/* Pay Day Section */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-1">Pay Day</h4>
            <p className="text-xs text-text-secondary mb-3">
              Set the recurring date when your balance resets and transfers to savings. This happens automatically on or after this day each month.
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="payDay" className="text-sm text-text-secondary whitespace-nowrap">
                Day of month:
              </label>
              <input
                id="payDay"
                type="number"
                min="1"
                max="31"
                value={payDay}
                onChange={handlePayDayChange}
                onBlur={handlePayDayBlur}
                className="flex-1 px-3 py-2 bg-bg-secondary text-text-primary border border-border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
            {payDay >= 1 && payDay <= 31 && (
              <p className="text-xs text-accent-primary mt-2 font-medium" role="status">
                Balance will reset on the {getOrdinalDay(payDay)} of each month.
              </p>
            )}
          </div>

          {/* Fresh Start Section */}
          <div className="pt-4 border-t border-border-light">
            <h4 className="text-sm font-medium text-text-primary mb-1">Fresh Start</h4>
            <p className="text-xs text-text-secondary mb-3">
              Reset all your financial data to start fresh. This will clear all transactions, subscriptions, savings goals, and reset your balance to zero. Your theme, currency, and pay day settings will be preserved.
            </p>
            <button
              onClick={handleFreshStart}
              className="w-full px-4 py-2 bg-error-color text-white rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              Reset Everything
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleDone}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;

