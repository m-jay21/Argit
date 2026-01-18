import React from 'react';
import { XIcon, SettingsIcon } from './icons';
import { getAllThemes } from '../themes';

function SettingsModal({ isOpen, onClose, currentTheme, onThemeChange }) {
  if (!isOpen) return null;

  const themes = getAllThemes();

  const handleThemeSelect = (themeId) => {
    onThemeChange(themeId);
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

