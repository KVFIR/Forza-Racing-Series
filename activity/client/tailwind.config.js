/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'safe': 'env(safe-area-inset-top)',
      },
      padding: {
        'safe': 'env(safe-area-inset-top)',
      },
      margin: {
        'safe': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}
