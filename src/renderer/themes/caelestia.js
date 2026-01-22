// Custom Theme - Dynamic theme loaded from btop theme file
// Colors are populated dynamically from a user-selected btop theme file

/**
 * Darken a hex color by mixing it with black
 * @param {string} hex - Hex color (e.g., '#ffdb96')
 * @param {number} amount - Amount to darken (0-1, where 0.4 = 40% darker)
 * @returns {string} Darkened hex color
 */
function darkenColor(hex, amount = 0.4) {
  if (!hex || !hex.startsWith('#')) return hex;
  
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Mix with black (0, 0, 0)
  const newR = Math.floor(r * (1 - amount));
  const newG = Math.floor(g * (1 - amount));
  const newB = Math.floor(b * (1 - amount));
  
  // Convert back to hex
  return `#${[newR, newG, newB].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

/**
 * Desaturate a hex color (reduce color intensity)
 * @param {string} hex - Hex color
 * @param {number} amount - Amount to desaturate (0-1, where 0.3 = 30% less saturated)
 * @returns {string} Desaturated hex color
 */
function desaturateColor(hex, amount = 0.3) {
  if (!hex || !hex.startsWith('#')) return hex;
  
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Convert to grayscale
  const gray = r * 0.299 + g * 0.587 + b * 0.114;
  
  // Mix original with grayscale
  const newR = Math.floor(r * (1 - amount) + gray * amount);
  const newG = Math.floor(g * (1 - amount) + gray * amount);
  const newB = Math.floor(b * (1 - amount) + gray * amount);
  
  return `#${[newR, newG, newB].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

/**
 * Adjust color for dark backgrounds: darken and slightly desaturate
 * @param {string} hex - Hex color
 * @returns {string} Adjusted color
 */
function adjustForDarkBg(hex) {
  if (!hex || !hex.startsWith('#')) return hex;
  // First darken, then slightly desaturate for better readability
  return desaturateColor(darkenColor(hex, 0.35), 0.15);
}

/**
 * Lighten a hex color by mixing it with white
 * @param {string} hex - Hex color
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {string} Lightened hex color
 */
function lightenColor(hex, amount = 0.2) {
  if (!hex || !hex.startsWith('#')) return hex;
  
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Mix with white (255, 255, 255)
  const newR = Math.floor(r + (255 - r) * amount);
  const newG = Math.floor(g + (255 - g) * amount);
  const newB = Math.floor(b + (255 - b) * amount);
  
  return `#${[newR, newG, newB].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

// Default colors (fallback if file not found)
const defaultCaelestiaColors = {
  // Background colors
  'bg-primary': '#11140f',
  'bg-secondary': '#1d211b',
  'bg-accent': '#2a2f26',
  'text-primary': '#e0e4da',
  'text-secondary': '#a1a1aa',
  'text-tertiary': '#8c9387',
  'accent-primary': '#a4d397',
  'accent-secondary': '#6dcfa6',
  'button-primary': '#a4d397', // Same as accent-primary for Caelestia
  'button-hover': '#6dcfa6',
  'success-color': '#a4d397', // Same as accent-primary for Caelestia
  'error-color': '#6dcfa6', // Alt color for Add Expense and From Savings
  'info-color': '#5bd0df', // Info color for informational text (savings pot, etc.)
  'border-color': '#2a2f26',
  'border-light': '#3a3f36',
  'border-input': '#2a2f26',
  'shadow-light': 'rgba(0,0,0,0.5)',
  'shadow-accent': 'rgba(164,211,151,0.2)',
  
  // Gray scale
  'gray-50': '#18181b',
  'gray-100': '#27272a',
  'gray-200': '#3f3f46',
  'gray-300': '#52525b',
  'gray-400': '#71717a',
  'gray-500': '#a1a1aa',
  'gray-600': '#d4d4d8',
  'gray-700': '#e4e4e7',
  'gray-800': '#f4f4f5',
  'gray-900': '#fafafa',
  
  // Blue scale
  'blue-50': '#1e3a5f',
  'blue-100': '#1e40af',
  'blue-200': '#2563eb',
  'blue-600': '#5bd0df',
  'blue-700': '#93c5fd',
  'blue-800': '#bfdbfe',
  
  // Green scale
  'green-50': '#064e3b',
  'green-100': '#065f46',
  'green-400': '#a4d397',
  'green-600': '#6dcfa6',
  'green-700': '#059669',
  'green-800': '#047857',
  'green-900': '#065f46',
  
  // Red scale
  'red-50': '#7f1d1d',
  'red-100': '#991b1b',
  'red-200': '#b91c1c',
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  'red-800': '#991b1b',
  
  // Yellow scale
  'yellow-50': '#78350f',
  'yellow-100': '#92400e',
  'yellow-200': '#b45309',
  'yellow-400': '#facc15',
  'yellow-500': '#eab308',
  'yellow-600': '#ca8a04',
  'yellow-700': '#a16207',
  'yellow-800': '#854d0e',
  
  // Purple scale
  'purple-50': '#581c87',
  'purple-100': '#6b21a8',
  'purple-200': '#7e22ce',
  'purple-400': '#c084fc',
  'purple-600': '#9333ea',
  'purple-700': '#7e22ce',
  'purple-800': '#6b21a8',
  'purple-900': '#581c87',
  
  // Pink scale
  'pink-50': '#831843',
  'pink-100': '#9f1239',
  'pink-200': '#be185d',
  'pink-400': '#f472b6',
  'pink-600': '#db2777',
  'pink-700': '#be185d',
  'pink-800': '#9f1239',
  'pink-900': '#831843',
  
  // Indigo scale
  'indigo-50': '#312e81',
  'indigo-100': '#3730a3',
  'indigo-200': '#4338ca',
  'indigo-400': '#818cf8',
  'indigo-600': '#4f46e5',
  'indigo-700': '#4338ca',
  'indigo-800': '#3730a3',
  'indigo-900': '#312e81',
  
  // Orange scale
  'orange-50': '#7c2d12',
  'orange-100': '#9a3412',
  'orange-200': '#c2410c',
  'orange-400': '#fb923c',
  'orange-600': '#ea580c',
  'orange-700': '#c2410c',
  'orange-800': '#9a3412',
  'orange-900': '#7c2d12',
  
  // Teal scale
  'teal-50': '#134e4a',
  'teal-100': '#115e59',
  'teal-200': '#0f766e',
  'teal-400': '#2dd4bf',
  'teal-600': '#0d9488',
  'teal-700': '#0f766e',
  'teal-800': '#115e59',
  'teal-900': '#134e4a',
  
  // Emerald scale
  'emerald-50': '#064e3b',
  'emerald-100': '#065f46',
  'emerald-200': '#047857',
  'emerald-400': '#6dcfa6',
  'emerald-600': '#059669',
  'emerald-700': '#047857',
  'emerald-800': '#065f46',
  'emerald-900': '#064e3b',
  
  // Category colors
  'category-red': '#7f1d1d',
  'category-red-text': '#fca5a5',
  'category-blue': '#1e3a5f',
  'category-blue-text': '#93c5fd',
  'category-purple': '#581c87',
  'category-purple-text': '#c084fc',
  'category-pink': '#831843',
  'category-pink-text': '#f9a8d4',
  'category-yellow': '#78350f',
  'category-yellow-text': '#fde047',
  'category-green': '#064e3b',
  'category-green-text': '#6ee7b7',
  'category-indigo': '#312e81',
  'category-indigo-text': '#a5b4fc',
  'category-orange': '#7c2d12',
  'category-orange-text': '#fdba74',
  'category-teal': '#134e4a',
  'category-teal-text': '#5eead4',
  'category-emerald': '#064e3b',
  'category-emerald-text': '#6ee7b7',
  
  // White/black
  'white': '#ffffff',
  'black': '#000000'
};

/**
 * Map btop theme colors to app theme colors
 * @param {Object} btopColors - Colors from btop theme file
 * @returns {Object} App theme colors
 */
export function mapBtopColorsToTheme(btopColors) {
  if (!btopColors) {
    return defaultCaelestiaColors;
  }
  
  // Systematically adjust ALL bright colors from btop for dark background
  // This ensures good contrast throughout the app
  const adjustedAccent = adjustForDarkBg(btopColors.accent || '#a4d397');
  const adjustedAccentHover = adjustForDarkBg(btopColors.accentHover || '#5bd0df');
  const adjustedAccentDark = adjustForDarkBg(btopColors.accentDark || '#6dcfa6');
  const adjustedSuccess = adjustForDarkBg(btopColors.successColor || btopColors.accent || '#a4d397');
  const adjustedError = adjustForDarkBg(btopColors.errorColor || btopColors.accentDark || '#6dcfa6');
  
  // For borders, use a subtle approach like dark theme:
  // - Use div_line/meter_bg if available, but darken them to be subtle
  // - If too bright, mix with background to create subtle borders
  const bgColor = btopColors.background || '#11140f';
  const borderBase = btopColors.borderMain || btopColors.meter_bg || btopColors.selectedBg || '#2a2f26';
  
  // Create subtle borders by mixing border color with background (similar to dark theme approach)
  // This ensures borders are visible but not bright/white
  const borderColor = lightenColor(bgColor, 0.15); // Slightly lighter than background
  const borderLight = lightenColor(bgColor, 0.2); // A bit lighter for subtle dividers
  const borderInput = lightenColor(bgColor, 0.12); // Slightly lighter for input borders
  
  return {
    // Background colors (keep as-is, these are already dark)
    'bg-primary': btopColors.background || defaultCaelestiaColors['bg-primary'],
    'bg-secondary': btopColors.selectedBg || defaultCaelestiaColors['bg-secondary'],
    'bg-accent': btopColors.selectedBg || defaultCaelestiaColors['bg-accent'],
    
    // Text colors (keep as-is, these are already light)
    'text-primary': btopColors.text || defaultCaelestiaColors['text-primary'],
    'text-secondary': btopColors.inactive || defaultCaelestiaColors['text-secondary'],
    'text-tertiary': btopColors.inactive || defaultCaelestiaColors['text-tertiary'],
    
    // Accent colors - ADJUSTED for dark background
    'accent-primary': adjustedAccent,
    'accent-secondary': adjustedAccentDark,
    
    // Button colors - ADJUSTED for dark background
    'button-primary': adjustedAccent,
    'button-hover': adjustedAccentHover,
    
    // Action colors - ADJUSTED for dark background
    'success-color': adjustedSuccess,
    'error-color': adjustedError,
    
    // Info color for informational text (adjusted for dark background)
    'info-color': adjustForDarkBg(btopColors.infoColor || '#5bd0df'),
    
    // Border colors - Use subtle approach like dark/light themes (not bright/white)
    'border-color': borderColor,
    'border-light': borderLight,
    'border-input': borderInput,
    
    'shadow-light': 'rgba(0,0,0,0.5)',
    'shadow-accent': `rgba(${hexToRgb(adjustedAccent)}, 0.2)`,
    
    // Keep other colors from defaults
    ...Object.fromEntries(
      Object.entries(defaultCaelestiaColors).filter(([key]) => 
        !['bg-primary', 'bg-secondary', 'bg-accent', 'text-primary', 'text-secondary', 
          'text-tertiary', 'accent-primary', 'accent-secondary', 'button-primary', 
          'button-hover', 'success-color', 'error-color', 'info-color', 'border-color', 'border-light', 'border-input', 
          'shadow-light', 'shadow-accent'].includes(key)
      )
    )
  };
}

// Helper to convert hex to rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '164, 211, 151';
}

// Export default theme (will be updated dynamically)
export const customTheme = {
  name: 'Custom',
  id: 'custom',
  colors: defaultCaelestiaColors,
  boxShadow: {
    'cozy': '0 4px 20px rgba(0,0,0,0.5)',
    'cozy-accent': '0 2px 8px rgba(164,211,151,0.3)'
  },
  fontFamily: {
    'sans': ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
    'mono': ['SF Mono', 'Monaco', 'monospace']
  }
};

