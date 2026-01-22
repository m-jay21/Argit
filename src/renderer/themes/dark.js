// Dark Theme - Dark version of Cozy
export const darkTheme = {
  name: 'Dark',
  id: 'dark',
  colors: {
    // Primary theme colors - dark versions of cozy browns
    'bg-primary': '#1a1612',
    'bg-secondary': '#25201b',
    'bg-accent': '#2f2821',
    'text-primary': '#e8e4df',
    'text-secondary': '#b8b0a8',
    'text-tertiary': '#9a9086',
    'accent-primary': '#c8a882',
    'accent-secondary': '#d4b896',
    'button-primary': '#a89074',
    'button-hover': '#967d65',
    'success-color': '#7ba04a',
    'error-color': '#d66b65',
    'info-color': '#a89074',
    'border-color': '#3a342d',
    'border-light': '#4a4239',
    'border-input': '#3a342d',
    'shadow-light': 'rgba(0,0,0,0.4)',
    'shadow-accent': 'rgba(200,168,130,0.2)',
    
    // Gray scale - darker versions
    'gray-50': '#1a1612',
    'gray-100': '#25201b',
    'gray-200': '#2f2821',
    'gray-300': '#3a342d',
    'gray-400': '#4a4239',
    'gray-500': '#6b645c',
    'gray-600': '#8a8075',
    'gray-700': '#a89d92',
    'gray-800': '#c4b8ae',
    'gray-900': '#e0d6ca',
    
    // Blue scale (for info/actions) - darker versions
    'blue-50': '#1a1f2e',
    'blue-100': '#1e2a3f',
    'blue-200': '#233550',
    'blue-600': '#3b5a7a',
    'blue-700': '#4a6b8a',
    'blue-800': '#5a7c9a',
    
    // Green scale (for success/positive) - darker versions
    'green-50': '#1a2414',
    'green-100': '#1f2a18',
    'green-400': '#5a7a3d',
    'green-600': '#6b8e3d',
    'green-700': '#7ba04a',
    'green-800': '#8bb257',
    'green-900': '#9bc464',
    
    // Red scale (for errors/negative) - darker versions
    'red-50': '#2e1a1a',
    'red-100': '#3a1f1f',
    'red-200': '#462424',
    'red-400': '#b84a44',
    'red-500': '#c65d57',
    'red-600': '#d66b65',
    'red-700': '#e67973',
    'red-800': '#f68781',
    
    // Yellow scale (for warnings) - darker versions
    'yellow-50': '#2e281a',
    'yellow-100': '#3a321f',
    'yellow-200': '#463c24',
    'yellow-400': '#b89a44',
    'yellow-500': '#c6a857',
    'yellow-600': '#d4b66a',
    'yellow-700': '#e2c47d',
    'yellow-800': '#f0d290',
    
    // Purple scale - darker versions
    'purple-50': '#2a1f2e',
    'purple-100': '#35243a',
    'purple-200': '#402946',
    'purple-400': '#9a6ab8',
    'purple-600': '#a878c6',
    'purple-700': '#b686d4',
    'purple-800': '#c494e2',
    'purple-900': '#d2a2f0',
    
    // Pink scale - darker versions
    'pink-50': '#2e1f28',
    'pink-100': '#3a2432',
    'pink-200': '#46293c',
    'pink-400': '#b86a9a',
    'pink-600': '#c678aa',
    'pink-700': '#d486ba',
    'pink-800': '#e294ca',
    'pink-900': '#f0a2da',
    
    // Indigo scale - darker versions
    'indigo-50': '#1f1f2e',
    'indigo-100': '#24243a',
    'indigo-200': '#292946',
    'indigo-400': '#6a6ab8',
    'indigo-600': '#7878c6',
    'indigo-700': '#8686d4',
    'indigo-800': '#9494e2',
    'indigo-900': '#a2a2f0',
    
    // Orange scale - darker versions
    'orange-50': '#2e241a',
    'orange-100': '#3a2a1f',
    'orange-200': '#463024',
    'orange-400': '#b87a44',
    'orange-600': '#c68857',
    'orange-700': '#d4966a',
    'orange-800': '#e2a47d',
    'orange-900': '#f0b290',
    
    // Teal scale - darker versions
    'teal-50': '#1a2e2a',
    'teal-100': '#1f3a35',
    'teal-200': '#244640',
    'teal-400': '#44b89a',
    'teal-600': '#57c6a8',
    'teal-700': '#6ad4b6',
    'teal-800': '#7de2c4',
    'teal-900': '#90f0d2',
    
    // Emerald scale - darker versions
    'emerald-50': '#1a2e24',
    'emerald-100': '#1f3a2a',
    'emerald-200': '#244630',
    'emerald-400': '#44b87a',
    'emerald-600': '#57c688',
    'emerald-700': '#6ad496',
    'emerald-800': '#7de2a4',
    'emerald-900': '#90f0b2',
    
    // Category colors (for transaction categories) - dark versions
    'category-red': '#4a2a2a',
    'category-red-text': '#f68781',
    'category-blue': '#2a2a4a',
    'category-blue-text': '#7d9acf',
    'category-purple': '#3a2a4a',
    'category-purple-text': '#b686d4',
    'category-pink': '#4a2a3a',
    'category-pink-text': '#d486ba',
    'category-yellow': '#4a3a2a',
    'category-yellow-text': '#d4b66a',
    'category-green': '#2a4a2a',
    'category-green-text': '#8bb257',
    'category-indigo': '#2a2a3a',
    'category-indigo-text': '#8686d4',
    'category-orange': '#4a3a2a',
    'category-orange-text': '#c68857',
    'category-teal': '#2a4a3a',
    'category-teal-text': '#6ad4b6',
    'category-emerald': '#2a4a2a',
    'category-emerald-text': '#7de2a4',
    
    // White/black
    'white': '#ffffff',
    'black': '#000000'
  },
  boxShadow: {
    'cozy': '0 4px 20px rgba(0,0,0,0.5)',
    'cozy-accent': '0 2px 8px rgba(200,168,130,0.3)'
  },
  fontFamily: {
    'sans': ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
    'mono': ['SF Mono', 'Monaco', 'monospace']
  }
};
