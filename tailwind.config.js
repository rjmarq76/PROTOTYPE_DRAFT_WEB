import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        steel: '#40516d',
        azure: '#2563eb',
        mint: '#0f9f6e',
        amber: { ...colors.amber, DEFAULT: '#d97706' },
        rose: { ...colors.rose, DEFAULT: '#e11d48' },
        cloud: '#f5f7fb',
      },
      boxShadow: {
        panel: '0 12px 30px rgba(22, 32, 51, 0.08)',
      },
    },
  },
  plugins: [],
};
