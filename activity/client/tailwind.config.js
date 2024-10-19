/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./main.jsx", // Добавлен путь к main.jsx
  ],
  theme: {
    extend: {
      spacing: {
        'safe-top': 'var(--sait)',
        'safe-bottom': 'var(--saib)',
        'safe-left': 'var(--sail)',
        'safe-right': 'var(--sair)',
      },
      fontSize: {
        // Пример пользовательских размеров шрифта
        'xxl': '2.5rem',
        'xxxl': '3rem',
      },
    },
  },
  plugins: [],
}
