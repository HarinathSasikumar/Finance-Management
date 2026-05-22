/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
          300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
          600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e',
          600: '#16a34a', 700: '#15803d',
        },
        danger: {
          50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444',
          600: '#dc2626', 700: '#b91c1c',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7',
          600: '#d97706', 700: '#b45309',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'progress': 'progress 1s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        progress: { from: { width: '0%' }, to: {} },
      },
    },
  },
  plugins: [],
}
