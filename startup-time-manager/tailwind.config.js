/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        'on-surface': '#1a1c1d',
        'on-surface-variant': '#414755',
        'surface': '#f9f9fb',
        'surface-bright': '#f9f9fb',
        'surface-dim': '#d9dadc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f5',
        'surface-container': '#eeeef0',
        'surface-container-high': '#e8e8ea',
        'surface-container-highest': '#e2e2e4',
        'outline': '#717786',
        'outline-variant': '#c1c6d7',
        'primary': '#0058bc',
        'primary-container': '#0070eb',
        'on-primary': '#ffffff',
        'secondary': '#b61814',
        'secondary-container': '#da342a',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#fffbff',
        'tertiary': '#23684a',
        'tertiary-container': '#3e8161',
        'on-tertiary': '#ffffff',
        'on-background': '#1a1c1d',
        'background': '#f9f9fb',
        'error': '#ba1a1a',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
      },
    }
  },
  plugins: []
}
