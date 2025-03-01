// const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}', './src/global/components/**/*.{html,tsx}', './index.html'],
  theme: {
    fontFamily: {},
    extend: {
      colors: {
        'success-text': '#0b3521',
        'success-bg': '#d0e7de',
        'success-border': '#a2d0bb',
        'reject-text': '#58151c',
        'reject-bg': '#f7d7d8',
        'reject-border': '#f2aeb5',
      },
      keyframes: {
        spin: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      },
      animation: {
        'spin-2s': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.success-card': {
          color: '#0b3521',
          backgroundColor: '#d0e7de',
          borderColor: '#a2d0bb',
        },
        '.reject-card': {
          color: '#58151c',
          backgroundColor: '#f7d7d8',
          borderColor: '#f2aeb5',
        },
      });
    },
  ],
};
