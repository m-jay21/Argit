/**
 * Parse btop theme file format
 * Format: theme[key]=#color or theme[key]=color
 * Example: theme[main_bg]=#11140f
 */
const parseBtopTheme = (content) => {
  const colors = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match format: theme[key]=#color or theme[key]=color
    const match = line.match(/theme\[(\w+)\]=([#\w]+)/);
    if (match) {
      const key = match[1];
      let color = match[2];
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
    
    // Accent colors - use highlight/selected colors
    accent: btopColors.hi_fg || btopColors.selected_fg || '#a4d397',
    accentHover: btopColors.cpu_box || btopColors.mem_box || '#5bd0df',
    accentDark: btopColors.proc_box || btopColors.net_box || '#6dcfa6',
    
    // Additional colors for reference
    title: btopColors.title || btopColors.main_fg,
    inactive: btopColors.inactive_fg || '#8c9387',
    selectedBg: btopColors.selected_bg || '#1d211b'
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

