/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad8ad',
          300: '#f6bc7a',
          400: '#f19743',
          500: '#ed7b1b',
          600: '#e05d0f',
          700: '#b8420d',
          800: '#933511',
          900: '#772d10',
          950: '#3f1206',
        },
        admin: {
          blue: '#1E40AF',
          red: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}