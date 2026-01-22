import { useState, useEffect } from 'react';
import { createDefaultBudgetConfig } from '../utils/budgetHelpers';

// Custom hook for handling data persistence through Electron
export function useLocalStorage() {
  const [data, setData] = useState({
    transactions: [],
    subscriptions: [],
    budgetConfig: createDefaultBudgetConfig(),
    savingsGoals: [],
    settings: {
      startingBalance: 0,
      currency: 'USD',
      theme: 'cozy',
      lastProcessedMonth: null,
      payDay: 1,
      lastProcessedPayDay: null,
      savingsPot: 0,
      transfersFromSavings: 0,
      customThemePath: null
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        let loadedData;
        if (window.electronAPI) {
          // Running in Electron - use IPC
          loadedData = await window.electronAPI.getAppData();
        } else {
          // Running in browser - use localStorage fallback
          const savedData = localStorage.getItem('money-manager-data');
          if (savedData) {
            loadedData = JSON.parse(savedData);
          }
        }

        // Ensure all required properties exist with proper defaults
        const mergedData = {
          transactions: loadedData?.transactions || [],
          subscriptions: loadedData?.subscriptions || [],
          budgetConfig: loadedData?.budgetConfig || createDefaultBudgetConfig(),
          savingsGoals: loadedData?.savingsGoals || [],
          settings: {
            startingBalance: 0,
            currency: 'USD',
            theme: 'cozy',
            payDay: 1,
            savingsPot: 0,
            transfersFromSavings: 0,
            ...(loadedData?.settings || {})
          }
        };

        setData(mergedData);
      } catch (error) {
        console.error('Failed to load data:', error);
        // On error, ensure we have valid default data
        setData({
          transactions: [],
          subscriptions: [],
          budgetConfig: createDefaultBudgetConfig(),
          savingsGoals: [],
          settings: {
            startingBalance: 0,
            currency: 'USD',
            theme: 'cozy',
            payDay: 1,
            savingsPot: 0,
            transfersFromSavings: 0,
            customThemePath: null
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data function with improved error handling
  const saveData = async (newData) => {
    try {
      
      // Validate data before saving
      if (!validateDataStructure(newData)) {
        throw new Error('Invalid data structure - cannot save');
      }
      
      if (window.electronAPI) {
        // Running in Electron - use IPC
        const result = await window.electronAPI.saveAppData(newData);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to save data');
        }
      } else {
        // Running in browser - use localStorage fallback
        try {
          localStorage.setItem('money-manager-data', JSON.stringify(newData));
        } catch (storageError) {
          // Handle localStorage quota exceeded
          if (storageError.name === 'QuotaExceededError') {
            throw new Error('Storage quota exceeded. Please clear some data.');
          }
          throw storageError;
        }
      }
      
      setData(newData);
      return { success: true };
    } catch (error) {
      console.error('Failed to save data:', error);
      
      // Show user-friendly error message
      if (error.message.includes('quota')) {
        alert('Storage is full! Please clear some data or use a different browser.');
      } else if (error.message.includes('Invalid data')) {
        alert('Data validation failed. Please refresh the app.');
      } else {
        alert(`Failed to save data: ${error.message}`);
      }
      
      return { success: false, error: error.message };
    }
  };

  // Data validation function (client-side)
  const validateDataStructure = (data) => {
    try {
      if (typeof data !== 'object' || data === null) return false;
      
      const requiredProps = ['transactions', 'subscriptions', 'settings'];
      for (const prop of requiredProps) {
        if (!(prop in data)) return false;
      }
      
      if (!Array.isArray(data.transactions)) return false;
      if (!Array.isArray(data.subscriptions)) return false;
      if (typeof data.settings !== 'object' || data.settings === null) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  };

  // Helper function to get fresh data from storage to avoid race conditions
  const getFreshData = async () => {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.getAppData();
      } else {
        const stored = localStorage.getItem('money-manager-data');
        return stored ? JSON.parse(stored) : data;
      }
    } catch (error) {
      console.warn('Failed to get fresh data, using current state:', error);
      return data;
    }
  };

  // Helper functions for updating specific parts of data
  const updateTransactions = async (transactions) => {
    const newData = { ...data, transactions };
    const result = await saveData(newData);
    return result;
  };

  const updateSubscriptions = (subscriptions) => {
    const newData = { ...data, subscriptions };
    return saveData(newData);
  };

  const updateSettings = async (settings) => {
    const freshData = await getFreshData();
    const newData = { ...freshData, settings: { ...freshData.settings, ...settings } };
    return saveData(newData);
  };

  const updateBudgetConfig = (budgetConfig) => {
    const newData = { ...data, budgetConfig };
    return saveData(newData);
  };

  const updateSavingsGoals = async (savingsGoals) => {
    const freshData = await getFreshData();
    const newData = { ...freshData, savingsGoals };
    return saveData(newData);
  };

  return {
    data,
    isLoading,
    saveData,
    updateTransactions,
    updateSubscriptions,
    updateSettings,
    updateBudgetConfig,
    updateSavingsGoals
  };
}