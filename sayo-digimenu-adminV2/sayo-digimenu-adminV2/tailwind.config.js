/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'system-ui', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sayo: {
          bg: '#0f0f0f',
          'bg-secondary': '#0a0a0a',
          accent: '#c9a46c',
          'accent-light': '#e2c48e',
          border: '#2a2a2a',
          surface: '#0c0c0c',
        },
      },
      boxShadow: {
        'sayo-sm': '0 1px 3px rgba(0, 0, 0, 0.18)',
        'sayo-md': '0 4px 12px rgba(0, 0, 0, 0.16)',
        'sayo-lg': '0 10px 30px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
}
