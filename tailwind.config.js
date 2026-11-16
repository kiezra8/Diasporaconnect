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
        gold: {
          light: '#f9f3dc',
          DEFAULT: '#d4af37',
          dark: '#b8860b',
          deep: '#8c6708',
        },
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        sacco: {
          primary: '#0f172a',
          secondary: '#1e293b',
          accent: '#b8860b',
          surface: '#f8fafc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Cinzel', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Cinzel', 'Cormorant Garamond', 'serif'],
      }
    },
  },
  plugins: [],
}

