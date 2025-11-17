/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
        },
      },
      boxShadow: {
        header: '0 12px 30px -20px rgba(37, 99, 235, 0.45)',
      },
    },
  },
  plugins: [],
}

