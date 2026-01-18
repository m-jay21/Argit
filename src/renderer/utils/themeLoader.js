// Theme loader utility - dynamically loads and applies themes
import { getTheme } from '../themes';

let currentTheme = null;

/**
 * Loads a theme and applies it to the document
 * @param {string} themeId - The ID of the theme to load (e.g., 'cozy', 'dark', 'light')
 */
export function loadTheme(themeId) {
  const theme = getTheme(themeId);
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
export function initTheme(themeId = 'cozy') {
  return loadTheme(themeId);
}

