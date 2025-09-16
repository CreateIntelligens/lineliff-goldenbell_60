/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./resources/**/*.{vue,js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'primary': ['Noto Serif HK', 'serif'],
        'noto-serif-hk': ['Noto Serif HK', 'serif'],
      },
    },
  },
  plugins: [],
}
