// Theme registry - export all available themes
import { cozyTheme } from './cozy';
import { darkTheme } from './dark';
import { lightTheme } from './light';

export const themes = {
  cozy: cozyTheme,
  dark: darkTheme,
  light: lightTheme
};

export { cozyTheme, darkTheme, lightTheme };

// Get theme by ID
export function getTheme(themeId) {
  return themes[themeId] || themes.cozy;
}

// Get all available themes
export function getAllThemes() {
  return Object.values(themes);
}

