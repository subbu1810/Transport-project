/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',
        secondary: '#FFC107',
        dark: '#333333',
        light: '#F5F5F5',
      }
    },
  },
  plugins: [],
}
