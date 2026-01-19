/**
 * Parse btop theme file format
 * Format: theme[key]=#color or theme[key]=color
 * Example: theme[main_bg]=#11140f
 */
const parseBtopTheme = (content) => {
  const colors = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Trim whitespace and skip empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Skip comment lines (starting with #)
    if (trimmedLine.startsWith('#')) continue;
    
    // Match format: theme[key]=#color or theme[key]=color
    // Also handles inline comments: theme[key]=#color # comment
    const match = trimmedLine.match(/theme\[(\w+)\]=([#\w]+)/);
    if (match) {
      const key = match[1];
      let color = match[2].trim();
      // Ensure color starts with #
      if (!color.startsWith('#')) {
        color = '#' + color;
      }
      colors[key] = color;
    }
  }
  
  return colors;
};

/**
 * Map btop colors to app color scheme
 * @param {Object} btopColors - Parsed btop theme colors
 * @returns {Object} App color scheme
 */
const mapBtopToAppColors = (btopColors) => {
  return {
    // Background colors
    background: btopColors.main_bg || '#11140f',
    text: btopColors.main_fg || '#e0e4da',
    
    // Accent colors - use highlight/selected colors for primary actions
    accent: btopColors.hi_fg || btopColors.selected_fg || '#a4d397',
    accentHover: btopColors.cpu_box || btopColors.mem_box || '#5bd0df',
    accentDark: btopColors.proc_box || btopColors.net_box || '#6dcfa6',
    
    // Border colors - USE div_line (semantically correct for borders!)
    borderMain: btopColors.div_line || btopColors.meter_bg || '#4e453c',
    borderLight: btopColors.meter_bg || btopColors.inactive_fg || '#9b8f84',
    borderInput: btopColors.div_line || btopColors.meter_bg || '#4e453c',
    
    // Additional colors
    title: btopColors.title || btopColors.main_fg,
    inactive: btopColors.inactive_fg || '#8c9387',
    selectedBg: btopColors.selected_bg || '#1d211b',
    
    // Success/Error colors - use box colors for semantic meaning
    successColor: btopColors.mem_box || btopColors.cpu_box || '#a4d397', // Yellow/peach for positive
    errorColor: btopColors.proc_box || btopColors.net_box || '#6dcfa6', // Pink/orange for expenses
    
    // Info color for informational text (savings pot, etc.)
    infoColor: btopColors.cpu_box || btopColors.net_box || '#5bd0df',
  };
};

/**
 * Parse btop theme file and return app color scheme
 * @param {string} content - File content
 * @returns {Object} App color scheme
 */
function parseBtopThemeFile(content) {
  const btopColors = parseBtopTheme(content);
  return mapBtopToAppColors(btopColors);
}

module.exports = {
  parseBtopThemeFile,
  parseBtopTheme,
  mapBtopToAppColors
};

