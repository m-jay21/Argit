const { app, BrowserWindow, nativeTheme, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { parseBtopThemeFile } = require('./utils/btopThemeParser');

let mainWindow;
let caelestiaThemeWatcher = null;

// Caelestia theme file path - using user's home directory
const CAELESTIA_THEME_PATH = process.env.HOME 
  ? path.join(process.env.HOME, '.config', 'btop', 'themes', 'caelestia.theme')
  : path.join(require('os').homedir(), '.config', 'btop', 'themes', 'caelestia.theme');

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
  
  // Setup Caelestia theme watcher after window is created
  setupCaelestiaThemeWatcher();
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
        savingsPot: 0
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
        savingsPot: 0
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

// Caelestia theme IPC handlers
ipcMain.handle('read-caelestia-theme', async () => {
  try {
    // Check if file exists
    try {
      await fs.access(CAELESTIA_THEME_PATH);
    } catch {
      console.warn('Caelestia theme file not found:', CAELESTIA_THEME_PATH);
      return null;
    }
    const content = await fs.readFile(CAELESTIA_THEME_PATH, 'utf-8');
    return parseBtopThemeFile(content);
  } catch (error) {
    console.error('Error reading Caelestia theme:', error);
    return null;
  }
});

// Setup file watcher for Caelestia theme
function setupCaelestiaThemeWatcher() {
  // Check if file exists
  fs.access(CAELESTIA_THEME_PATH).then(() => {
    // File exists, set up watcher
    if (caelestiaThemeWatcher) {
      fsSync.unwatchFile(CAELESTIA_THEME_PATH, caelestiaThemeWatcher);
    }
    
    caelestiaThemeWatcher = fsSync.watchFile(CAELESTIA_THEME_PATH, { interval: 1000 }, async (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        // File changed, notify renderer
        try {
          const content = await fs.readFile(CAELESTIA_THEME_PATH, 'utf-8');
          const colors = parseBtopThemeFile(content);
          if (mainWindow && !mainWindow.isDestroyed() && colors) {
            mainWindow.webContents.send('caelestia-theme-updated', colors);
          }
        } catch (error) {
          console.error('Error handling Caelestia theme update:', error);
        }
      }
    });
    
    console.log('Caelestia theme watcher initialized');
  }).catch(() => {
    console.warn('Caelestia theme file not found, skipping watcher:', CAELESTIA_THEME_PATH);
  });
}
