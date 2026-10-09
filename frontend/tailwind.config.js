/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A', // Primary Navy
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488', // Primary Medical Teal
          700: '#0F766E',
          900: '#134E4A',
        },
        stock: {
          available: '#059669', // Emerald
          low: '#D97706',       // Amber
          out: '#DC2626',       // Crimson
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
