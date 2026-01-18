// Theme registry - export all available themes
import { cozyTheme } from './cozy';
import { darkTheme } from './dark';
import { lightTheme } from './light';
import { caelestiaTheme, mapBtopColorsToTheme } from './caelestia';

export const themes = {
  cozy: cozyTheme,
  dark: darkTheme,
  light: lightTheme,
  caelestia: caelestiaTheme
};

export { cozyTheme, darkTheme, lightTheme, caelestiaTheme, mapBtopColorsToTheme };

// Get theme by ID
export function getTheme(themeId) {
  return themes[themeId] || themes.cozy;
}

// Get all available themes
export function getAllThemes() {
  return Object.values(themes);
}

