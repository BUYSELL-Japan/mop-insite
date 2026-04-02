/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'rotate(0deg) translateY(0)' },
          '25%': { transform: 'rotate(-5deg) translateY(-2px)' },
          '75%': { transform: 'rotate(5deg) translateY(-2px)' }
        }
      },
      animation: {
        shake: 'shake 1s ease-in-out infinite'
      }
    },
  },
  plugins: [],
};