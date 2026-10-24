/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          dark: '#115e59',
        },
      },
    },
  },
  plugins: [],
};
