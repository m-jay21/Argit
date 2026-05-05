const { app, BrowserWindow, nativeTheme, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { parseBtopThemeFile } = require('./utils/btopThemeParser');

let mainWindow;
let customThemeWatcher = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Load app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Handle theme changes
  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mainWindow.webContents.send('theme-changed', theme);
  });
  
  // Setup Custom theme watcher after window is created
  setupCustomThemeWatcher();
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for data operations with improved reliability
ipcMain.handle('get-app-data', async () => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'argit-data.json');
    const backupPath = path.join(app.getPath('userData'), 'argit-data.backup.json');
    
    // Try to read main file first
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const parsedData = JSON.parse(data);
      
      // Validate data structure
      if (validateDataStructure(parsedData)) {
        return parsedData;
      } else {
        console.warn('Main data file corrupted, trying backup...');
        throw new Error('Invalid data structure');
      }
    } catch (mainError) {
      // Try backup file
      try {
        const backupData = await fs.readFile(backupPath, 'utf8');
        const parsedBackup = JSON.parse(backupData);
        
        if (validateDataStructure(parsedBackup)) {
          console.log('Restored from backup file');
          // Restore backup to main file
          await fs.writeFile(dataPath, JSON.stringify(parsedBackup, null, 2));
          return parsedBackup;
        }
      } catch (backupError) {
        console.warn('Both main and backup files corrupted');
      }
    }
    
    // Return default data if all else fails
    return {
      transactions: [],
      subscriptions: [],
      budgetConfig: {
        monthlyIncome: 0,
        categories: [],
        totalAllocatedPercentage: 0,
        availableForSavings: 100,
        lastUpdated: new Date().toISOString()
      },
      savingsGoals: [],
      settings: {
        startingBalance: 0,
        currency: 'AED',
        theme: 'system',
        payDay: 1,
        lastProcessedPayDay: null,
        lastProcessedMonth: null,
        savingsPot: 0,
        transfersFromSavings: 0
      }
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    return {
      transactions: [],
      subscriptions: [],
      budgetConfig: {
        monthlyIncome: 0,
        categories: [],
        totalAllocatedPercentage: 0,
        availableForSavings: 100,
        lastUpdated: new Date().toISOString()
      },
      savingsGoals: [],
      settings: {
        startingBalance: 0,
        currency: 'AED',
        theme: 'system',
        payDay: 1,
        lastProcessedPayDay: null,
        lastProcessedMonth: null,
        savingsPot: 0,
        transfersFromSavings: 0
      }
    };
  }
});

ipcMain.handle('save-app-data', async (event, data) => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'argit-data.json');
    const tempPath = path.join(app.getPath('userData'), 'argit-data.temp.json');
    const backupPath = path.join(app.getPath('userData'), 'argit-data.backup.json');
    
    // Validate data before saving
    if (!validateDataStructure(data)) {
      return { success: false, error: 'Invalid data structure' };
    }
    
    // Create backup of current data
    try {
      const currentData = await fs.readFile(dataPath, 'utf8');
      await fs.writeFile(backupPath, currentData);
    } catch (backupError) {
      // Backup creation failed, but continue with save
      console.warn('Failed to create backup:', backupError);
    }
    
    // Write to temporary file first (atomic operation)
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(tempPath, jsonData);
    
    // Atomic move from temp to main file
    await fs.rename(tempPath, dataPath);
    
    return { success: true };
  } catch (error) {
    // Clean up temp file if it exists
    try {
      const tempPath = path.join(app.getPath('userData'), 'argit-data.temp.json');
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return { success: false, error: error.message };
  }
});

// Handle transaction backup saving
ipcMain.handle('save-transaction-backup', async (event, fileName, content) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'transaction-backups');
    
    // Create backup directory if it doesn't exist
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (mkdirError) {
      // Directory might already exist, ignore error
    }
    
    const filePath = path.join(backupDir, fileName);
    await fs.writeFile(filePath, content, 'utf8');
    
    return { 
      success: true, 
      filePath: filePath 
    };
  } catch (error) {
    console.error('Error saving transaction backup:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Data validation function
function validateDataStructure(data) {
  try {
    // Check if data is an object
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    // Check required properties
    const requiredProps = ['transactions', 'subscriptions', 'settings'];
    for (const prop of requiredProps) {
      if (!(prop in data)) {
        return false;
      }
    }
    
    // Validate transactions array
    if (!Array.isArray(data.transactions)) {
      return false;
    }
    
    // Validate subscriptions array
    if (!Array.isArray(data.subscriptions)) {
      return false;
    }
    
    // Validate settings object
    if (typeof data.settings !== 'object' || data.settings === null) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

ipcMain.handle('get-system-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// Helper function to get custom theme path from settings
async function getCustomThemePath() {
  try {
    const dataPath = path.join(app.getPath('userData'), 'argit-data.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const parsedData = JSON.parse(data);
    return parsedData?.settings?.customThemePath || null;
  } catch (error) {
    return null;
  }
}

// Custom theme IPC handlers
ipcMain.handle('read-custom-theme', async () => {
  try {
    const themePath = await getCustomThemePath();
    if (!themePath) {
      return null;
    }
    
    // Check if file exists
    try {
      await fs.access(themePath);
    } catch {
      console.warn('Custom theme file not found:', themePath);
      return null;
    }
    const content = await fs.readFile(themePath, 'utf-8');
    return parseBtopThemeFile(content);
  } catch (error) {
    console.error('Error reading Custom theme:', error);
    return null;
  }
});

// File dialog for selecting custom theme file
ipcMain.handle('select-custom-theme-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select btop Theme File',
      filters: [
        { name: 'btop Theme Files', extensions: ['theme'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    
    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    console.error('Error selecting theme file:', error);
    return { success: false, error: error.message };
  }
});

// Setup file watcher for Custom theme
async function setupCustomThemeWatcher() {
  // Stop existing watcher if any
  if (customThemeWatcher) {
    const oldPath = await getCustomThemePath();
    if (oldPath) {
      try {
        fsSync.unwatchFile(oldPath, customThemeWatcher);
      } catch (e) {
        // Ignore errors
      }
    }
    customThemeWatcher = null;
  }
  
  const themePath = await getCustomThemePath();
  if (!themePath) {
    return;
  }
  
  // Check if file exists
  try {
    await fs.access(themePath);
  } catch {
    console.warn('Custom theme file not found, skipping watcher:', themePath);
    return;
  }
  
  customThemeWatcher = fsSync.watchFile(themePath, { interval: 1000 }, async (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      // File changed, notify renderer
      try {
        const content = await fs.readFile(themePath, 'utf-8');
        const colors = parseBtopThemeFile(content);
        if (mainWindow && !mainWindow.isDestroyed() && colors) {
          mainWindow.webContents.send('custom-theme-updated', colors);
        }
      } catch (error) {
        console.error('Error handling Custom theme update:', error);
      }
    }
  });
  
  console.log('Custom theme watcher initialized for:', themePath);
}

// IPC handler to reinitialize watcher (called when custom theme path changes)
ipcMain.handle('reinitialize-custom-theme-watcher', async () => {
  await setupCustomThemeWatcher();
  return { success: true };
});
