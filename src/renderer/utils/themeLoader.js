// Theme loader utility - dynamically loads and applies themes
import { getTheme, mapBtopColorsToTheme } from '../themes';

let currentTheme = null;

/**
 * Loads a theme and applies it to the document
 * @param {string} themeId - The ID of the theme to load (e.g., 'cozy', 'dark', 'light', 'caelestia')
 * @param {Object} dynamicColors - Optional dynamic colors for Caelestia theme
 */
export async function loadTheme(themeId, dynamicColors = null) {
  let theme = getTheme(themeId);
  
  // If Caelestia theme, load colors from file or use provided dynamic colors
  if (themeId === 'caelestia') {
    if (dynamicColors) {
      // Use provided dynamic colors
      theme = {
        ...theme,
        colors: mapBtopColorsToTheme(dynamicColors)
      };
    } else if (window.electronAPI && window.electronAPI.readCaelestiaTheme) {
      // Load colors from file via IPC
      try {
        const btopColors = await window.electronAPI.readCaelestiaTheme();
        if (btopColors) {
          theme = {
            ...theme,
            colors: mapBtopColorsToTheme(btopColors)
          };
        }
      } catch (error) {
        console.error('Failed to load Caelestia theme:', error);
      }
    }
  }
  
  currentTheme = theme;
  
  // Apply theme via CSS custom properties
  const root = document.documentElement;
  
  // Apply all color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply box shadows
  Object.entries(theme.boxShadow).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
  
  // Apply scrollbar colors dynamically
  root.style.setProperty('--scrollbar-track', theme.colors['bg-secondary'] || '#fbf8f4');
  root.style.setProperty('--scrollbar-thumb', theme.colors['border-input'] || '#d9cfc4');
  root.style.setProperty('--scrollbar-thumb-hover', theme.colors['accent-primary'] || '#c8a882');
  
  // Update Tailwind config if available
  if (window.updateTailwindTheme) {
    window.updateTailwindTheme(theme.colors, theme.boxShadow);
  } else if (window.tailwind && window.tailwind.config) {
    // Fallback: Update Tailwind's theme colors directly
    window.tailwind.config.theme.extend.colors = theme.colors;
    window.tailwind.config.theme.extend.boxShadow = theme.boxShadow;
    window.tailwind.config.theme.extend.fontFamily = theme.fontFamily;
  }
  
  // Store current theme ID in data attribute for CSS selectors
  root.setAttribute('data-theme', themeId);
  
  return theme;
}

/**
 * Gets the currently loaded theme
 */
export function getCurrentTheme() {
  return currentTheme;
}

/**
 * Initializes the theme system - should be called on app load
 */
export async function initTheme(themeId = 'cozy') {
  return await loadTheme(themeId);
}

/**
 * Updates Caelestia theme with new colors (called when file changes)
 * @param {Object} btopColors - Colors from btop theme file
 */
export function updateCaelestiaTheme(btopColors) {
  if (currentTheme && currentTheme.id === 'caelestia') {
    const updatedTheme = {
      ...currentTheme,
      colors: mapBtopColorsToTheme(btopColors)
    };
    currentTheme = updatedTheme;
    
    // Apply updated theme
    const root = document.documentElement;
    Object.entries(updatedTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    if (window.updateTailwindTheme) {
      window.updateTailwindTheme(updatedTheme.colors, updatedTheme.boxShadow);
    }
  }
}

