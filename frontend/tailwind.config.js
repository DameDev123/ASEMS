/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#0c1c31', 900: '#142b4a', 800: '#203e63', 700: '#2e537d' },
        gold: { 500: '#b18a39', 400: '#c5a45c' },
      },
      boxShadow: { panel: '0 2px 12px rgba(15, 35, 60, 0.05)' },
    },
  },
  plugins: [],
};
