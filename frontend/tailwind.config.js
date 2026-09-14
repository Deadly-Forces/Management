/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F17',
        panel: '#111827',
        surface: '#1F2937',
        border: '#1E293B',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          text: '#FFFFFF',
        },
        success: {
          DEFAULT: '#059669',
          bg: 'rgba(5, 150, 105, 0.15)',
          border: 'rgba(5, 150, 105, 0.4)',
          text: '#34D399',
        },
        danger: {
          DEFAULT: '#E11D48',
          bg: 'rgba(225, 29, 72, 0.15)',
          border: 'rgba(225, 29, 72, 0.5)',
          text: '#FB7185',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: 'rgba(217, 119, 6, 0.15)',
          border: 'rgba(217, 119, 6, 0.4)',
          text: '#FBBF24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Geist', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 0 1px #2563EB',
        'panel': '0 4px 12px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}