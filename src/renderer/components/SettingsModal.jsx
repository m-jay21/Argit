import React, { useState, useEffect } from 'react';
import { XIcon, SettingsIcon } from './icons';
import { getAllThemes } from '../themes';

function SettingsModal({ isOpen, onClose, currentTheme, onThemeChange, settings, onUpdateSettings }) {
  const [payDay, setPayDay] = useState(settings?.payDay || 1);
  
  useEffect(() => {
    if (settings?.payDay !== undefined) {
      setPayDay(settings.payDay);
    }
  }, [settings?.payDay]);

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
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
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

