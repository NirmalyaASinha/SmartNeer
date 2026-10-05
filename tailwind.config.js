/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F6FB5',
        navy: '#0B2A4A',
        success: '#2E7D4F',
        warning: '#C78A10',
        critical: '#A32A2A',
      }
    },
  },
  plugins: [],
}
