const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Data operations
  getAppData: () => ipcRenderer.invoke('get-app-data'),
  saveAppData: (data) => ipcRenderer.invoke('save-app-data', data),
  saveTransactionBackup: (fileName, content) => ipcRenderer.invoke('save-transaction-backup', fileName, content),

  // Theme operations
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', callback),

  // Platform info
  platform: process.platform,

  // Remove theme change listener
  removeThemeListener: (callback) => ipcRenderer.removeListener('theme-changed', callback)
});