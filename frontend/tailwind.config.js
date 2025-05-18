// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
    "./public/index.html" 
  ],
  theme: {
    extend: {
      colors: { 
        'teal': {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
          400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'medieval': ['MedievalSharp', 'cursive'],
        'press-start': ['"Press Start 2P"', 'cursive'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    // require('tailwind-scrollbar')({ nocompatible: true }), 
  ],
}
