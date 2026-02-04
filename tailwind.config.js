/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'u-orange': '#ff7b00',
        'tech-black': '#343741',
        'deep-blue': '#00538B',
        'soft-white': '#F5F5F7',
      },
      borderRadius: {
        'pill': '9999px',
      }
    },
  },
  plugins: [],
}