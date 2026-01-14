import React, { useState } from 'react';
import { ManageCategoriesIcon, EditIcon, DeleteIcon, PlusIcon, SaveIcon, XIcon, HelpTextIcon } from './icons';
import { canDeleteCategory, PROTECTED_CATEGORIES } from '../utils/budgetHelpers';

function CategoryManagement({
  budgetConfig,
  transactions,
  onUpdateBudgetConfig
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleStartEdit = (category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const handleSaveEdit = () => {
    if (editName.trim() &&
        budgetConfig &&
        budgetConfig.categories &&
        !budgetConfig.categories.find(cat => cat.name === editName.trim() && cat.id !== editingCategory)) {
      const updatedCategories = budgetConfig.categories.map(cat =>
        cat.id === editingCategory
          ? { ...cat, name: editName.trim() }
          : cat
      );

      onUpdateBudgetConfig({
        ...budgetConfig,
        categories: updatedCategories
      });

      setEditingCategory(null);
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  const handleDeleteCategory = (categoryId, categoryName) => {
    if (!budgetConfig || !budgetConfig.categories) return;

    const deleteCheck = canDeleteCategory(categoryName, transactions);

    if (deleteCheck.canDelete) {
      if (window.confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
        const updatedCategories = budgetConfig.categories.filter(cat => cat.id !== categoryId);
        onUpdateBudgetConfig({
          ...budgetConfig,
          categories: updatedCategories
        });
      }
    } else {
      alert(`Cannot delete category: ${deleteCheck.reason}`);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() &&
        budgetConfig &&
        budgetConfig.categories &&
        !budgetConfig.categories.find(cat => cat.name === newCategoryName.trim())) {
      const newCategory = {
        id: `cat_${newCategoryName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        name: newCategoryName.trim(),
        percentage: 0,
        budgetAmount: 0,
        spentAmount: 0,
        remainingAmount: 0,
        isActive: true
      };

      onUpdateBudgetConfig({
        ...budgetConfig,
        categories: [...budgetConfig.categories, newCategory]
      });

      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const getTransactionCount = (categoryName) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transaction.category === categoryName &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    }).length;
  };

  const getCategoryStatus = (category) => {
    const transactionCount = getTransactionCount(category.name);
    if (transactionCount > 0) return { text: 'Active', color: 'text-green-600' };
    if (category.percentage > 0) return { text: 'Budgeted', color: 'text-blue-600' };
    return { text: 'Unused', color: 'text-gray-500' };
  };

  return (
    <div className="space-y-5">
      {/* Category Management Header */}
      <div className="bg-bg-secondary border border-border-light p-4 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center">
            <ManageCategoriesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Manage Categories</h2>
            <p className="text-sm text-text-secondary">
              Add, edit, or remove transaction categories
            </p>
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Category</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Status</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Transactions</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Budget %</th>
                <th className="text-left py-2 text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(budgetConfig?.categories || []).map((category) => {
                const status = getCategoryStatus(category);
                const transactionCount = getTransactionCount(category.name);
                const deleteCheck = canDeleteCategory(category.name, transactions);

                return (
                  <tr key={category.id} className="border-b border-border-light/50">
                    <td className="py-3">
                      {editingCategory === category.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 text-sm border border-border-input rounded focus:outline-none focus:border-accent-primary"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{category.name}</span>
                          {PROTECTED_CATEGORIES.includes(category.name) && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              Protected
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-text-primary">
                        {transactionCount} this month
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-text-primary">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {editingCategory === category.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save changes"
                            >
                              <SaveIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="Cancel editing"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(category)}
                              disabled={PROTECTED_CATEGORIES.includes(category.name)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit category"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              disabled={!deleteCheck.canDelete}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title={deleteCheck.canDelete ? "Delete category" : deleteCheck.reason}
                            >
                              <DeleteIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Add Category Row */}
              {showAddCategory ? (
                <tr className="border-b border-border-light/50">
                  <td className="py-3" colSpan="5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="px-3 py-2 text-sm border border-border-input rounded focus:outline-none focus:border-accent-primary flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <button
                        onClick={handleAddCategory}
                        className="px-3 py-2 bg-accent-primary text-white text-sm rounded hover:bg-opacity-90"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCategory(false);
                          setNewCategoryName('');
                        }}
                        className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-opacity-90"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="py-3" colSpan="5">
                    <button
                      onClick={() => setShowAddCategory(true)}
                      className="flex items-center gap-2 text-sm text-accent-primary hover:underline"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add New Category
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <HelpTextIcon className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Category Management Rules:</p>
              <ul className="text-xs space-y-1">
                <li>• Cannot delete categories that have existing transactions</li>
                <li>• "Income" and "Subscription" categories are protected system categories</li>
                <li>• Category names must be unique</li>
                <li>• New categories are automatically available in transaction forms</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryManagement;