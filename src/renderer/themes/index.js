// Theme registry - export all available themes
import { cozyTheme } from './cozy';
import { darkTheme } from './dark';
import { caelestiaTheme, mapBtopColorsToTheme } from './caelestia';

export const themes = {
  cozy: cozyTheme,
  dark: darkTheme,
  caelestia: caelestiaTheme
};

export { cozyTheme, darkTheme, caelestiaTheme, mapBtopColorsToTheme };

// Get theme by ID
export function getTheme(themeId) {
  return themes[themeId] || themes.cozy;
}

// Get all available themes
export function getAllThemes() {
  return Object.values(themes);
}

