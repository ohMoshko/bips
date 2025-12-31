/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        correct: '#538d4e',    // Green - correct position
        present: '#b59f3b',    // Yellow - wrong position
        absent: '#3a3a3c',     // Gray - not in word
        tile: '#121213',       // Tile background
        key: '#818384',        // Keyboard key
      },
      animation: {
        'flip': 'flip 0.5s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'pop': 'pop 0.1s ease-in-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
