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
        primary: {
          DEFAULT: '#9d00ff', // Nebula Purple
          hover: '#b533ff',
        },
        secondary: {
          DEFAULT: '#FFD700', // Golden Spark
          hover: '#ffea4d',
        },
        nebula: {
          900: '#0a0014',
          800: '#1a0033',
          700: '#2d004d',
        }
      },
      backgroundImage: {
        'nebula-gradient': 'linear-gradient(to bottom right, #0a0014, #1a0033, #2d004d)',
        'light-gradient': 'linear-gradient(to bottom right, #f8f5ff, #fffdf2)'
      }
    },
  },
  plugins: [],
}
