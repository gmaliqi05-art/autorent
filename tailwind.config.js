/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff8ff',
          100: '#dbeefe',
          200: '#bee0fd',
          300: '#91cefb',
          400: '#5db4f7',
          500: '#3894f2',
          600: '#2276e7',
          700: '#1a60d4',
          800: '#1b4eac',
          900: '#1c4488',
          950: '#152a53',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc170',
          400: '#ff9d37',
          500: '#ff8210',
          600: '#f06806',
          700: '#c74e07',
          800: '#9e3d0e',
          900: '#7f340f',
          950: '#451805',
        },
        dark: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b1bac8',
          400: '#8795a9',
          500: '#68788e',
          600: '#536076',
          700: '#444e60',
          800: '#3b4351',
          900: '#343a46',
          950: '#1e2229',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
